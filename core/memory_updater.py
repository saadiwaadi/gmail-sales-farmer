import os
import sqlite3
import json
import datetime
from core.memory_reader import MemoryReader
from core.skills import load_skill
from providers.config import get_provider

class MemoryUpdater:
    def __init__(self, db_path=None):
        if db_path is None:
            env_db = os.environ.get("DB_PATH")
            if env_db:
                db_path = env_db
            else:
                core_dir = os.path.dirname(os.path.abspath(__file__))
                db_path = os.path.join(os.path.dirname(core_dir), "db", "outreach.db")
        self.db_path = db_path
        self.reader = MemoryReader(db_path=db_path)

    def update_client_memory(self, client_id: int) -> bool:
        """
        Updates the client's structured memory and context cache by combining old memory
        with new interactions/data using the LLM provider.
        """
        # Fetch current snapshot
        snapshot = self.reader.get_client_memory(client_id)
        if not snapshot:
            print(f"Error: Client ID {client_id} not found in database.")
            return False

        if snapshot.get("is_manually_overridden"):
            print(f"Skipping memory update for client '{snapshot['name']}' (manually overridden/locked).")
            return True

        # Assemble new information section
        new_info = {
            "extracted_profile": snapshot["extracted_profile"],
            "tone_notes": snapshot["tone_notes"],
            "message_history": snapshot["message_history"]
        }
        
        # Load compressor skill and interpolate
        try:
            prompt = load_skill(
                "memory/compressor.md",
                old_memory=json.dumps(snapshot["structured_memory"], indent=2),
                old_cache=snapshot["context_cache"] or "No context cache exists yet.",
                new_information=json.dumps(new_info, indent=2)
            )
        except Exception as e:
            print(f"Error loading memory compressor skill: {e}")
            return False

        print(f"Running memory update pipeline for client '{snapshot['name']}'...")
        
        try:
            provider = get_provider()
            response_text = provider.generate(prompt, json_mode=True)
            
            # Clean formatting if LLM includes backticks
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                lines = cleaned_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                cleaned_text = "\n".join(lines).strip()
                
            # Parse JSON response
            output_json = json.loads(cleaned_text)
            
            structured_memory = output_json.get("structured_memory")
            context_cache = output_json.get("context_cache")
            
            if structured_memory is None or context_cache is None:
                print("Error: LLM response missing 'structured_memory' or 'context_cache'.")
                print("Raw Response was:")
                print(response_text)
                return False
                
            # Connect to database and update client
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            new_version = snapshot["memory_version"] + 1
            now_str = datetime.datetime.now().isoformat()
            provider_name = "gemini" # Since we config to gemini-2.5-flash
            
            cursor.execute(
                """UPDATE clients 
                   SET structured_memory = ?, 
                       context_cache = ?, 
                       memory_version = ?, 
                       memory_updated_at = ?, 
                       provider_used = ?,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?""",
                (
                    json.dumps(structured_memory, indent=2),
                    context_cache.strip(),
                    new_version,
                    now_str,
                    provider_name,
                    client_id
                )
            )
            conn.commit()
            conn.close()
            
            print(f"Memory updated successfully to version {new_version}.")
            return True
            
        except Exception as e:
            print(f"Error during memory update execution: {e}")
            return False
