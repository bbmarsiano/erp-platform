ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'annual'
    CHECK (billing_type IN ('annual', 'lifetime'));

ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS price_paid NUMERIC DEFAULT NULL;

ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

COMMENT ON COLUMN license_keys.billing_type IS
  'annual = SaaS subscription with controlled updates; lifetime = perpetual license with all updates';
