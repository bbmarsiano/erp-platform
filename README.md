# DFlowERP

Enterprise Resource Planning Platform — modular, self-hosted, API-first.
Bulgarian language interface. Built with Node.js, React, PostgreSQL.

## Modules — v0.1.0
| Module | Status | Description |
|--------|--------|-------------|
| Core / Auth | ✅ | JWT auth, RBAC, audit log, license validation |
| WMS | ✅ | Warehouses, stock, receipts, issues, movements |
| SCM | ✅ | Suppliers, purchase orders, deliveries → WMS |
| MES | ✅ | BOM, work orders, production → WMS |
| POS | ✅ | Sales terminal, cash registers → WMS |
| Backup | ✅ | Policies, job monitoring, restore points |

## Tech Stack
- Backend: Node.js 20 + Fastify 4 + TypeScript
- Frontend: React 18 + Vite + TypeScript
- Database: PostgreSQL 16 + Prisma ORM
- Monorepo: pnpm workspaces
- Auth: JWT + RBAC
- API: REST + OpenAPI 3.1 (Swagger UI at /docs)

## Quick Start
```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

API: http://localhost:3001
Web: http://localhost:5173
Docs: http://localhost:3001/docs
Demo login: admin@dflowerp.com / admin123

## Module Integration Map
- SCM → WMS: Delivery confirm creates GoodsReceipt automatically
- MES → WMS: Work order complete consumes materials, adds finished goods
- POS → WMS: Sale reduces stock in real-time