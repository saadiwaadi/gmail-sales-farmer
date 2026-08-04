import os
import sys
from dotenv import load_dotenv
from providers.gemini_provider import GeminiProvider
from providers.mock_provider import MockProvider

# Load env variables immediately on import of config module
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path)

_active_provider = None

def get_provider():
    """
    Returns the active LLM provider singleton instance.
    Reads ACTIVE_PROVIDER environment variable, defaulting to "mock" if unset.
    If ACTIVE_PROVIDER is "gemini", initializes GeminiProvider (requires GEMINI_API_KEY).
    """
    global _active_provider
    if _active_provider is None:
        active_provider = os.environ.get("ACTIVE_PROVIDER", "mock").lower()
        if active_provider == "gemini":
            gemini_key = os.environ.get("GEMINI_API_KEY")
            if not gemini_key:
                print("Error: GEMINI_API_KEY environment variable is not set, but 'gemini' is configured as ACTIVE_PROVIDER.")
                sys.exit(1)
            try:
                _active_provider = GeminiProvider(api_key=gemini_key)
            except ValueError as e:
                print(f"Error: {e}")
                sys.exit(1)
        else:
            _active_provider = MockProvider()
            
    return _active_provider
