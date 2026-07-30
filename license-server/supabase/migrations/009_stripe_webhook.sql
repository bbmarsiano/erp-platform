-- Idempotency for Stripe Checkout webhooks + allow monthly billing / null lifetime expiry
ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS license_keys_stripe_checkout_session_id_uidx
  ON license_keys (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

ALTER TABLE license_keys
  DROP CONSTRAINT IF EXISTS license_keys_billing_type_check;

ALTER TABLE license_keys
  ADD CONSTRAINT license_keys_billing_type_check
  CHECK (billing_type IN ('monthly', 'annual', 'lifetime', 'trial'));

-- lifetime licenses may omit expiry (validate-license treats billing_type = lifetime as never-expiring)
ALTER TABLE license_keys
  ALTER COLUMN expires_at DROP NOT NULL;
