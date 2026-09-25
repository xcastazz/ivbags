CREATE TABLE IF NOT EXISTS admin_profiles (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_message_id TEXT UNIQUE,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL
);
