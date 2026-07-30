-- Product catalog reference table (replaces hardcoded CHECK on license_keys.product)
CREATE TABLE IF NOT EXISTS products (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO products (code, name, description) VALUES
  ('erp', 'DFlowERP', 'Modular self-hosted ERP: WMS, SCM, MES, POS, Backup, Finance'),
  ('crm', 'DFlowCRM', 'Self-hosted CRM: Sales, Service, Analytics, Marketing, Integrations')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE license_keys DROP CONSTRAINT IF EXISTS license_keys_product_check;
ALTER TABLE license_keys
  ADD CONSTRAINT license_keys_product_fkey FOREIGN KEY (product) REFERENCES products(code);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE license_keys ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON products;
CREATE POLICY "service_role_only" ON products
  FOR ALL USING (auth.role() = 'service_role');
