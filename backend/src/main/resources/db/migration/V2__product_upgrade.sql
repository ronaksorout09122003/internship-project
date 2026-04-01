ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(160);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(2000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills VARCHAR(500);

UPDATE users
SET display_name = COALESCE(
    NULLIF(display_name, ''),
    SUBSTRING(email, 1, POSITION('@' IN email) - 1)
)
WHERE display_name IS NULL OR display_name = '';

UPDATE users
SET timezone = COALESCE(NULLIF(timezone, ''), 'UTC')
WHERE timezone IS NULL OR timezone = '';

ALTER TABLE users
    ALTER COLUMN display_name SET NOT NULL;

ALTER TABLE users
    ALTER COLUMN timezone SET NOT NULL;

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS agenda VARCHAR(1600);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(30);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS language VARCHAR(30);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS template_key VARCHAR(60);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS student_goal VARCHAR(1600);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mentor_notes VARCHAR(4000);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS homework VARCHAR(2400);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS resource_links VARCHAR(2400);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS next_steps VARCHAR(2400);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS student_rating INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS student_feedback VARCHAR(2000);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP;

UPDATE sessions
SET duration_minutes = COALESCE(duration_minutes, 60),
    difficulty = COALESCE(difficulty, 'INTERMEDIATE'),
    language = COALESCE(language, 'TYPESCRIPT'),
    template_key = COALESCE(template_key, 'PAIR_PROGRAMMING')
WHERE duration_minutes IS NULL
   OR difficulty IS NULL
   OR language IS NULL
   OR template_key IS NULL;

ALTER TABLE sessions
    ALTER COLUMN duration_minutes SET NOT NULL;

ALTER TABLE sessions
    ALTER COLUMN difficulty SET NOT NULL;

ALTER TABLE sessions
    ALTER COLUMN language SET NOT NULL;
