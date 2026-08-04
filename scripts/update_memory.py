import os
import sys
import argparse

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.memory_updater import MemoryUpdater

def main():
    parser = argparse.ArgumentParser(description="Update client memory and context cache")
    parser.add_argument("client_id", type=int, help="The client ID to update memory for")
    args = parser.parse_args()
    
    updater = MemoryUpdater()
    success = updater.update_client_memory(args.client_id)
    if not success:
        sys.exit(1)
    print("Memory update CLI finished successfully.")

if __name__ == "__main__":
    main()
