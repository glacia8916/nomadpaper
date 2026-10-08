CREATE TABLE IF NOT EXISTS backup_runs (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_runs_started
ON backup_runs(started_at);

CREATE TABLE IF NOT EXISTS backup_chunks (
  id TEXT PRIMARY KEY NOT NULL,
  backup_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (backup_id) REFERENCES backup_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backup_chunks_backup_table
ON backup_chunks(backup_id, table_name, chunk_index);

PRAGMA optimize;
