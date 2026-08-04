import os
import time
from google import genai
from google.genai import types
from providers.base import BaseProvider

class GeminiProvider(BaseProvider):
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        # Instantiate the official Google GenAI client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-3.5-flash"

    def generate(self, prompt: str, json_mode: bool = False) -> str:
        start_time = time.perf_counter()
        success = False
        response_text = ""
        
        try:
            config = None
            if json_mode:
                config = types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
                
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            response_text = response.text
            success = True
            return response_text
        except Exception as e:
            response_text = str(e)
            raise e
        finally:
            end_time = time.perf_counter()
            duration_ms = int((end_time - start_time) * 1000)
            # Log the call using base class log_call method
            self.log_call(
                provider="gemini",
                model=self.model_name,
                prompt=prompt,
                response=response_text if success else f"Error: {response_text}",
                duration_ms=duration_ms,
                success=success
            )
