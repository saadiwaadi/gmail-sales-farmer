CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  company TEXT,
  role TEXT,
  industry TEXT,
  raw_dump TEXT,
  extracted_profile TEXT,   -- JSON stored as text
  normalized_research TEXT, -- Normalized Markdown summary of raw research
  structured_memory TEXT,   -- JSON stored as text
  context_cache TEXT,       -- Dense prose summary
  memory_updated_at TEXT,
  memory_version INTEGER DEFAULT 0,
  provider_used TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  direction TEXT,        -- 'outbound' | 'inbound_reply'
  tone_used TEXT,
  subject_line TEXT,
  body TEXT,
  outcome TEXT,           -- 'no_response'|'opened'|'replied'|'booked'|'rejected'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tone_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER REFERENCES clients(id),
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS llm_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  provider TEXT,
  model TEXT,
  prompt_length INTEGER,
  response_length INTEGER,
  execution_time_ms INTEGER,
  status TEXT             -- 'success' | 'failure'
);

CREATE TABLE IF NOT EXISTS prompt_cache (
  prompt_hash TEXT PRIMARY KEY,
  model TEXT,
  response TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

