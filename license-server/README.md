# DFlow License Server

Supabase-based license server for **DFlowERP** and **DFlowCRM**.

## Architecture

```
[Installer / App] ──POST──▶ [validate-license Edge Function]  (secret key, no user auth)
[Admin SPA] ──Auth JWT──▶ [admin-* Edge Functions]           (secret key + ADMIN_EMAILS)
                                 │
                                 ▼
                         [Supabase PostgreSQL]
                         tenants + license_keys + validation_log + pricing_config
                         (RLS on; no anon/authenticated policies)
```

## Security model (new API keys)

| Key | Where | Purpose |
|-----|-------|---------|
| `sb_publishable_…` (`VITE_SUPABASE_PUBLISHABLE_KEY`) | Admin SPA only | Supabase Auth (`signInWithPassword`) + invoking Edge Functions |
| `sb_secret_…` (`SUPABASE_SECRET_KEYS.default`) | Edge Functions only | Bypasses RLS for privileged DB ops |
| User JWT | `Authorization: Bearer` | End-user session; checked against `ADMIN_EMAILS` allowlist |

**Never put a secret / service_role key in Vite env vars.** Legacy `anon` / `service_role` keys should be deactivated after migration is verified.

## Setup

### 1. SQL migrations
Run `supabase/migrations/*.sql` in order (through `007_rls_lockdown.sql`).

### 2. Edge Function secrets (Dashboard → Edge Functions → Secrets)

| Secret | Example |
|--------|---------|
| `ADMIN_EMAILS` | `you@company.com,other@company.com` |

`SUPABASE_URL` and `SUPABASE_SECRET_KEYS` are provided by the platform.

### 3. Deploy functions

```bash
supabase functions deploy validate-license --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-list-licenses --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-create-license --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-revoke-license --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-update-license --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-list-tenants --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-create-tenant --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-update-tenant --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-get-pricing --project-ref lvhraynmvyvancqyezef
supabase functions deploy admin-update-pricing --project-ref lvhraynmvyvancqyezef
```

All admin functions set `verify_jwt = false` (new keys are not JWTs); auth is enforced in-function via `auth.getUser(token)` + `ADMIN_EMAILS`.

### 4. Admin SPA

```bash
cd admin
cp .env.example .env
# Set:
#   VITE_SUPABASE_URL=https://lvhraynmvyvancqyezef.supabase.co
#   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
pnpm install
pnpm dev
```

Create a Supabase Auth user (Authentication → Users) whose email is listed in `ADMIN_EMAILS`, then sign in on the login screen.

### 5. Vercel (dflow-license-admin)

- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Remove `VITE_SUPABASE_SERVICE_KEY` and `VITE_ADMIN_PASSWORD`
- Redeploy

## validate-license API

```bash
curl -X POST https://lvhraynmvyvancqyezef.supabase.co/functions/v1/validate-license \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_..." \
  -d '{"key":"DEMO-0000-0000-0000"}'
```

Response includes `product` (`erp` | `crm`), `features`, `billingType`, etc.

## Products

| product | Modules |
|---------|---------|
| `erp` (default) | wms, scm, mes, pos, backup, finance |
| `crm` | sales, service, analytics, marketing, integrations |

## Offline grace period

Installer caches a valid license in `~/.dflow/license_cache.json` (30 days).
