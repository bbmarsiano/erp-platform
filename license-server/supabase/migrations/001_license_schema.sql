CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  company     TEXT,
  plan        TEXT NOT NULL DEFAULT 'standard',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE license_keys (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key               TEXT NOT NULL UNIQUE,
  features          TEXT[] NOT NULL DEFAULT ARRAY[
    'module:wms','module:scm','module:mes','module:pos','module:backup'
  ],
  max_users         INTEGER NOT NULL DEFAULT 10,
  expires_at        TIMESTAMPTZ NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  install_count     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  result      TEXT NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER license_keys_updated_at
  BEFORE UPDATE ON license_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON tenants
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON license_keys
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON validation_log
  FOR ALL USING (auth.role() = 'service_role');

INSERT INTO tenants (name, email, company, plan)
  VALUES ('Demo Client', 'demo@client.bg', 'Demo EOOD', 'standard');

INSERT INTO license_keys (tenant_id, key, expires_at)
  VALUES (
    (SELECT id FROM tenants WHERE email = 'demo@client.bg'),
    'DEMO-0000-0000-0000',
    now() + interval '1 year'
  );

