-- Allow trial billing type
ALTER TABLE license_keys
  DROP CONSTRAINT IF EXISTS license_keys_billing_type_check;

ALTER TABLE license_keys
  ADD CONSTRAINT license_keys_billing_type_check
  CHECK (billing_type IN ('annual', 'lifetime', 'trial'));

-- Ensure tenants have email column (already in 001, safe no-op)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS email TEXT;
