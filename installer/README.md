# DFlowERP Installer

Cross-platform installer за DFlowERP. Автоматизира инсталацията на:
- PostgreSQL (ако липсва)
- Node.js engine (изтегля от GitHub Releases)
- База данни + миграции
- .env конфигурация
- Onboarding wizard (браузър на порт 7788)

## Изтегляне

https://github.com/bbmarsiano/erp-platform/releases/tag/v0.2.0-installer

## Употреба

### Windows (CMD като Administrator)
```cmd
dflow-installer-windows-amd64.exe
```

### Mac
```bash
chmod +x dflow-installer-darwin-arm64
./dflow-installer-darwin-arm64
```

### Linux
```bash
chmod +x dflow-installer-linux-amd64
sudo ./dflow-installer-linux-amd64
```

## Инсталационен процес

```
[0] Проверка на Node.js (нужна е v20+)
[1/5] Валидация на лиценз → Supabase
[2/5] Проверка/инсталация на PostgreSQL
[3/5] Изтегляне на engine от GitHub Releases
[4/5] Създаване на база данни + миграции
[5/5] Onboarding wizard → http://localhost:7788
```

## Dev режим (само wizard UI)

```bash
make build-dev
./dist/dflow-installer-dev --wizard-only
```

## Build за всички платформи

```bash
make build-all VERSION=0.2.0
```

## License

Demo лиценз: `DEMO-0000-0000-0000`
License server: https://lvhraynmvyvancqyezef.supabase.co
