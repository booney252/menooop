import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// One file. Back it up by copying it.
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "sandbox.db");
export const EXPORT_DIR = path.join(DATA_DIR, "exports");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS inspo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  creator TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'youtube',
  added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  transcript TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  beats TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '',
  rating INTEGER
);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  hook TEXT NOT NULL DEFAULT '',
  one_line TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL DEFAULT 'vlog',
  status TEXT NOT NULL DEFAULT 'idea',
  inspo_id INTEGER REFERENCES inspo(id) ON DELETE SET NULL,
  script TEXT NOT NULL DEFAULT '',
  beats TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  platform TEXT NOT NULL DEFAULT 'youtube',
  posted_at TEXT NOT NULL DEFAULT (date('now')),
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,
  follows_gained INTEGER,
  link_clicks INTEGER,
  founding_spots INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  logged_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS videos_posted_at ON videos(posted_at);
`;

declare global {
  // eslint-disable-next-line no-var
  var __sandboxDb: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

// Cached on globalThis so Next's dev hot reload does not open a new handle per change.
export function getDb(): Database.Database {
  if (!globalThis.__sandboxDb) globalThis.__sandboxDb = open();
  return globalThis.__sandboxDb;
}
