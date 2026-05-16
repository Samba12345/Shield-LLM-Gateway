import Database from "better-sqlite3";

// Initialize DB
const db = new Database("shield_gateway.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    prompt_length INTEGER,
    response_length INTEGER,
    status TEXT,
    security_flag BOOLEAN,
    tokens_estimate INTEGER
  );
`);

export default db;
