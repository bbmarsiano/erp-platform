CREATE TABLE IF NOT EXISTS pricing_config (
  id          TEXT PRIMARY KEY DEFAULT 'default',
  config      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO pricing_config (id, config) VALUES ('default', '{
  "currency": "EUR",
  "annual": {
    "base": 490,
    "users_11_25": 150,
    "users_26_50": 250,
    "users_51_plus": 400
  },
  "lifetime": {
    "base": 1490,
    "users_11_25": 450,
    "users_26_50": 750,
    "users_51_plus": 1200
  },
  "grace_period_days": 14,
  "grace_period_readonly": false
}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS max_installs INTEGER DEFAULT 3;

ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';

UPDATE license_keys SET max_installs = 3 WHERE max_installs IS NULL;

ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON pricing_config
  FOR ALL USING (auth.role() = 'service_role');
