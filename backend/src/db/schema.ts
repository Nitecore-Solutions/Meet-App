export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  city TEXT,
  state TEXT,
  bio TEXT,
  avatar_url TEXT,
  avatar_media_id TEXT,
  relationship_status TEXT,
  looking_for TEXT,
  profession TEXT,
  education TEXT,
  drinking TEXT,
  smoking TEXT,
  eating TEXT,
  zodiac TEXT,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  interested_in TEXT,
  min_age INTEGER NOT NULL DEFAULT 18,
  max_age INTEGER NOT NULL DEFAULT 99,
  show_photos_only BOOLEAN NOT NULL DEFAULT FALSE,
  show_other_cities BOOLEAN NOT NULL DEFAULT TRUE,
  radius_km INTEGER NOT NULL DEFAULT 100,
  hidden_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  facebook_verified BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_active_at TIMESTAMPTZ,
  is_plus BOOLEAN NOT NULL DEFAULT FALSE,
  plus_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Idempotent migrations for databases created by an earlier schema.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email) WHERE email IS NOT NULL;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS drinking TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS smoking TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS eating TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zodiac TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interested_in TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS min_age INTEGER NOT NULL DEFAULT 18;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_age INTEGER NOT NULL DEFAULT 99;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_photos_only BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_other_cities BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS radius_km INTEGER NOT NULL DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_discovery_idx
  ON users(is_online, last_active_at DESC);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('verify_email', 'reset_password')),
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_tokens_user_idx
  ON auth_tokens(user_id, type, created_at DESC);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx
  ON refresh_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('avatar', 'gallery', 'chat')),
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  storage_driver TEXT NOT NULL DEFAULT 'local' CHECK (storage_driver = 'local'),
  storage_key TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  declared_duration_seconds DOUBLE PRECISION,
  duration_seconds DOUBLE PRECISION,
  duration_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS media_expiry_idx ON media(status, expires_at);
CREATE INDEX IF NOT EXISTS media_owner_idx ON media(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL UNIQUE REFERENCES media(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_photos_position_idx
  ON user_photos(user_id, position);

CREATE TABLE IF NOT EXISTS likes (
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS passes (
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON blocks(blocked_id, blocker_id);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  last_message_at TIMESTAMPTZ,
  CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);
CREATE INDEX IF NOT EXISTS matches_user_a_idx ON matches(user_a_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS matches_user_b_idx ON matches(user_b_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
  text TEXT,
  media_id TEXT REFERENCES media(id) ON DELETE SET NULL,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS messages_match_created_idx
  ON messages(match_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_idx
  ON messages(sender_id, match_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS read_states (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS billing_checkouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('mock', 'order', 'subscription')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider_order_id TEXT,
  provider_subscription_id TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS billing_checkouts_user_idx
  ON billing_checkouts(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS billing_checkouts_order_idx
  ON billing_checkouts(provider_order_id)
  WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS billing_checkouts_subscription_idx
  ON billing_checkouts(provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  checkout_id TEXT REFERENCES billing_checkouts(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_subscription_id TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx
  ON subscriptions(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_razorpay_idx
  ON subscriptions(razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_checkout_idx
  ON subscriptions(checkout_id)
  WHERE checkout_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  payload TEXT,
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  UNIQUE (provider, event_id)
);
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS last_error TEXT;
`;
