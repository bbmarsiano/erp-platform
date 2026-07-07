# DFlowERP

**Enterprise Resource Planning Platform for Bulgarian SMEs**  
Self-hosted, modular, Bulgarian-language ERP system.

[![Version](https://img.shields.io/badge/version-0.7.1-blue)](https://github.com/bbmarsiano/erp-platform/releases/tag/v0.7.1)
[![License](https://img.shields.io/badge/license-BSL-green)](./LICENSE)

## Модули

| Модул | Описание |
|-------|----------|
| WMS | Складово стопанство |
| SCM | Верига на доставките |
| MES | Производство |
| POS | Точка на продажба + Контрагенти + Фактури |
| Finance | Финансово-счетоводен модул (опционален) |
| Backup | Архивиране с AES-256-GCM криптиране |

## Технологии

- **Backend:** Node.js v22 LTS, Fastify 4, Prisma ORM, PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS
- **Build:** pnpm workspaces, esbuild (modules), TypeScript
- **PDF:** pdfmake (Cyrillic support)
- **API docs:** Swagger UI at `/docs`

## Изисквания

- Ubuntu 22.04+ / macOS
- Node.js v22 LTS
- PostgreSQL 14+
- pnpm 9.x
- nginx (production)

## Бърза инсталация (production)

```bash
# 1. Клонирай репото
git clone https://github.com/bbmarsiano/erp-platform.git dflow
cd dflow

# 2. Конфигурирай .env
cp .env.example .env  # редактирай с твоите стойности

# 3. Инсталирай и build-вай
pnpm install
cd packages/db && export DATABASE_URL="..." && npx prisma migrate deploy && cd ..
pnpm --filter "@dflow/core" build
# ... (виж пълната документация)
```

## Модулна архитектура

Всеки модул е независим пакет в `modules/`:
- Зарежда се динамично от `moduleLoader`
- Контролира се per-tenant чрез `enabledModules`
- Build-ва се отделно с esbuild

## Finance модул

Опционален модул с:
- Пълно двойно счетоводство (double-entry)
- Фактури с ЗДДС реквизити (PDF)
- Главна книга, Оборотна ведомост, ОПР, Баланс
- Автоматизация от POS и SCM операции
- Затваряне на счетоводни периоди

## POS Фактуриране (без Finance)

За инсталации без Finance модул:
- Управление на Контрагенти директно в POS
- Издаване на правно-издържани фактури с ЗДДС
- Конфигурируема номерация

## Changelog

Виж [CHANGELOG.md](./CHANGELOG.md)

## Лиценз

Business Source License (BSL) — виж [LICENSE](./LICENSE)
