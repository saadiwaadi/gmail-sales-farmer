import os
import sys
import argparse

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.validator import validate_draft

def main():
    parser = argparse.ArgumentParser(description="Validate email draft quality and constraints")
    parser.add_argument("--subject", required=True, help="The subject line of the draft")
    parser.add_argument("--body", required=True, help="The body of the draft")
    
    args = parser.parse_args()
    
    result = validate_draft(args.subject, args.body)
    
    print(f"Validation Status: {result['status']}")
    print(f"Word Count: {result['word_count']}")
    
    if result["reasons"]:
        print("Reasons:")
        for r in result["reasons"]:
            print(f" - {r}")
        if result["status"] == "FAIL":
            sys.exit(1)
            
if __name__ == "__main__":
    main()
