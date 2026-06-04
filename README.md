# DFlowERP

Enterprise Resource Planning Platform — modular, self-hosted, API-first.
Bulgarian language interface. Built with Node.js, React, PostgreSQL.

## Modules — v0.1.0
| Module | Status | Description |
|--------|--------|-------------|
| Core / Auth | ✅ | JWT auth, RBAC, audit log, license validation |
| WMS — Складово стопанство | ✅ | Warehouses, stock, receipts, issues, movements |
| SCM — Верига на доставките | ✅ | Suppliers, purchase orders, deliveries → WMS |
| MES — Производство | ✅ | BOM, work orders, production → WMS |
| POS — Точка на продажба | ✅ | Sales terminal, cash registers → WMS |
| Backup — Архивиране | ✅ | Policies, job monitoring, restore points |

## Tech Stack
- **Backend:** Node.js 20 + Fastify 4 + TypeScript
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** PostgreSQL 14+ + Prisma ORM
- **Monorepo:** pnpm workspaces
- **Auth:** JWT + RBAC
- **API:** REST + OpenAPI 3.1 (Swagger UI at /docs)

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org |
| pnpm | 9+ | `npm install -g pnpm` |
| PostgreSQL | 14+ | `brew install postgresql@14` (Mac) |
| Go | 1.22+ | `brew install go` (Mac, for installer only) |

## Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/bbmarsiano/erp-platform.git
cd erp-platform
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment
```bash
cp .env.example .env
```

Edit `.env` with your local values:
```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/erp_dev"
JWT_SECRET="any-random-32-char-string"
JWT_REFRESH_SECRET="another-random-32-char-string"
LICENSE_SERVER_URL="https://lvhraynmvyvancqyezef.supabase.co"
NODE_ENV="development"
PORT=3001
VITE_API_URL="http://localhost:3001"
```

Replace `YOUR_USERNAME` with your system username (run `whoami` to find it).

### 4. Create the database
```bash
createdb erp_dev
```

### 5. Run database migrations
```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Seed demo data
```bash
pnpm db:seed
```

Expected output:
```
✅ Seed completed
   Tenant: Demo Company (slug: demo)
   Admin: admin@dflowerp.com / admin123
   License: DEMO-0000-0000-0000
✅ WMS seed completed — warehouse + locations + products
✅ SCM seed completed — 2 suppliers
✅ MES seed completed — BOM for PROD-001
✅ POS seed completed — cash register CASH-01
✅ Backup seed completed — daily backup policy
```

### 7. Start development server
```bash
pnpm dev
```

This starts both API and frontend concurrently:
- **API:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **API Docs (Swagger):** http://localhost:3001/docs

### 8. Verify everything works
```bash
# Health check
curl http://localhost:3001/api/health
# Expected: {"success":true,"data":{"status":"ok",...}}

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dflowerp.com","password":"admin123"}'
# Expected: {"success":true,"data":{"accessToken":"...",...}}
```

### 9. Open in browser
Go to http://localhost:5173 and login with:
- **Email:** admin@dflowerp.com
- **Password:** admin123

## Module Integration Map
- **SCM → WMS:** Delivery confirm creates GoodsReceipt automatically
- **MES → WMS:** Work order complete consumes materials, produces finished goods
- **POS → WMS:** Sale reduces stock in real-time

## API Documentation
Swagger UI available at http://localhost:3001/docs

## License Server (Supabase)
Admin panel for managing client licenses runs separately:
```bash
cd license-server/admin
pnpm install
pnpm dev
# Opens at http://localhost:5174
```

## Installer
Cross-platform installer for client deployments:
```bash
cd installer
make build          # Build for current platform
make build-all      # Build for all platforms
make build-dev      # Build dev version with --wizard-only flag
```

See `installer/README.md` for full instructions.

## Repository Structure
```
erp-platform/
├── apps/
│   ├── api/          # Fastify backend
│   └── web/          # React + Vite frontend
├── packages/
│   ├── core/         # Shared types and utilities
│   └── db/           # Prisma schema + migrations
├── modules/          # ERP plugin modules
│   ├── wms/          # Warehouse Management
│   ├── scm/          # Supply Chain Management
│   ├── mes/          # Manufacturing Execution
│   ├── pos/          # Point of Sale
│   └── backup/       # Backup & Archive
├── installer/        # Go cross-platform installer
├── license-server/   # Supabase license management
└── scripts/          # Build and packaging scripts
```
