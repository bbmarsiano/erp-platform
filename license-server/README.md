# DFlow License Server

Supabase-базиран лицензен сървър за **DFlowERP** и **DFlowCRM**.

## Архитектура

```
[Go Installer / App Startup] ──POST──▶ [validate-license Edge Function]
                                          │
                                          ▼
                                  [Supabase PostgreSQL]
                                  tenants + license_keys (product: erp|crm) + validation_log
```

## Setup

### 1. SQL миграция
Supabase Dashboard → SQL Editor → изпълни migrations in order under
`supabase/migrations/` (includes `006_license_product.sql` for multi-product support).

### 2. Deploy Edge Function
```bash
supabase functions deploy validate-license \
  --project-ref lvhraynmvyvancqyezef \
  --no-verify-jwt
```

### 3. Admin панел
```bash
cd admin
cp .env.example .env
# Попълни VITE_SUPABASE_URL и VITE_SUPABASE_SERVICE_KEY
pnpm install
pnpm dev
# http://localhost:5174
```

## API

```bash
# Валидация на лиценз
curl -X POST https://lvhraynmvyvancqyezef.supabase.co/functions/v1/validate-license \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"key":"DEMO-0000-0000-0000"}'

# Отговор при валиден лиценз:
{
  "valid": true,
  "features": ["module:wms","module:scm","module:mes","module:pos","module:backup"],
  "expiresAt": "2027-05-08T...",
  "tenant": "Demo Client",
  "maxUsers": 10,
  "plan": "standard",
  "product": "erp"
}
```

## Products

| product | Modules |
|---------|---------|
| `erp` (default) | wms, scm, mes, pos, backup, finance |
| `crm` | sales, service, analytics, marketing, integrations |

Existing rows are backfilled as `product = 'erp'`.

## Demo данни

| Поле | Стойност |
|------|---------|
| Лиценз ключ | `DEMO-0000-0000-0000` |
| Tenant | Demo Client |
| Product | erp |
| Изтича | 1 година от създаването |
| Модули | WMS/SCM/MES/POS/Backup |

## Offline grace period

Installer-ът кешира валиден лиценз в `~/.dflow/license_cache.json`.
Grace period: **30 дни** без интернет.
