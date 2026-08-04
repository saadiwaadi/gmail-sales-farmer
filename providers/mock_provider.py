import json
import time
from providers.base import BaseProvider

class MockProvider(BaseProvider):
    def __init__(self):
        self.model_name = "mock-gemini-2.5-flash"

    def generate(self, prompt: str, json_mode: bool = False) -> str:
        start_time = time.perf_counter()
        response_text = ""
        success = True
        
        try:
            if "normalizer.md" in prompt or "normalize it into a clean" in prompt:
                response_text = """### Business Overview
- **Name**: Vertex Tech
- **Industry**: Logistics API Integrations
- **Core Offerings**: High-throughput, lightning-fast API integrations for logistics companies.

### Key People & Roles
- **Jane Doe**: VP of Engineering and Founder (founded in 2023).

### Recent Signals
- Expanded to Chicago by opening a second engineering office.
- Actively seeking local Chicago infrastructure/DevOps talent.

### Technical Infrastructure & Pain Points
- Build stability problems with GitHub Actions CI/CD pipelines.
- CI/CD builds take 45+ minutes and fail randomly.
- Prefers direct, technical, blunt communication (e.g. in engineering blogs).

### Reputation & Feedback
- Google review: 4.2/5 rating. API is robust and fast.
- Pain point: Developer documentation is extremely sparse; takes 3 weeks to integrate.
"""
            elif "compressor.md" in prompt or "context_cache" in prompt or "old_memory" in prompt or "running internal memory" in prompt:
                response_text = json.dumps({
                    "structured_memory": {
                        "current_angle": "Resolving 45+ minute CI/CD build issues",
                        "preferred_tone": "Direct, blunt and technical",
                        "last_outcome": "no_response",
                        "avoid_topics": ["generic introductions", "sales talk"],
                        "known_preferences": ["focus on code snippets and metrics"]
                    },
                    "context_cache": "Jane Doe is the VP of Engineering at Vertex Tech. They are experiencing 45+ minute build lag on GitHub Actions and recently expanded to Chicago. The initial outbound email focused on build optimization."
                }, indent=2)
            elif "analyst.md" in prompt or "raw_dump" in prompt or "RAW DUMP" in prompt:
                response_text = json.dumps({
                    "pain_points_inferred": ["Build stability issues", "Slow CI/CD pipelines"],
                    "recent_signals": ["Opened second engineering office in Chicago"],
                    "tone_of_voice": "Direct, technical, and slightly blunt",
                    "credibility_signals": ["Rating: 4.2/5", "Founded in 2023"],
                    "likely_priorities": ["Speeding up GitHub Actions", "Hiring in Chicago"],
                    "avoid_mentioning": ["Vertex Tech does logistics API integrations"]
                }, indent=2)
            else:
                # Default to writing/outreach draft
                response_text = json.dumps({
                    "subject_line": "GitHub Actions build stability",
                    "body": "Hey Jane,\n\nSaw you're scaling Chicago talent and working on infrastructure.\n\nWe optimize GitHub Actions configurations to prevent random failures. We typically get build times under 5 minutes.\n\nLet me know if this is a priority right now.\n\nBest,\nAlex"
                }, indent=2)
                
            return response_text
        except Exception as e:
            response_text = str(e)
            success = False
            raise e
        finally:
            end_time = time.perf_counter()
            duration_ms = int((end_time - start_time) * 1000)
            self.log_call(
                provider="mock",
                model=self.model_name,
                prompt=prompt,
                response=response_text if success else f"Error: {response_text}",
                duration_ms=duration_ms,
                success=success
            )
