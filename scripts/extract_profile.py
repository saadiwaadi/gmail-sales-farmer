import os
import sys
import sqlite3
import json

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.skills import load_skill
from core.prompt_builder import build_prompt
from providers.config import get_provider

def get_db_path():
    env_db = os.environ.get("DB_PATH")
    if env_db:
        return env_db
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(os.path.dirname(script_dir), "db", "outreach.db")

def run_extraction(client_id):
    db_path = get_db_path()
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}. Please initialize database first.")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get client raw dump
    cursor.execute("SELECT name, company, raw_dump FROM clients WHERE id = ?", (client_id,))
    row = cursor.fetchone()
    if not row:
        print(f"Error: Client with ID {client_id} not found in database.")
        conn.close()
        sys.exit(1)

    name, company, raw_dump = row
    if not raw_dump or not raw_dump.strip():
        print(f"Error: Raw dump for client '{name}' ({company}) is empty. Cannot extract profile.")
        conn.close()
        sys.exit(1)

    print(f"Extracting profile for client '{name}' ({company})...")

    try:
        provider = get_provider()
        
        # 1. Normalization Step
        print("Running normalization on raw research...")
        normalizer_skill = load_skill("research/normalizer.md", raw_dump=raw_dump)
        normalizer_prompt = build_prompt(skill_template=normalizer_skill, raw_dump=raw_dump)
        normalized_research = provider.generate(normalizer_prompt, json_mode=False)
        print("Raw research normalized successfully.")

        # Save normalized research to database
        cursor.execute(
            "UPDATE clients SET normalized_research = ? WHERE id = ?",
            (normalized_research, client_id)
        )
        conn.commit()

        # 2. Extraction Step
        print("Running profile extraction on normalized research...")
        analyst_skill = load_skill("research/analyst.md", raw_dump=normalized_research)
        analyst_prompt = build_prompt(skill_template=analyst_skill, raw_dump=normalized_research)
        response_text = provider.generate(analyst_prompt, json_mode=True)
        
        # Clean response if it contains markdown formatting
        cleaned_content = response_text.strip()
        if cleaned_content.startswith("```"):
            lines = cleaned_content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            cleaned_content = "\n".join(lines).strip()

        # Parse JSON to validate structure
        profile_data = json.loads(cleaned_content)
        
        # Ensure standard keys exist
        required_keys = [
            "pain_points_inferred",
            "recent_signals",
            "tone_of_voice",
            "credibility_signals",
            "likely_priorities",
            "avoid_mentioning"
        ]
        for key in required_keys:
            if key not in profile_data:
                profile_data[key] = "" if key == "tone_of_voice" else []

        formatted_json = json.dumps(profile_data, indent=2)

        # 3. Save back to database
        cursor.execute(
            "UPDATE clients SET extracted_profile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (formatted_json, client_id)
        )
        conn.commit()
        print("Profile successfully extracted and saved to database.")
        print(formatted_json)

    except Exception as e:
        print(f"Error executing profile extraction: {e}")
        conn.close()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_profile.py <client_id>")
        sys.exit(1)
        
    try:
        cid = int(sys.argv[1])
    except ValueError:
        print("Error: Client ID must be an integer.")
        sys.exit(1)
        
    run_extraction(cid)
