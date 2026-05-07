# DFlowERP Installer

Cross-platform Go installer for DFlowERP.

## Features
- License validation with offline cache fallback
- PostgreSQL detection and guided installation
- Engine download/extract from GitHub releases
- Database setup, migration execution, and `.env` generation
- Browser onboarding wizard (Bulgarian UI)
- Service registration hooks (Windows/Linux/macOS placeholders)

## Build
```bash
go mod tidy
go build -o dist/dflow-installer .
```

## Cross-platform builds
```bash
make build-all
```

