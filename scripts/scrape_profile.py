import os
import sys
import json

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.skills import load_skill
from core.prompt_builder import build_prompt
from providers.config import get_provider

def run_profile_scrape(file_path):
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"Error: Raw text file not found at {file_path}"}))
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        raw_dump = f.read()

    if not raw_dump or not raw_dump.strip():
        print(json.dumps({"error": "Error: Raw pasted profile content is empty."}))
        sys.exit(1)

    try:
        provider = get_provider()
        
        # Load skill and build prompt
        scraper_skill = load_skill("research/contact_scraper.md", raw_dump=raw_dump)
        scraper_prompt = f"RAW PROFILE TEXT:\n{raw_dump}"
        
        # Write debug prompt file
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        debug_prompt_path = os.path.join(project_dir, "debug_prompt.txt")
        with open(debug_prompt_path, "w", encoding="utf-8") as df:
            df.write(f"SYSTEM PROMPT:\n{scraper_skill}\n\n========================================\n\nPROMPT:\n{scraper_prompt}")
        
        response_text = provider.generate(
            prompt=scraper_prompt,
            json_mode=True,
            system_prompt=scraper_skill
        )
        
        # Write debug response file
        debug_response_path = os.path.join(project_dir, "debug_response.txt")
        with open(debug_response_path, "w", encoding="utf-8") as df:
            df.write(response_text)
        
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
        required_keys = ["name", "company", "role", "industry", "email", "phone", "source", "notes"]
        for key in required_keys:
            if key not in profile_data:
                profile_data[key] = ""

        print(json.dumps(profile_data, indent=2))

    except Exception as e:
        print(json.dumps({"error": f"Error executing profile scraping: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python scrape_profile.py <file_path>"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    run_profile_scrape(file_path)
