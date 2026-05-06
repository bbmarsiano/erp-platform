# DFlowERP

Enterprise Resource Planning Platform — modular, self-hosted, API-first.

## Tech Stack
- **Backend:** Node.js + Fastify + TypeScript
- **Frontend:** React + Vite + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Monorepo:** pnpm workspaces

## Modules
| Module | Status |
|--------|--------|
| Core / Auth | ✅ Phase 0 |
| WMS — Warehouse Management | 🔄 Phase 1 |
| SCM — Supply Chain | 📅 Phase 2 |
| MES — Manufacturing | 📅 Phase 3 |
| POS — Point of Sale | 📅 Phase 4 |
| Backup | 📅 Phase 5 |

## Quick Start
```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## API Docs
http://localhost:3001/docs