BEGIN;

CREATE TABLE IF NOT EXISTS slayers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'slayer',
  rank TEXT,
  breathing_style_ids TEXT[] NOT NULL DEFAULT '{}',
  technique_ids TEXT[] NOT NULL DEFAULT '{}',
  related_character_ids TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  image TEXT
);

CREATE TABLE IF NOT EXISTS demons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'demon',
  rank TEXT,
  blood_demon_art_ids TEXT[] NOT NULL DEFAULT '{}',
  ability_ids TEXT[] NOT NULL DEFAULT '{}',
  related_character_ids TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  image TEXT
);

CREATE TABLE IF NOT EXISTS breathing_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'breathing-style',
  derived_from_id TEXT REFERENCES breathing_styles(id) DEFERRABLE INITIALLY DEFERRED,
  user_ids TEXT[] NOT NULL DEFAULT '{}',
  technique_ids TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  image TEXT
);

CREATE TABLE IF NOT EXISTS blood_demon_arts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'blood-demon-art',
  user_id TEXT REFERENCES demons(id) DEFERRABLE INITIALLY DEFERRED,
  ability_ids TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT '',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  image TEXT
);

CREATE TABLE IF NOT EXISTS techniques (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'technique',
  category TEXT NOT NULL CHECK (category IN ('breathing', 'blood-demon-art')),
  parent_id TEXT NOT NULL,
  user_ids TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL DEFAULT ''
);

COMMIT;
