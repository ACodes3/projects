SELECT current_database();


BEGIN;

CREATE TABLE slayers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'slayer',
    rank TEXT,
    breathing_style_ids TEXT[] DEFAULT '{}',
    technique_ids TEXT[] DEFAULT '{}',
    related_character_ids TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    stats JSONB DEFAULT '{}',
    image TEXT
);

CREATE TABLE demons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'demon',
    rank TEXT,
    blood_demon_art_ids TEXT[] DEFAULT '{}',
    ability_ids TEXT[] DEFAULT '{}',
    related_character_ids TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    stats JSONB DEFAULT '{}',
    image TEXT
);

CREATE TABLE breathing_styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'breathing-style',
    derived_from_id TEXT
        REFERENCES breathing_styles(id)
        DEFERRABLE INITIALLY DEFERRED,
    user_ids TEXT[] DEFAULT '{}',
    technique_ids TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    theme JSONB DEFAULT '{}',
    image TEXT
);

CREATE TABLE blood_demon_arts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'blood-demon-art',
    user_id TEXT
        REFERENCES demons(id)
        DEFERRABLE INITIALLY DEFERRED,
    ability_ids TEXT[] DEFAULT '{}',
    description TEXT DEFAULT '',
    theme JSONB DEFAULT '{}',
    image TEXT
);

CREATE TABLE techniques (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'technique',
    category TEXT NOT NULL
        CHECK (
            category IN (
                'breathing',
                'blood-demon-art'
            )
        ),
    parent_id TEXT NOT NULL,
    user_ids TEXT[] DEFAULT '{}',
    description TEXT DEFAULT ''
);

COMMIT;


SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
