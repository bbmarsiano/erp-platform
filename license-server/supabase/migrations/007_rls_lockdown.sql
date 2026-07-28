-- Ensure RLS stays on and no anon/authenticated policies exist for license tables.
-- Privileged access is only via secret key inside Edge Functions.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Drop any accidentally-permissive policies for public roles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('tenants', 'license_keys', 'validation_log', 'pricing_config')
      AND policyname <> 'service_role_only'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Keep / recreate service_role-only policies (legacy JWT path during migration)
DROP POLICY IF EXISTS "service_role_only" ON tenants;
DROP POLICY IF EXISTS "service_role_only" ON license_keys;
DROP POLICY IF EXISTS "service_role_only" ON validation_log;
DROP POLICY IF EXISTS "service_role_only" ON pricing_config;

CREATE POLICY "service_role_only" ON tenants
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON license_keys
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON validation_log
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_only" ON pricing_config
  FOR ALL USING (auth.role() = 'service_role');
