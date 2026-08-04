import os
import time
import sqlite3
import hashlib
from google import genai
from google.genai import types
from providers.base import BaseProvider

class GeminiProvider(BaseProvider):
    # Static list of request timestamps to track sliding-window rate limit across calls/instances
    _request_times = []

    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        # Instantiate the official Google GenAI client
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = "gemini-3.5-flash-lite"

    def _get_db_path(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(os.path.dirname(current_dir), "db", "outreach.db")

    def _check_cache(self, prompt_hash: str) -> str:
        db_path = self._get_db_path()
        if not os.path.exists(db_path):
            return None
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT response FROM prompt_cache WHERE prompt_hash = ? AND model = ?",
                (prompt_hash, self.model_name)
            )
            row = cursor.fetchone()
            conn.close()
            if row:
                return row[0]
        except Exception as e:
            print(f"[Warning] Failed to check prompt cache: {e}")
        return None

    def _save_cache(self, prompt_hash: str, response: str):
        db_path = self._get_db_path()
        if not os.path.exists(db_path):
            return
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO prompt_cache (prompt_hash, model, response) VALUES (?, ?, ?)",
                (prompt_hash, self.model_name, response)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[Warning] Failed to save to prompt cache: {e}")

    def _is_429(self, e) -> bool:
        if getattr(e, 'code', None) == 429 or getattr(e, 'status_code', None) == 429:
            return True
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            return True
        return False

    def _apply_rate_limit(self):
        now = time.time()
        # Filter request timestamps to only include those in the last 60 seconds
        GeminiProvider._request_times = [t for t in GeminiProvider._request_times if now - t < 60.0]
        
        if len(GeminiProvider._request_times) >= 12:
            # Cap hit. Wait until the oldest request clears the 60s sliding window.
            oldest_timestamp = GeminiProvider._request_times[0]
            sleep_time = 60.0 - (now - oldest_timestamp)
            if sleep_time > 0:
                print(f"[Rate Limiter] Capped at 12 requests/minute. Waiting {sleep_time:.2f} seconds before continuing...")
                time.sleep(sleep_time)
            # Recheck sliding window after sleep
            self._apply_rate_limit()
        else:
            GeminiProvider._request_times.append(time.time())

    def generate(self, prompt: str, json_mode: bool = False) -> str:
        start_time = time.perf_counter()
        
        # 1. Prompt Caching Check
        prompt_hash = hashlib.sha256(prompt.encode('utf-8')).hexdigest()
        cached_response = self._check_cache(prompt_hash)
        if cached_response is not None:
            print(f"[Cache Hit] Serving response from local prompt_cache for hash: {prompt_hash}")
            self.log_call(
                provider="gemini",
                model=f"{self.model_name} (cache hit)",
                prompt=prompt,
                response=cached_response,
                duration_ms=0,
                success=True
            )
            return cached_response

        # 2. Rate Limiting Check
        self._apply_rate_limit()

        success = False
        response_text = ""
        max_attempts = 3
        backoffs = [20, 40]
        
        for attempt in range(1, max_attempts + 1):
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
                break
            except Exception as e:
                if self._is_429(e) and attempt < max_attempts:
                    wait_sec = backoffs[attempt - 1]
                    print(f"[Retry] 429 RESOURCE_EXHAUSTED on attempt {attempt}/{max_attempts}. Waiting {wait_sec}s before retry...")
                    time.sleep(wait_sec)
                else:
                    response_text = str(e)
                    break
        
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        
        self.log_call(
            provider="gemini",
            model=self.model_name,
            prompt=prompt,
            response=response_text if success else f"Error: {response_text}",
            duration_ms=duration_ms,
            success=success
        )
        
        if success:
            self._save_cache(prompt_hash, response_text)
            return response_text
        else:
            raise RuntimeError(f"Gemini API execution failed: {response_text}")
