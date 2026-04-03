ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_kind VARCHAR(30);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS snippet_title VARCHAR(160);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS snippet_language VARCHAR(30);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS snippet_code TEXT;

UPDATE messages
SET message_kind = COALESCE(NULLIF(message_kind, ''), 'CHAT')
WHERE message_kind IS NULL OR message_kind = '';

ALTER TABLE messages
    ALTER COLUMN message_kind SET NOT NULL;
