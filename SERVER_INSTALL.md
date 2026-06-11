# DFlowERP — Ръчна инсталация на сървър (без installer)

Това ръководство описва как да инсталирате DFlowERP директно на сървър,
без да използвате автоматичния installer binary.

**Подходящо за:** Linux сървъри (Ubuntu/Debian), VPS, on-premise машини.

---

## Минимални системни изисквания

| Компонент | Минимум | Препоръчано |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 2 GB | 4 GB |
| Диск | 20 GB | 50 GB SSD |
| OS | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| Node.js | 20.x LTS | 22.x LTS |
| PostgreSQL | 14+ | 16 |
| pnpm | 9+ | 9.15.0 |

---

## Стъпка 1: Системни зависимости

```bash
# Обнови пакетите
sudo apt-get update && sudo apt-get upgrade -y

# Инсталирай Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Провери версията
node --version
# Очаквано: v20.x.x или по-нова
```

✅ **Проверка:** `node --version` трябва да показва v20+

---

## Стъпка 2: Инсталирай pnpm

```bash
npm install -g pnpm@9.15.0

# Провери
pnpm --version
# Очаквано: 9.15.0
```

✅ **Проверка:** `pnpm --version` трябва да показва 9.x

---

## Стъпка 3: Инсталирай PostgreSQL

```bash
# Добави PostgreSQL хранилище
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16

# Стартирай и активирай при boot
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Провери
psql --version
sudo systemctl status postgresql
```

✅ **Проверка:** `sudo systemctl status postgresql` трябва да показва `active (running)`

---

## Стъпка 4: Създай PostgreSQL потребител и база данни

```bash
# Влез като postgres superuser
sudo -u postgres psql

# В psql конзолата изпълни:
CREATE USER dflow WITH PASSWORD 'СМЕНИ_С_СИЛНА_ПАРОЛА';
CREATE DATABASE dflow_erp OWNER dflow;
GRANT ALL PRIVILEGES ON DATABASE dflow_erp TO dflow;
\q

# Провери връзката
psql -U dflow -d dflow_erp -h localhost -c "SELECT version();"
# Въведи паролата когато поиска
```

✅ **Проверка:** PostgreSQL връща версията без грешки

---

## Стъпка 5: Свали DFlowERP Engine

```bash
# Създай инсталационна директория
sudo mkdir -p /opt/dflow-erp
sudo chown $USER:$USER /opt/dflow-erp
cd /opt/dflow-erp

# Свали engine пакета (замени VERSION с актуалната версия)
VERSION="0.3.0"
wget https://github.com/bbmarsiano/erp-platform/releases/download/v${VERSION}-engine/dflow-engine-${VERSION}.zip

# Разархивирай
sudo apt-get install -y unzip
unzip dflow-engine-${VERSION}.zip
mv dflow-engine-${VERSION}/* .
rm -rf dflow-engine-${VERSION} dflow-engine-${VERSION}.zip

# Провери структурата
ls -la
# Трябва да виждаш: apps/ packages/ modules/ package.json start.sh
```

✅ **Проверка:** `ls apps/api/dist/server.js` трябва да съществува

---

## Стъпка 6: Инсталирай Node.js зависимости

```bash
cd /opt/dflow-erp

# Инсталирай зависимостите (само production)
chmod +x install-deps.sh
./install-deps.sh

# Провери
ls node_modules | wc -l
# Трябва да показва > 100
```

✅ **Проверка:** `node_modules/` директорията съществува и не е празна

---

## Стъпка 7: Конфигурирай .env файла

```bash
cd /opt/dflow-erp

# Копирай примерния .env
cp .env.example .env

# Редактирай с nano или vim
nano .env
```

Попълни следните стойности:

```env
# База данни — замени с реалните данни от Стъпка 4
DATABASE_URL="postgresql://dflow:ТВОЯТА_ПАРОЛА@localhost:5432/dflow_erp"

# JWT секрети — генерирай случайни стойности
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

# Лиценз
LICENSE_KEY="ТВОЯ-ЛИЦЕНЗ-КЛЮЧ-ТУК"
LICENSE_SERVER_URL="https://lvhraynmvyvancqyezef.supabase.co"

# Сървър настройки
NODE_ENV="production"
PORT=3001
API_HOST="0.0.0.0"
```

Генерирай JWT секрети автоматично:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)"
# Копирай изхода в .env файла
```

✅ **Проверка:** `cat .env | grep DATABASE_URL` трябва да показва правилния connection string

---

## Стъпка 8: Изпълни миграции на базата данни

```bash
cd /opt/dflow-erp

# Копирай .env за Prisma
cp .env packages/db/.env

# Изпълни миграциите
DATABASE_URL="postgresql://dflow:ТВОЯТА_ПАРОЛА@localhost:5432/dflow_erp" \
  node_modules/.bin/prisma migrate deploy \
  --schema packages/db/prisma/schema.prisma

# Изпълни seed данни (опционално — за demo данни)
DATABASE_URL="postgresql://dflow:ТВОЯТА_ПАРОЛА@localhost:5432/dflow_erp" \
  node_modules/.bin/tsx packages/db/prisma/seed.ts
```

✅ **Проверка:**

```bash
psql -U dflow -d dflow_erp -h localhost -c "\dt"
# Трябва да показва ~20+ таблици (tenants, users, products, ...)
```

---

## Стъпка 9: Тест стартиране

```bash
cd /opt/dflow-erp

# Тествай стартирането
node apps/api/dist/server.js &

# Изчакай 3 секунди и провери
sleep 3
curl http://localhost:3001/api/health
# Очаквано: {"success":true,"data":{"status":"ok",...}}

# Спри тестовото стартиране
kill %1
```

✅ **Проверка:** Health endpoint връща `status: ok`

---

## Стъпка 10: Настрой systemd service (автоматичен старт)

```bash
# Създай service файл
sudo nano /etc/systemd/system/dflow-erp.service
```

Съдържание:

```ini
[Unit]
Description=DFlowERP API Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/dflow-erp
ExecStart=/usr/bin/node apps/api/dist/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dflow-erp
Environment=NODE_ENV=production
EnvironmentFile=/opt/dflow-erp/.env

[Install]
WantedBy=multi-user.target
```

```bash
# Активирай и стартирай service-а
sudo systemctl daemon-reload
sudo systemctl enable dflow-erp
sudo systemctl start dflow-erp

# Провери статуса
sudo systemctl status dflow-erp
```

✅ **Проверка:** `sudo systemctl status dflow-erp` показва `active (running)`

---

## Стъпка 11: Настрой firewall (UFW)

```bash
# Разреши SSH (ЗАДЪЛЖИТЕЛНО преди да активираш UFW!)
sudo ufw allow ssh

# Разреши ERP порта само за VPN мрежата
# Замени 192.168.1.0/24 с твоята VPN подмрежа
sudo ufw allow from 192.168.1.0/24 to any port 3001

# Активирай firewall
sudo ufw enable

# Провери
sudo ufw status
```

✅ **Проверка:** Port 3001 е отворен само за VPN мрежата

---

## Стъпка 12: Финална проверка

```bash
# 1. API health
curl http://localhost:3001/api/health

# 2. Login тест
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dflowerp.com","password":"admin123"}'
# Очаквано: {"success":true,"data":{"accessToken":"..."}}

# 3. Провери логовете
sudo journalctl -u dflow-erp -f
```

✅ **Всички проверки минаха → DFlowERP работи!**

---

## Достъп на служители

След като ERP-то работи на сървъра:

1. Свържи се с **VPN** към сървърната мрежа
2. Отвори браузър на: `http://[SERVER-IP]:3001`
3. Влез с администраторски акаунт
4. Настройки → Фирма → попълни данните на компанията
5. Потребители → добави служителите

---

## Обновяване на версията

```bash
# 1. Свали и стартирай updater
./dflow-installer --update

# Или ръчно:
# 1. Спри service-а
sudo systemctl stop dflow-erp

# 2. Направи backup
pg_dump postgresql://dflow:ПАРОЛА@localhost:5432/dflow_erp > backup-$(date +%Y%m%d).sql

# 3. Свали новата версия
VERSION="0.3.0"
wget https://github.com/bbmarsiano/erp-platform/releases/download/v${VERSION}-engine/dflow-engine-${VERSION}.zip
# ... разархивирай и замести файловете ...

# 4. Изпълни миграции
node_modules/.bin/prisma migrate deploy --schema packages/db/prisma/schema.prisma

# 5. Стартирай отново
sudo systemctl start dflow-erp
```

---

## Отстраняване на проблеми

| Проблем | Команда за диагностика |
|---------|----------------------|
| Service не стартира | `sudo journalctl -u dflow-erp -n 50` |
| PostgreSQL грешка | `sudo journalctl -u postgresql -n 20` |
| Port зает | `sudo lsof -i :3001` |
| Права на файлове | `sudo chown -R www-data:www-data /opt/dflow-erp` |
| .env не се зарежда | `sudo systemctl show dflow-erp \| grep Environment` |
