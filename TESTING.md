# DFlowERP — Инструкции за тестване

## Prerequisites (задължителни на тестовата машина)

| Компонент | Версия | Проверка |
|-----------|--------|----------|
| Node.js | 20+ | `node --version` |
| PostgreSQL | 14+ | `psql --version` |
| pnpm | 9+ | `pnpm --version` |

---

## Mac (Apple Silicon — M1/M2/M3)

```bash
# 1. Свали installer-а
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.1.0-installer/dflow-installer-darwin-arm64 -o dflow-installer
chmod +x dflow-installer

# 2. Пусни
./dflow-installer
```

## Mac (Intel)

```bash
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.1.0-installer/dflow-installer-darwin-amd64 -o dflow-installer
chmod +x dflow-installer
./dflow-installer
```

## Windows

1. Свали `dflow-installer-windows-amd64.exe` от:
   https://github.com/bbmarsiano/erp-platform/releases/tag/v0.1.0-installer
2. Десен клик → **Run as Administrator**
3. Следвай стъпките в терминала

## Linux (Ubuntu/Debian)

```bash
# Провери Node.js (инсталирай ако липсва)
node --version || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)

# Свали и пусни installer-а
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.1.0-installer/dflow-installer-linux-amd64 -o dflow-installer
chmod +x dflow-installer
sudo ./dflow-installer
```

---

## Стъпки в installer-а

1. **License key:** `DEMO-0000-0000-0000` (demo лиценз)
2. Браузърът се отваря автоматично на `http://localhost:7788`
3. **Стъпка 1 — Информация за фирмата:**
   - Наименование на фирмата
   - Администраторски имейл
4. **Стъпка 2 — Сигурност и конфигурация:**
   - Парола (минимум 8 символа)
   - Порт (default: `3001`)
   - IP адрес / хост (default: `0.0.0.0` за всички интерфейси)
5. **Стъпка 3 — Преглед:** провери данните и натисни "Инсталирай DFlowERP"
6. **Стъпка 4 — Успех:** натисни "Отвори DFlowERP" → зарежда login страницата

---

## Валидация след инсталация

```bash
# 1. API health check
curl http://localhost:3001/api/health
# Очаквано: {"success":true,"data":{"status":"ok",...}}

# 2. Login тест
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[admin email от wizard]","password":"[парола от wizard]"}'
# Очаквано: {"success":true,"data":{"accessToken":"...",...}}

# 3. База данни
psql -U dflow -d dflow_erp -c "SELECT name, slug FROM tenants;"
# Очаквано: ред с фирмата от wizard-а

# 4. .env файл (Mac)
cat ~/Applications/DFlowERP/.env

# 4. .env файл (Linux)
cat /opt/dflow-erp/.env

# 5. Frontend
# Отвори в браузър: http://localhost:3001
# Трябва да зареди React login страницата
```

---

## VPN / мрежов достъп (за служители)

Когато ERP-то е инсталирано на централен сървър:

1. По време на инсталация задай **IP адрес на сървъра** вместо `0.0.0.0`
   - Пример: `192.168.1.100` или `erp.firma.bg`
2. Служителите се свързват с VPN към мрежата на фирмата
3. Отварят браузър на `http://192.168.1.100:3001`
4. Логват се с потребителско име и парола

---

## Отстраняване на проблеми

| Проблем | Решение |
|---------|---------|
| Download 404 | Провери дали release `v0.1.0-engine` съществува в GitHub |
| PostgreSQL install fails | `sudo apt-get install -y postgresql-16` (Linux) или `brew install postgresql@16` (Mac) |
| pnpm install fails | Провери Node.js версия: трябва 20+ |
| Port 3001 зает | Промени порта в wizard-а (напр. `3002`) |
| Браузърът не се отваря | Отвори ръчно `http://localhost:7788` |
| "Invalid credentials" при login | Провери дали seed-ът е минал: `psql -U dflow -d dflow_erp -c "SELECT email FROM users;"` |

---

## Dev тестване (без пълна инсталация)

```bash
cd installer
make build-dev
./dist/dflow-installer-dev --wizard-only
# Отваря wizard на http://localhost:7788 без реална инсталация
```

---

## Releases

| Файл | Платформа |
|------|-----------|
| `dflow-installer-windows-amd64.exe` | Windows 64-bit |
| `dflow-installer-darwin-arm64` | Mac Apple Silicon |
| `dflow-installer-darwin-amd64` | Mac Intel |
| `dflow-installer-linux-amd64` | Linux 64-bit |

Release URL: https://github.com/bbmarsiano/erp-platform/releases/tag/v0.1.0-installer
