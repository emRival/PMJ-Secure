import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'passwords.db';
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    username TEXT, -- Optional username for the saved entry
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Migration: Add username column if it doesn't exist
try {
  db.exec("ALTER TABLE passwords ADD COLUMN username TEXT");
} catch (e) {
  // Column likely already exists, ignore
}

// Migration: Add 2FA columns to users
try {
  db.exec("ALTER TABLE users ADD COLUMN two_factor_secret TEXT");
} catch (e) { }

try {
  db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
} catch (e) { }

// Migration: Add passkey credentials table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS passkey_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      credential_id TEXT UNIQUE NOT NULL,
      credential_public_key TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
} catch (e) {
  console.log('Passkey table migration:', e.message);
}

export default db;
