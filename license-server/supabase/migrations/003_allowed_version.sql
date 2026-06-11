-- Add allowed_version to license_keys
ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS allowed_version TEXT DEFAULT NULL;

-- NULL means "no update available"
-- '0.3.0' means "this client can update to v0.3.0"

-- Add comment for clarity
COMMENT ON COLUMN license_keys.allowed_version IS
  'If set, ERP shows update notification to client. NULL = no update available.';
