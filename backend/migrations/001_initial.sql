CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL,
  excerpt      text NOT NULL,
  body         text NOT NULL DEFAULT '',
  tag          text NOT NULL CHECK (tag IN ('System Entry', 'Research', 'Archived', 'Drafting')),
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  cover_image  text,
  read_time    text,
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section    text NOT NULL,
  key        text NOT NULL,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (section, key)
);

CREATE TABLE IF NOT EXISTS experience_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role        text NOT NULL,
  company     text NOT NULL,
  period      text NOT NULL,
  description text[] NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  category   text NOT NULL,
  icon       text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS social_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   text NOT NULL,
  url        text NOT NULL,
  label      text NOT NULL,
  icon       text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
