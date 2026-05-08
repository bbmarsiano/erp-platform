#!/bin/bash
set -e

VERSION=${1:-"0.1.0"}
OUTPUT_DIR="dist/engine"
PACKAGE_NAME="dflow-engine-${VERSION}"
PACKAGE_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}"

echo "📦 Packaging DFlowERP Engine v${VERSION}..."
rm -rf "${OUTPUT_DIR}"
mkdir -p "${PACKAGE_DIR}"

# 1. Build frontend
echo "🔨 Building frontend..."
pnpm --filter @dflow/web build

# 2. Build API (TypeScript → JavaScript)
echo "🔨 Building API..."
pnpm --filter @dflow/api build

# 3. Copy API — built JS only, NO node_modules
echo "📁 Copying API..."
mkdir -p "${PACKAGE_DIR}/apps/api"
cp -r apps/api/dist "${PACKAGE_DIR}/apps/api/"
cp apps/api/package.json "${PACKAGE_DIR}/apps/api/"

# 4. Copy frontend built files only
echo "📁 Copying frontend..."
mkdir -p "${PACKAGE_DIR}/apps/web"
cp -r apps/web/dist "${PACKAGE_DIR}/apps/web/"

# 5. Copy packages — source + package.json, NO node_modules
echo "📁 Copying packages..."
mkdir -p "${PACKAGE_DIR}/packages"
for pkg in packages/*/; do
  pkg_name=$(basename "$pkg")
  rsync -a --exclude='node_modules' --exclude='dist' \
    "${pkg}" "${PACKAGE_DIR}/packages/${pkg_name}/"
done

# 6. Copy modules — NO node_modules
echo "📁 Copying modules..."
rsync -a --exclude='node_modules' --exclude='dist' \
  modules/ "${PACKAGE_DIR}/modules/"

# 7. Root config files
cp package.json "${PACKAGE_DIR}/"
cp pnpm-workspace.yaml "${PACKAGE_DIR}/"
cp pnpm-lock.yaml "${PACKAGE_DIR}/" 2>/dev/null || true

# 8. Prisma schema (needed for migrate deploy)
mkdir -p "${PACKAGE_DIR}/packages/db/prisma"
cp packages/db/prisma/schema.prisma "${PACKAGE_DIR}/packages/db/prisma/"
cp -r packages/db/prisma/migrations "${PACKAGE_DIR}/packages/db/prisma/" 2>/dev/null || true

# 9. .env.example
cat > "${PACKAGE_DIR}/.env.example" << 'EOF'
DATABASE_URL=postgresql://dflow:PASSWORD@localhost:5432/dflow_erp
JWT_SECRET=CHANGE_THIS_32_CHAR_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_ANOTHER_32_CHAR_SECRET
LICENSE_KEY=YOUR-LICENSE-KEY
LICENSE_SERVER_URL=https://lvhraynmvyvancqyezef.supabase.co
NODE_ENV=production
PORT=3001
API_HOST=0.0.0.0
EOF

# 10. start.sh (Linux/Mac)
cat > "${PACKAGE_DIR}/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "❌ .env not found. Run installer first."
  exit 1
fi
echo "🚀 Starting DFlowERP API..."
node apps/api/dist/server.js
EOF
chmod +x "${PACKAGE_DIR}/start.sh"

# 11. start.bat (Windows)
cat > "${PACKAGE_DIR}/start.bat" << 'EOF'
@echo off
if not exist .env (
  echo ERROR: Run installer first.
  exit /b 1
)
echo Starting DFlowERP...
node apps\api\dist\server.js
EOF

# 12. install-deps.sh — run by installer after unzip
cat > "${PACKAGE_DIR}/install-deps.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Installing Node.js dependencies..."
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm@9.15.0
fi
pnpm install --frozen-lockfile --prod
echo "✅ Dependencies installed"
EOF
chmod +x "${PACKAGE_DIR}/install-deps.sh"

# 13. install-deps.bat (Windows)
cat > "${PACKAGE_DIR}/install-deps.bat" << 'EOF'
@echo off
where pnpm >nul 2>nul || npm install -g pnpm@9.15.0
pnpm install --frozen-lockfile --prod
echo Dependencies installed
EOF

# 14. Create ZIP
echo "🗜️  Creating ZIP..."
cd "${OUTPUT_DIR}"
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}/" -x "*.DS_Store" -x "__MACOSX/*"
cd -

ZIP_SIZE=$(du -sh "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)
DIR_SIZE=$(du -sh "${PACKAGE_DIR}" | cut -f1)

echo ""
echo "✅ Engine packaged successfully!"
echo "   Directory: ${DIR_SIZE}"
echo "   ZIP: ${ZIP_SIZE}"
echo ""
echo "Contents preview:"
unzip -l "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" | head -20

