def validate_draft(subject: str, body: str) -> dict:
    """
    Validates a generated email draft against strict structural and content constraints.
    Checks:
    - Word count (warns if above 150 words)
    - Presence of banned phrases ("I noticed", "I came across", "I hope this finds you well", "I wanted to reach out")
    
    Args:
        subject (str): The subject line of the email.
        body (str): The body content of the email.
        
    Returns:
        dict: A dictionary containing:
            - 'status': 'PASS' or 'FAIL'
            - 'word_count': integer word count
            - 'reasons': list of failure reasons
    """
    reasons = []
    status = "PASS"
    
    # 1. Word count check
    words = body.split()
    word_count = len(words)
    if word_count > 150:
        reasons.append(f"Word count exceeds limit: {word_count} words (max: 150)")
        status = "FAIL"
        
    # 2. Banned phrases check (case-insensitive)
    banned_phrases = [
        "I noticed",
        "I came across",
        "I hope this finds you well",
        "I wanted to reach out"
    ]
    
    body_lower = body.lower()
    for phrase in banned_phrases:
        if phrase.lower() in body_lower:
            reasons.append(f"Contains banned phrase: '{phrase}'")
            status = "FAIL"
            
    return {
        "status": status,
        "word_count": word_count,
        "reasons": reasons
    }
