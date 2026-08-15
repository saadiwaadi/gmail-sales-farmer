import json

GLOBAL_CONSTRAINTS = """GLOBAL SYSTEM CONSTRAINTS:
- Do not use exclamation points unless the sender's own email examples do.
- Keep the writing conversational, direct, and completely authentic.
- NEVER use generic cold-outreach templates, structures, or mass-outreach signaling.
- Output ONLY valid, parsable JSON matching the exact schema specified in the skill."""

def build_prompt(
    skill_template: str,
    structured_memory: dict = None,
    context_cache: str = None,
    example_emails: list = None,
    global_constraints: str = None,
    **task_variables
) -> str:
    """
    Assembles a complete prompt string for LLM execution in the required order:
    1. Selected Skill
    2. Global Constraints
    3. Structured Memory
    4. Context Cache
    5. Example Emails
    6. Current Task Variables (appended if they are not already formatted into the skill template)
    
    Args:
        skill_template (str): The raw skill Markdown prompt content.
        structured_memory (dict): Structured client memory JSON.
        context_cache (str): Prose client context cache.
        example_emails (list): List of strings containing past email examples.
        global_constraints (str): Overriding global constraints string.
        **task_variables: Key-value pairs interpolated into the skill template.
        
    Returns:
        str: The final combined prompt.
    """
    # 1. Selected Skill
    # The skill is already loaded and formatted by load_skill()
    skill_section = skill_template
        
    prompt_parts = [skill_section.strip()]
    
    # 2. Global Constraints
    constraints = global_constraints if global_constraints is not None else GLOBAL_CONSTRAINTS
    if constraints:
        prompt_parts.append(constraints.strip())
        
    # 3. Structured Memory
    if structured_memory:
        mem_block = f"CLIENT STRUCTURED MEMORY:\n{json.dumps(structured_memory, indent=2)}"
        prompt_parts.append(mem_block)
        
    # 4. Context Cache
    if context_cache:
        cache_block = f"CLIENT HISTORICAL CONTEXT CACHE:\n{context_cache.strip()}"
        prompt_parts.append(cache_block)
        
    # 5. Example Emails
    if example_emails:
        examples_block = "SENDER'S PAST EMAIL EXAMPLES (FOR VOICE MATCHING):\n"
        for i, email in enumerate(example_emails, 1):
            examples_block += f"\n--- Example {i} ---\n{email.strip()}\n"
        prompt_parts.append(examples_block.strip())
        
    # 6. Current Task Variables
    # If any task variables were not consumed by the formatting above, we can append them
    # as extra context for transparency. We'll check if they are already in the skill_section.
    extra_context_parts = []
    for k, v in task_variables.items():
        placeholder = f"{{{k}}}"
        # If placeholder wasn't in original skill template, append it as context
        if placeholder not in skill_template:
            if k == "raw_dump":
                if v and str(v) not in skill_template:
                    extra_context_parts.append(f"RAW PROFILE TEXT:\n{v}")
            else:
                val_str = json.dumps(v, indent=2) if isinstance(v, (dict, list)) else str(v)
                extra_context_parts.append(f"{k.upper()}: {val_str}")
            
    if extra_context_parts:
        extra_block = "CURRENT TASK VARIABLES:\n" + "\n".join(extra_context_parts)
        prompt_parts.append(extra_block)
        
    # Join with clean separators
    return "\n\n==================================================\n\n".join(prompt_parts)
