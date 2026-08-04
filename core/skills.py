import os

def load_skill(path: str, **variables) -> str:
    """
    Loads a skill markdown file and interpolates placeholders using Python's formatting.
    
    Args:
        path (str): Relative path under the 'skills/' folder (e.g. 'research/analyst.md')
                    or absolute path to the skill file.
        **variables: Keyword arguments for placeholder formatting.
        
    Returns:
        str: The formatted skill content.
    """
    core_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(core_dir)
    
    # Resolve file path
    skill_path = os.path.join(project_dir, "skills", path)
    if not os.path.exists(skill_path):
        # Fallback to direct absolute/relative path if not under skills/
        if os.path.exists(path):
            skill_path = path
        else:
            raise FileNotFoundError(f"Skill file not found at {skill_path} or {path}")
            
    with open(skill_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    try:
        return content.format(**variables)
    except KeyError as ke:
        print(f"[Warning] Missing formatting key when loading skill '{path}': {ke}")
        raise ke
