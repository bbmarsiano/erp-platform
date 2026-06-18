# DFlowERP

**Модулна, самостоятелно хоствана ERP платформа с български интерфейс.**
Изградена с Node.js, React и PostgreSQL. Продавана чрез времеви лицензи.

---

## Какво е включено в v0.5.0

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
| Help система | ✅ | Вградено ръководство BG/EN с търсене |
| Лицензен контрол | ✅ | Модулни лицензи, lifetime/annual, grace period |

---

## Tech Stack

| Компонент | Технология |
|-----------|-----------|
| Backend | Node.js 22 + Fastify 4 + TypeScript |
| Frontend | React 18 + Vite + TypeScript |
| Database | PostgreSQL 14+ + Prisma ORM |
| Monorepo | pnpm workspaces |
| Installer | Go 1.22 (cross-platform binary) |

---

## Системни изисквания

| Компонент | Версия | Бележка |
|-----------|--------|---------|
| Node.js | **v22 LTS** | ⚠️ v24 не се поддържа |
| PostgreSQL | 14–16 | Поддържа портове 5432, 5433, 5434 |
| pnpm | 9.x | `sudo npm install -g pnpm@9.15.0` |
| Браузър | Chrome / Firefox | Safari може да не работи с localhost |

---

## Installer (препоръчан начин)

Свали installer за твоята платформа от
[GitHub Releases — v0.5.0-installer](https://github.com/bbmarsiano/erp-platform/releases/tag/v0.5.0-installer):

| Платформа | Файл |
|-----------|------|
| Windows 64-bit | `dflow-installer-windows-amd64.exe` |
| Mac Apple Silicon | `dflow-installer-darwin-arm64` |
| Mac Intel | `dflow-installer-darwin-amd64` |
| Linux 64-bit | `dflow-installer-linux-amd64` |

```bash
# Mac / Linux
chmod +x dflow-installer-darwin-arm64
./dflow-installer-darwin-arm64

# Windows — стартирай като Administrator
dflow-installer-windows-amd64.exe
```

### Demo лиценз
```
DEMO-0000-0000-0000
```

---

## Бързо стартиране (локална разработка)

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

---

## Deployment модел

```
[Централен сървър]
    ├── DFlowERP API (:3001)
    ├── PostgreSQL
    └── VPN достъп за служители

[Служители]
    └── Браузър → http://[SERVER-IP]:3001
```

---

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
└── scripts/              # Build скриптове
```

---

## Модулни интеграции

- **SCM → WMS:** Потвърдена доставка автоматично създава GoodsReceipt
- **MES → WMS:** Завършено нареждане консумира материали и добавя готова продукция
- **POS → WMS:** Продажба намалява наличността в реално време

---

## Документация

| Файл | Описание |
|------|---------|
| `SERVER_INSTALL.md` | Ръчна инсталация на Linux сървър |
| `TESTING.md` | Инструкции за тестване |
| `docs/manual/bg/manual.md` | Ръководство за употреба (БГ) |
| `docs/manual/en/manual.md` | User Manual (EN) |
