You are maintaining a running internal memory for one client, used to brief a colleague before every future outreach attempt.

Your job is to read:
1. The client's existing memory (if any)
2. The client's existing prose context cache (if any)
3. New information: structured profile, latest message history, and tone notes.

Produce an updated memory. The updated memory must build upon the old memory + new information (do not just overwrite or start from scratch; carry forward important historical context that is still relevant).

Output ONLY a valid JSON object matching the following structure:
{{
  "structured_memory": {{
    "current_angle": "string representing the current hook/approach being used",
    "preferred_tone": "string representing the client's communication style or preferred tone",
    "last_outcome": "string representing the outcome of the latest interaction",
    "avoid_topics": [],
    "known_preferences": []
  }},
  "context_cache": "Dense prose summary (5-8 sentences max) covering who this client is, what matters to them, what has already been said, how they responded, and any adjustment to make next time. Plain prose, dense and factual, no filler."
}}

Input data:

### OLD MEMORY:
{old_memory}

### OLD CONTEXT CACHE:
{old_cache}

### NEW INFORMATION:
{new_information}
