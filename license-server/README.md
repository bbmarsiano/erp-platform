# DFlowERP License Server

Supabase-базиран лицензен сървър за DFlowERP.

## Архитектура

```
[Go Installer] ──POST──▶ [validate-license Edge Function]
[ERP Startup]  ──POST──▶ [validate-license Edge Function]
                             │
                             ▼
                     [Supabase PostgreSQL]
                     tenants + license_keys + validation_log
```

## Setup

### 1. SQL миграция
Supabase Dashboard → SQL Editor → изпълни:
`supabase/migrations/001_license_schema.sql`

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
  "plan": "standard"
}
```

## Demo данни

| Поле | Стойност |
|------|---------|
| Лиценз ключ | `DEMO-0000-0000-0000` |
| Tenant | Demo Client |
| Изтича | 1 година от създаването |
| Модули | Всички 5 |

## Offline grace period

Installer-ът кешира валиден лиценз в `~/.dflow/license_cache.json`.
Grace period: **30 дни** без интернет.
