# DFlowERP License Server

This module contains:

- Supabase SQL migration for license management schema.
- Supabase Edge Function for runtime license validation.
- React/Vite admin panel for tenant and license operations.

## Structure

- `supabase/migrations/001_license_schema.sql` - schema, RLS policies, and demo seed records.
- `supabase/functions/validate-license/index.ts` - key validation endpoint.
- `admin/` - UI for dashboard, tenants, licenses, and key generation.

## Admin Local Run

```bash
cd license-server/admin
pnpm install
pnpm dev
```

Default URL: `http://localhost:5174`

