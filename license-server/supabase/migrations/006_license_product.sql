-- Add product column for multi-product licensing (DFlowERP + DFlowCRM)
ALTER TABLE license_keys
  ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT 'erp';

COMMENT ON COLUMN license_keys.product IS
  'Product this license applies to: erp (DFlowERP) or crm (DFlowCRM)';

-- Optional check constraint for known products
ALTER TABLE license_keys
  DROP CONSTRAINT IF EXISTS license_keys_product_check;

ALTER TABLE license_keys
  ADD CONSTRAINT license_keys_product_check
  CHECK (product IN ('erp', 'crm'));
