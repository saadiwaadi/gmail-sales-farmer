import os
import sqlite3

def run_migration():
    db_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(db_dir, "outreach.db")
    schema_path = os.path.join(db_dir, "schema.sql")

    if not os.path.exists(db_path):
        print("Database not found. Initializing database from schema...")
        if not os.path.exists(schema_path):
            print(f"Error: schema.sql not found at {schema_path}")
            return False
        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.executescript(schema_sql)
        conn.commit()
        conn.close()
        print("Database created and initialized successfully.")
        return True

    print("Database found. Running migrations...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check columns in clients table
    cursor.execute("PRAGMA table_info(clients)")
    columns = [col[1] for col in cursor.fetchall()]

    new_columns = {
        "normalized_research": "TEXT",
        "structured_memory": "TEXT",
        "context_cache": "TEXT",
        "memory_updated_at": "TEXT",
        "memory_version": "INTEGER DEFAULT 0",
        "provider_used": "TEXT"
    }

    for col_name, col_type in new_columns.items():
        if col_name not in columns:
            print(f"Adding column '{col_name}' to 'clients' table...")
            cursor.execute(f"ALTER TABLE clients ADD COLUMN {col_name} {col_type}")

    # Ensure llm_logs table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS llm_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      provider TEXT,
      model TEXT,
      prompt_length INTEGER,
      response_length INTEGER,
      execution_time_ms INTEGER,
      status TEXT
    );
    """)

    # Ensure prompt_cache table exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prompt_cache (
      prompt_hash TEXT PRIMARY KEY,
      model TEXT,
      response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
    print("Database migrations applied successfully.")
    return True

if __name__ == "__main__":
    run_migration()
