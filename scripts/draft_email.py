import os
import sys
import sqlite3
import json
import argparse

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.skills import load_skill
from core.prompt_builder import build_prompt
from core.memory_reader import MemoryReader
from core.memory_updater import MemoryUpdater
from core.strategy import get_strategy
from core.validator import validate_draft
from providers.config import get_provider

def get_paths():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    env_db = os.environ.get("DB_PATH")
    db_path = env_db if env_db else os.path.join(project_dir, "db", "outreach.db")
    emails_path = os.path.join(project_dir, "examples", "my_emails.json")
    return db_path, emails_path

def run_draft(client_id, tone, instruction=None):
    db_path, emails_path = get_paths()
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}. Please initialize database first.")
        sys.exit(1)

    if not os.path.exists(emails_path):
        print(f"Error: Examples file not found at {emails_path}.")
        sys.exit(1)

    # 1. Read past email examples
    try:
        with open(emails_path, "r", encoding="utf-8") as f:
            example_emails = json.load(f)
    except Exception as e:
        print(f"Error loading {emails_path}: {e}")
        sys.exit(1)

    # 2. Read memory and database status for client
    reader = MemoryReader(db_path=db_path)
    snapshot = reader.get_client_memory(client_id)
    if not snapshot:
        print(f"Error: Client with ID {client_id} not found in database.")
        sys.exit(1)

    if not snapshot["extracted_profile"]:
        print(f"Error: Structured profile for client '{snapshot['name']}' has not been extracted yet.")
        print(f"Please run: python main.py extract {client_id}")
        sys.exit(1)

    # 3. Determine Strategy
    strategy = get_strategy(snapshot["extracted_profile"])
    print(f"Using Strategy: '{strategy}'")

    # Validate tone file availability
    db_path, emails_path = get_paths()
    script_file_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_file_dir)
    tones_dir = os.path.join(project_dir, "skills", "writing", "tones")
    
    available_tones = []
    if os.path.exists(tones_dir):
        for filename in os.listdir(tones_dir):
            if filename.endswith(".md"):
                available_tones.append(filename[:-3])

    if tone not in available_tones:
        print(f"Error: Tone file for '{tone}' does not exist.")
        print(f"Available tones under skills/writing/tones/: {', '.join(sorted(available_tones))}")
        sys.exit(1)

    print(f"Drafting email for client '{snapshot['name']}' ({snapshot['company']}) using tone '{tone}'...")

    try:
        # 4. Load writing skill base and tone instructions
        outreach_template = load_skill("writing/outreach.md", tone=tone)
        tone_file_path = os.path.join(tones_dir, f"{tone}.md")
        with open(tone_file_path, "r", encoding="utf-8") as f:
            tone_template = f.read()
            
        skill_template = outreach_template + "\n\n" + tone_template
        if instruction and instruction.strip():
            skill_template += f"\n\nCRITICAL CUSTOM DRAFTING INSTRUCTIONS FROM USER:\n- Follow these custom constraints strictly: {instruction.strip()}"

        # 5. Build prompt using centralized Prompt Builder
        # Include current task variables and strategy details
        prompt = build_prompt(
            skill_template=skill_template,
            structured_memory=snapshot["structured_memory"],
            context_cache=snapshot["context_cache"],
            example_emails=example_emails,
            tone=tone,
            strategy=strategy,
            client_name=snapshot["name"],
            company_name=snapshot["company"],
            role=snapshot["role"],
            extracted_profile=snapshot["extracted_profile"]
        )

        # 6. Call active LLM provider
        provider = get_provider()
        response_text = provider.generate(prompt, json_mode=True)

        # Clean JSON markdown blocks
        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```"):
            lines = cleaned_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_text = "\n".join(lines).strip()

        # Parse output JSON
        draft_data = json.loads(cleaned_text)
        subject = draft_data.get("subject_line", "").strip()
        body = draft_data.get("body", "").strip()

        if not subject or not body:
            print("Error: Draft subject or body is missing in LLM response.")
            print(cleaned_text)
            sys.exit(1)

        # 7. Validate output using Validator
        val_result = validate_draft(subject, body)
        print("\n" + "="*50)
        print(f"DRAFT VALIDATION STATUS: {val_result['status']}")
        if val_result["status"] == "FAIL":
            print("WARNING: Draft failed constraints!")
            for reason in val_result["reasons"]:
                print(f" - {reason}")
        print("="*50)
        print(f"SUBJECT: {subject}")
        print("="*50)
        print(body)
        print("="*50 + "\n")

        # 8. Save draft to messages table
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO messages (client_id, direction, tone_used, subject_line, body, outcome)
               VALUES (?, 'outbound', ?, ?, ?, 'no_response')""",
            (client_id, tone, subject, body)
        )
        conn.commit()
        conn.close()
        print("Draft successfully saved to database messages log.")

        # 9. Trigger immediate memory update so context cache matches latest outbound interaction
        updater = MemoryUpdater(db_path=db_path)
        print("Triggering automatic memory update...")
        updater.update_client_memory(client_id)

    except Exception as e:
        print(f"Error during draft email execution: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Draft an email for a client.")
    parser.add_argument("client_id", type=int, help="The client ID")
    parser.add_argument("--tone", default="direct", help="Requested email tone")
    parser.add_argument("--instruction", default=None, help="Custom drafting instructions")
    
    args = parser.parse_args()
    run_draft(args.client_id, args.tone, args.instruction)
