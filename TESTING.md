# DFlowERP — Инструкции за тестване v0.7.0

## Prerequisites

| Компонент | Версия | Проверка |
|-----------|--------|---------|
| Node.js | **20+** | `node --version` |
| PostgreSQL | 14+ | `psql --version` |
| pnpm | 9+ | `pnpm --version` |

⚠️ **Node.js v12 НЕ работи.** Изтегли v20 LTS от https://nodejs.org

---

## Инсталация с installer

### Windows
1. Свали `dflow-installer-windows-amd64.exe` от
   https://github.com/bbmarsiano/erp-platform/releases/tag/v0.7.0-installer
2. Отвори CMD като Administrator
3. `cd C:\Users\[потребител]\Downloads`
4. `dflow-installer-windows-amd64.exe`
5. Въведи лиценз: `DEMO-0000-0000-0000`
6. Браузърът се отваря на http://localhost:7788

### Mac (Apple Silicon)
```bash
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.7.0-installer/dflow-installer-darwin-arm64 -o dflow-installer
chmod +x dflow-installer
./dflow-installer
# Лиценз: DEMO-0000-0000-0000
```

### Mac (Intel)
```bash
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.7.0-installer/dflow-installer-darwin-amd64 -o dflow-installer
chmod +x dflow-installer
./dflow-installer
```

### Linux
```bash
curl -L https://github.com/bbmarsiano/erp-platform/releases/download/v0.7.0-installer/dflow-installer-linux-amd64 -o dflow-installer
chmod +x dflow-installer
sudo ./dflow-installer
```

---

## Wizard стъпки

1. **Лиценз:** `DEMO-0000-0000-0000`
2. Браузърът отваря http://localhost:7788
3. **Стъпка 0:** Проверка на prerequisites (Node.js, pnpm, PostgreSQL)
4. **Стъпка 1:** Фирма + имейл
5. **Стъпка 2:** Парола + порт (default 3001) + IP адрес (default 0.0.0.0)
6. **Стъпка 3:** Преглед → "Инсталирай DFlowERP"
7. **Стъпка 4:** Успех → "Отвори DFlowERP"

---

## Валидация след инсталация

```bash
# API health check
curl http://localhost:3001/api/health
# Очаквано: {"success":true,"data":{"status":"ok",...}}

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"[admin email]","password":"[парола от wizard]"}'

# WMS - склад
curl http://localhost:3001/api/wms/warehouses \
  -H "Authorization: Bearer [токен от login]"
```

---

## Баркод скенер — тестване

### USB/Bluetooth скенер
1. Отиди на `/wms/products`
2. Кликни "Нов продукт" → попълни данните → в "Баркод" поле кликни 📷 иконата
3. Насочи скенера към баркод — автоматично попълва полето

### Camera скенер
```bash
# Инсталирай camera library (еднократно)
pnpm --filter @dflow/web add @ericblade/quagga2
```
1. Chrome браузър (не Safari)
2. POS → "Сканирай" → "Камера" → "Активирай камера"
3. Разреши достъп до камерата
4. Насочи баркода към рамката

---

## VPN/мрежов достъп

При инсталация на сървър:
1. В wizard Стъпка 2 → IP: `192.168.1.100` (IP на сървъра)
2. Служителите отварят: `http://192.168.1.100:3001`

---

## Dev тест (без инсталация)

```bash
cd installer
make build-dev
./dist/dflow-installer-dev --wizard-only
# http://localhost:7788
```

---

## Известни проблеми и решения

### 1. `bad CPU type in executable`
**Причина:** Свален е грешният installer binary.
**Решение:**
- Apple Silicon (M1/M2/M3): `dflow-installer-darwin-arm64`
- Intel Mac: `dflow-installer-darwin-amd64`
- Провери: `uname -m` → `arm64` или `x86_64`

### 2. `PostgreSQL setup failed: exec: "brew": executable file not found`
**Причина:** Homebrew не е инсталиран.
**Решение:** Инсталирай PostgreSQL директно от https://postgresapp.com
После добави към PATH:
```bash
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

### 3. `Cannot find module '.prisma/client/default'`
**Причина:** Prisma Client не е генериран след инсталацията.
**Решение:**
```bash
cd ~/Applications/DFlowERP
npx prisma@5.22.0 generate --schema packages/db/prisma/schema.prisma
```

### 4. `EADDRINUSE: address already in use :::3001`
**Причина:** Вече върви процес на порт 3001.
**Решение:**
```bash
lsof -ti :3001 | xargs kill -9
```

### 5. Празна страница на `http://localhost:3001`
**Причина:** Browser cache.
**Решение:** Hard refresh с `Cmd+Shift+R` или отвори в Incognito.
**Забележка:** Safari може да не работи с localhost — използвай Chrome или Firefox.

### 6. `Invalid credentials` при login
**Причина:** Seed данните не са създадени с wizard данните.
**Решение:** Пусни seed ръчно (виж SERVER_INSTALL.md → Стъпка 4).

### 7. `zsh: command not found: node`
**Причина:** Node.js не е в PATH.
**Решение:**
```bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

### 8. `permission denied` при `npm install -g pnpm`
**Причина:** Няма права за глобална инсталация.
**Решение:**
```bash
sudo npm install -g pnpm@9.15.0
```

### 9. Парола с `!` символ не работи в командния ред
**Причина:** zsh интерпретира `!` като history expansion.
**Решение:** Използвай парола без `!` при ръчно изпълнение на команди.
В wizard-а можеш да въведеш `!` без проблем.

### 10. `Failed loading module: wms` (и останалите)
**Причина:** Стар engine пакет без компилирани модули.
**Решение:** Свали последния installer от GitHub Releases.

### 11. Node.js версия несъвместимост
**Причина:** Node.js v24 има ESM проблеми.
**Решение:** Инсталирай Node.js v22 LTS от https://nodejs.org

---

## Отстраняване на проблеми (кратък справочник)

| Проблем | Решение |
|---------|---------|
| Node.js стара версия | Свали v20 LTS от nodejs.org |
| winget не работи | Свали Node.js директно от nodejs.org |
| Port 3001 зает | Смени порта в wizard стъпка 2 |
| Браузърът не се отваря | Отвори ръчно http://localhost:7788 |
| Camera не работи | Ползвай Chrome, не Safari |
| "License unreachable" | Провери интернет връзката |

---

## Releases

| Файл | Платформа | Размер |
|------|-----------|--------|
| `dflow-installer-windows-amd64.exe` | Windows 64-bit | ~7.5MB |
| `dflow-installer-darwin-arm64` | Mac Apple Silicon | ~6.8MB |
| `dflow-installer-darwin-amd64` | Mac Intel | ~7.3MB |
| `dflow-installer-linux-amd64` | Linux 64-bit | ~7.2MB |

Installer: https://github.com/bbmarsiano/erp-platform/releases/tag/v0.7.0-installer
Engine: https://github.com/bbmarsiano/erp-platform/releases/tag/v0.7.0-engine
