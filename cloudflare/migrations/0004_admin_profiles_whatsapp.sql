CREATE TABLE IF NOT EXISTS admin_profiles (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  photo_key TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wa_id TEXT NOT NULL,
  customer_name TEXT,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  provider_message_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_id_created_at
  ON whatsapp_messages (wa_id, created_at DESC);
