import json
import time
from providers.base import BaseProvider

class MockProvider(BaseProvider):
    def __init__(self):
        self.model_name = "mock-gemini-2.5-flash"

    def generate(self, prompt: str, json_mode: bool = False, system_prompt: str = None) -> str:
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
            elif (system_prompt and "contact_scraper.md" in system_prompt) or "contact_scraper.md" in prompt or "RAW PROFILE TEXT" in prompt:
                import re
                
                # Try to extract raw copy-pasted text from prompt
                raw_text = ""
                marker = "RAW PROFILE TEXT:"
                if marker in prompt:
                    raw_text = prompt.split(marker, 1)[1].strip()
                else:
                    raw_text = prompt.strip()
                
                # Heuristic extraction
                name = ""
                company = ""
                role = ""
                industry = ""
                email = ""
                phone = ""
                source = ""
                notes = ""
                
                # Regex for email
                email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
                if email_match:
                    email = email_match.group(0)
                    
                # Regex for phone
                phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
                if phone_match:
                    phone = phone_match.group(0)
                
                # Common explicit field patterns (e.g. "Name: Sarah")
                name_match = re.search(r'(?:Name|Full Name|Contact):\s*([^\n\r]+)', raw_text, re.IGNORECASE)
                if name_match:
                    name = name_match.group(1).strip()
                    
                company_match = re.search(r'(?:Company|Organization|Works at):\s*([^\n\r]+)', raw_text, re.IGNORECASE)
                if company_match:
                    company = company_match.group(1).strip()
                    
                role_match = re.search(r'(?:Role|Title|Job Title|Position):\s*([^\n\r]+)', raw_text, re.IGNORECASE)
                if role_match:
                    role = role_match.group(1).strip()
                    
                industry_match = re.search(r'(?:Industry|Sector):\s*([^\n\r]+)', raw_text, re.IGNORECASE)
                if industry_match:
                    industry = industry_match.group(1).strip()
                    
                source_match = re.search(r'(?:Source|Referral|Channel):\s*([^\n\r]+)', raw_text, re.IGNORECASE)
                if source_match:
                    source = source_match.group(1).strip()
                
                # Line-by-line fallback analysis
                lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
                
                # Fallback Name: check first few lines
                if not name and lines:
                    for line in lines[:3]:
                        # Skip if line contains email or phone or is too long/short
                        if "@" in line or any(char.isdigit() for char in line):
                            continue
                        words = line.split()
                        if 1 <= len(words) <= 4:
                            name = line
                            break
                            
                # Fallback Company: check for "at [Company]" or similar patterns
                if not company:
                    company_patterns = [
                        r'\b(?:at|works at|founder of|CEO of|VP of|joined)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+in|\s+since|\s+to|\s+and|\s*[\n\r.,]|$)'
                    ]
                    for pattern in company_patterns:
                        m = re.search(pattern, raw_text)
                        if m:
                            company = m.group(1).strip()
                            break
                            
                # Fallback Role: look for common titles
                if not role:
                    role_patterns = [
                        r'\b(?:VP|CEO|Founder|Director|Manager|Engineer|Developer|Specialist|Consultant|Architect|Lead)\b[^\n\r.,]*'
                    ]
                    for pattern in role_patterns:
                        m = re.search(pattern, raw_text, re.IGNORECASE)
                        if m:
                            role = m.group(0).strip()
                            break
                            
                # Fallbacks if still not found
                if not name:
                    name = ""
                if not company:
                    company = ""
                if not role:
                    role = ""
                if not industry:
                    industry = ""
                if not email:
                    email = ""
                if not phone:
                    phone = ""
                if not source:
                    source = ""
                    
                # Create cohesive summary notes matching the new guidelines
                confidence = "High" if len(raw_text) > 100 else "Low"
                notes = (
                    f"Business overview: {company} operates in the {industry} sector.\n"
                    f"Main offerings: Engineering, design, or specialized services.\n"
                    f"People/team structure: Managed by {name} ({role}).\n"
                    f"Customer/client journey: Initial inquiry, service delivery, and follow-up.\n"
                    f"Repeated themes: Focus on efficiency, team expertise, and client care.\n"
                    f"Relevant operational signals: Technical stability and delivery processes.\n"
                    f"Strongest personalization angle: Address how their team can optimize {industry} workflows.\n"
                    f"Possible software/service connection: API integrations and custom support.\n"
                    f"Confidence level: {confidence}\n"
                    f"Things to avoid: Generic templates or reference to unrelated operations."
                )
                
                response_text = json.dumps({
                    "name": name,
                    "company": company,
                    "role": role,
                    "industry": industry,
                    "email": email,
                    "phone": phone,
                    "source": source,
                    "notes": notes
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
