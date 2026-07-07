# DFlowERP Changelog

## v0.7.1 (Юли 2026)

### Добавено
- POS Контрагенти + Фактури без Finance модул
  - PosInvoice модел, posInvoiceStartNumber/posInvoiceLastNumber в Tenant
  - /api/pos/counterparties — пълно CRUD
  - /api/pos/invoices — създаване, PDF (pdfmake + кирилица), анулиране
  - Настройки → Фирма → "Начален номер на фактури" (само без Finance)
  - Пълни ЗДДС реквизити в PDF фактурата

### Поправено
- Swagger UI — API документацията (/docs) работи на HTTP
- White screen ErrorBoundary — frontend показва грешка вместо бял екран
- moduleLoader — проверява dist/ първо (production), после .ts (dev)
- posInvoiceLastNumber — Prisma client се регенерира автоматично при build
- enabledModules — core routes (dashboard, users, settings) не се проверяват
- Cross-module imports (POS/SCM → Finance automation) bundled коректно
- Git pull conflicts с manifest.js файлове — решено чрез git checkout

### Backup модул — пълна преработка
- Реален pg_dump runner (без Go daemon)
- AES-256-GCM криптиране на архивите
- Path validation при запис на политика
- Реален restore-test в throwaway temp база
- Верификация с SHA-256 checksum
- GET /api/backup/status endpoint

## v0.7.0 (Юли 2026)
- Finance модул (5 фази): Customer, Invoice, Journal, Bank, Periods
- POS Контрагенти инфраструктура
- Role-based access control (RBAC)
- Tenant-level module toggle (enabledModules)

## v0.6.0 (Юни 2026)
- SCM redesign, MES fix, Backup improvements
- Role-based menu visibility
