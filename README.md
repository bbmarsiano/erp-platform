# DFlowERP

**Модулна, самостоятелно хоствана ERP платформа с български интерфейс.**
Изградена с Node.js, React и PostgreSQL. Продавана чрез времеви лицензи.

## Какво е включено в v0.2.0

| Модул | Статус | Описание |
|-------|--------|----------|
| Core / Auth | ✅ | JWT автентикация, RBAC роли, одит лог |
| WMS — Складово стопанство | ✅ | Складове, наличности, приходи, изходи, движения, продукти с баркод |
| SCM — Верига на доставките | ✅ | Доставчици, поръчки покупка, доставки |
| MES — Производство | ✅ | Рецептури (BOM), производствени нареждания |
| POS — Точка на продажба | ✅ | Касов терминал, баркод скенер, касова бележка, фактура |
| Backup — Архивиране | ✅ | Политики, история, точки за възстановяване |
| Потребители | ✅ | CRUD, роли, промяна на парола |
| Справки | ✅ | BI табла с графики, период филтри, Excel export |
| Баркод скенер | ✅ | USB/Bluetooth + камера, POS и WMS интеграция |

## Tech Stack

| Компонент | Технология |
|-----------|-----------|
| Backend | Node.js 20 + Fastify 4 + TypeScript |
| Frontend | React 18 + Vite + TypeScript |
| Database | PostgreSQL 14+ + Prisma ORM |
| Monorepo | pnpm workspaces |
| Installer | Go 1.22 (cross-platform binary) |
| License Server | Supabase Edge Functions |

## Бързо стартиране (локална разработка)

### Изисквания

| Инструмент | Версия | Инсталация |
|-----------|--------|-----------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | `brew install postgresql@16` (Mac) |
| Go | 1.22+ | `brew install go` (само за installer) |

### Стъпки

```bash
# 1. Клонирай
git clone https://github.com/bbmarsiano/erp-platform.git
cd erp-platform

# 2. Инсталирай зависимости
pnpm install

# 3. Конфигурирай среда
cp .env.example .env
# Редактирай .env — смени YOUR_USERNAME с output от: whoami

# 4. Създай база данни
createdb erp_dev

# 5. Миграции
pnpm db:generate
pnpm db:migrate

# 6. Seed данни
cp .env packages/db/.env
pnpm db:seed

# 7. Стартирай
pnpm dev
```

| Услуга | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |

**Demo вход:** `admin@dflowerp.com` / `admin123`

## Deployment модел

```
[Централен сървър]
    ├── DFlowERP API (:3001)
    ├── PostgreSQL
    └── VPN достъп за служители

[Служители]
    └── Браузър → http://[SERVER-IP]:3001

[Лицензен сървър — твоят cloud]
    └── Supabase (validate-license Edge Function)
```

## Installer

```bash
# Свали от GitHub Releases:
# https://github.com/bbmarsiano/erp-platform/releases/tag/v0.2.0-installer

# Windows
dflow-installer-windows-amd64.exe

# Mac (Apple Silicon)
chmod +x dflow-installer-darwin-arm64 && ./dflow-installer-darwin-arm64

# Linux
chmod +x dflow-installer-linux-amd64 && sudo ./dflow-installer-linux-amd64

# Тест на wizard UI (без инсталация)
cd installer && make build-dev && ./dist/dflow-installer-dev --wizard-only
```

## Структура на проекта

```
erp-platform/
├── apps/
│   ├── api/              # Fastify backend
│   └── web/              # React + Vite frontend
├── packages/
│   ├── core/             # Споделени типове
│   └── db/               # Prisma schema + миграции
├── modules/              # ERP plugin модули
│   ├── wms/              # Складово стопанство
│   ├── scm/              # Верига на доставките
│   ├── mes/              # Производство
│   ├── pos/              # Точка на продажба
│   └── backup/           # Архивиране
├── installer/            # Go cross-platform installer
├── license-server/       # Supabase лицензен сървър
└── scripts/              # Build скриптове
```

## Модулни интеграции

- **SCM → WMS:** Потвърдена доставка автоматично създава GoodsReceipt
- **MES → WMS:** Завършено нареждане консумира материали и добавя готова продукция
- **POS → WMS:** Продажба намалява наличността в реално време

## License Server (Supabase)

```bash
cd license-server/admin
pnpm install
pnpm dev
# http://localhost:5174
```

## Demo лиценз

```
DEMO-0000-0000-0000
```
