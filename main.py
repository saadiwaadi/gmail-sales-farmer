import os
import sys
from dotenv import load_dotenv

# Load .env file at startup
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env"))

import sqlite3
import argparse
from db.migrate import run_migration
from scripts.extract_profile import run_extraction
from scripts.draft_email import run_draft
from core.memory_updater import MemoryUpdater

def get_db_path():
    env_db = os.environ.get("DB_PATH")
    if env_db:
        return env_db
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(script_dir, "db", "outreach.db")

def add_client(args):
    db_path = get_db_path()
    
    name = args.name
    company = args.company
    role = args.role
    industry = args.industry
    raw_dump = None
    
    # Check if we should read raw dump from file
    if args.file:
        if not os.path.exists(args.file):
            print(f"Error: Raw dump file not found at {args.file}")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            raw_dump = f.read()
            
    # Interactive prompting if values are missing
    if not name:
        name = input("Client Name: ").strip()
    if not company:
        company = input("Company Name: ").strip()
    if not role:
        role = input("Role: ").strip()
    if not industry:
        industry = input("Industry: ").strip()
        
    if not raw_dump:
        print("\nEnter/paste the raw dump text. Press Ctrl+Z (Windows) or Ctrl+D (Unix) followed by Enter to finish:")
        try:
            raw_dump = sys.stdin.read().strip()
        except KeyboardInterrupt:
            print("\nOperation cancelled.")
            sys.exit(1)
            
    if not name or not company or not raw_dump:
        print("Error: Name, Company, and Raw Dump are required to add a client.")
        sys.exit(1)
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO clients (name, company, role, industry, raw_dump)
           VALUES (?, ?, ?, ?, ?)""",
        (name, company, role, industry, raw_dump)
    )
    client_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    print(f"\nClient '{name}' from '{company}' successfully added with ID: {client_id}")

def add_note(args):
    db_path = get_db_path()
    client_id = args.client_id
    note = args.note
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Validate client exists
    cursor.execute("SELECT name, company FROM clients WHERE id = ?", (client_id,))
    row = cursor.fetchone()
    if not row:
        print(f"Error: Client with ID {client_id} not found.")
        conn.close()
        sys.exit(1)
        
    name, company = row
    
    if not note:
        note = input(f"Enter tone note for client '{name}' ({company}): ").strip()
        
    if not note:
        print("Error: Note text cannot be empty.")
        conn.close()
        sys.exit(1)
        
    cursor.execute(
        "INSERT INTO tone_notes (client_id, note) VALUES (?, ?)",
        (client_id, note)
    )
    conn.commit()
    conn.close()
    
    print(f"Tone note added for client '{name}' ({company}).")

def main():
    # Automatically execute database migrations on CLI invocation
    run_migration()
    
    parser = argparse.ArgumentParser(description="Outreach Bot CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # add-client command
    parser_add = subparsers.add_parser("add-client", help="Add a new client to the database")
    parser_add.add_argument("--name", help="Name of the client")
    parser_add.add_argument("--company", help="Company name")
    parser_add.add_argument("--role", help="Client's role")
    parser_add.add_argument("--industry", help="Client's industry")
    parser_add.add_argument("--file", help="Path to text file containing raw dump")
    
    # extract command
    parser_extract = subparsers.add_parser("extract", help="Extract structured profile from raw dump")
    parser_extract.add_argument("client_id", type=int, help="ID of the client to extract profile for")
    
    # draft command
    parser_draft = subparsers.add_parser("draft", help="Draft a personalized cold outreach email")
    parser_draft.add_argument("client_id", type=int, help="ID of the client to draft email for")
    parser_draft.add_argument("--tone", default="direct", help="Requested email tone")
    parser_draft.add_argument("--instruction", default=None, help="Custom drafting instructions")
    
    # add-note command
    parser_note = subparsers.add_parser("add-note", help="Add a communication tone note/feedback for a client")
    parser_note.add_argument("client_id", type=int, help="ID of the client")
    parser_note.add_argument("note", nargs="?", default=None, help="The note content")
    
    # update-memory command
    parser_memory = subparsers.add_parser("update-memory", help="Manually run the memory compression update")
    parser_memory.add_argument("client_id", type=int, help="ID of the client to update memory for")
    
    args = parser.parse_args()
    
    if args.command == "add-client":
        add_client(args)
    elif args.command == "extract":
        run_extraction(args.client_id)
    elif args.command == "draft":
        run_draft(args.client_id, args.tone, args.instruction)
    elif args.command == "add-note":
        add_note(args)
    elif args.command == "update-memory":
        db_path = get_db_path()
        updater = MemoryUpdater(db_path=db_path)
        updater.update_client_memory(args.client_id)

if __name__ == "__main__":
    main()
