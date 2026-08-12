import os
import sqlite3
import json

class MemoryReader:
    def __init__(self, db_path=None):
        if db_path is None:
            env_db = os.environ.get("DB_PATH")
            if env_db:
                db_path = env_db
            else:
                core_dir = os.path.dirname(os.path.abspath(__file__))
                db_path = os.path.join(os.path.dirname(core_dir), "db", "outreach.db")
        self.db_path = db_path

    def get_client_memory(self, client_id: int) -> dict:
        """
        Retrieves the complete memory snapshot for a client from the database.
        
        Args:
            client_id (int): The client ID.
            
        Returns:
            dict: The memory snapshot dictionary, or None if client not found.
        """
        if not os.path.exists(self.db_path):
            return None

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT name, company, role, industry, raw_dump, extracted_profile, 
                      structured_memory, context_cache, memory_updated_at, 
                      memory_version, provider_used, is_manually_overridden
               FROM clients WHERE id = ?""",
            (client_id,)
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None
            
        (
            name, company, role, industry, raw_dump, extracted_profile,
            structured_memory, context_cache, memory_updated_at,
            memory_version, provider_used, is_manually_overridden
        ) = row
        
        # Parse JSON blocks
        profile_json = {}
        if extracted_profile:
            try:
                profile_json = json.loads(extracted_profile)
            except json.JSONDecodeError:
                pass
                
        memory_json = {}
        if structured_memory:
            try:
                memory_json = json.loads(structured_memory)
            except json.JSONDecodeError:
                pass
                
        # Fetch tone notes
        cursor.execute("SELECT note, created_at FROM tone_notes WHERE client_id = ?", (client_id,))
        tone_notes = [r[0] for r in cursor.fetchall()]
        
        # Fetch message history
        cursor.execute(
            """SELECT direction, tone_used, subject_line, body, outcome, created_at 
               FROM messages WHERE client_id = ? ORDER BY created_at ASC""",
            (client_id,)
        )
        messages = []
        for r in cursor.fetchall():
            messages.append({
                "direction": r[0],
                "tone_used": r[1],
                "subject_line": r[2],
                "body": r[3],
                "outcome": r[4],
                "created_at": r[5]
            })
            
        conn.close()
        
        return {
            "client_id": client_id,
            "name": name,
            "company": company,
            "role": role,
            "industry": industry,
            "raw_dump": raw_dump,
            "extracted_profile": profile_json,
            "structured_memory": memory_json,
            "context_cache": context_cache or "",
            "memory_updated_at": memory_updated_at,
            "memory_version": memory_version or 0,
            "provider_used": provider_used,
            "is_manually_overridden": bool(is_manually_overridden),
            "tone_notes": tone_notes,
            "message_history": messages
        }
