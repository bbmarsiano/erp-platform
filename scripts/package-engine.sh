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

# 3. Build modules (TypeScript → JavaScript via esbuild)
echo "🔨 Building modules..."
bash scripts/build-modules.sh

# 4. Copy API — built JS only, NO node_modules
echo "📁 Copying API..."
mkdir -p "${PACKAGE_DIR}/apps/api"
cp -r apps/api/dist "${PACKAGE_DIR}/apps/api/"
cp apps/api/package.json "${PACKAGE_DIR}/apps/api/"

# 5. Copy frontend built files only
echo "📁 Copying frontend..."
mkdir -p "${PACKAGE_DIR}/apps/web"
cp -r apps/web/dist "${PACKAGE_DIR}/apps/web/"

# 6. Copy packages — source + package.json, NO node_modules
echo "📁 Copying packages..."
mkdir -p "${PACKAGE_DIR}/packages"
for pkg in packages/*/; do
  pkg_name=$(basename "$pkg")
  rsync_excludes=(--exclude='node_modules')
  if [ "$pkg_name" != "db" ]; then
    rsync_excludes+=(--exclude='dist')
  fi
  rsync -a "${rsync_excludes[@]}" \
    "${pkg}" "${PACKAGE_DIR}/packages/${pkg_name}/"
done

# 7. Copy modules — compiled JS only (no TypeScript source)
echo "📁 Copying modules (compiled)..."
mkdir -p "${PACKAGE_DIR}/modules"
for module in wms scm mes pos backup; do
  MODULE_SRC="modules/${module}"
  MODULE_DST="${PACKAGE_DIR}/modules/${module}"
  if [ ! -d "${MODULE_SRC}" ]; then
    continue
  fi
  mkdir -p "${MODULE_DST}"
  cp "${MODULE_SRC}/package.json" "${MODULE_DST}/"
  if [ -d "${MODULE_SRC}/dist" ]; then
    cp -r "${MODULE_SRC}/dist/." "${MODULE_DST}/"
  else
    echo "  ⚠ No dist/ for ${module} — module may not load in production"
  fi
  if [ -d "${MODULE_SRC}/prisma" ]; then
    cp -r "${MODULE_SRC}/prisma" "${MODULE_DST}/"
  fi
done

# 8. Auth middleware shim — modules import apps/api/src/middleware/authenticate
mkdir -p "${PACKAGE_DIR}/apps/api/src/middleware"
cp "${PACKAGE_DIR}/apps/api/dist/middleware/authenticate.js" \
  "${PACKAGE_DIR}/apps/api/src/middleware/authenticate.js"

# 9. Root config files
cp package.json "${PACKAGE_DIR}/"
cp pnpm-workspace.yaml "${PACKAGE_DIR}/"
cp pnpm-lock.yaml "${PACKAGE_DIR}/" 2>/dev/null || true

# 10. Prisma schema (needed for migrate deploy)
mkdir -p "${PACKAGE_DIR}/packages/db/prisma"
cp packages/db/prisma/schema.prisma "${PACKAGE_DIR}/packages/db/prisma/"
cp -r packages/db/prisma/migrations "${PACKAGE_DIR}/packages/db/prisma/" 2>/dev/null || true

# 11. .env.example
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

# 12. start.sh (Linux/Mac)
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

# 13. start.bat (Windows)
cat > "${PACKAGE_DIR}/start.bat" << 'EOF'
@echo off
if not exist .env (
  echo ERROR: Run installer first.
  exit /b 1
)
echo Starting DFlowERP...
node apps\api\dist\server.js
EOF

# 14. install-deps.sh — run by installer after unzip
cat > "${PACKAGE_DIR}/install-deps.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Installing Node.js dependencies..."
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm@9.15.0
fi
pnpm install --prod --shamefully-hoist
echo "✅ Dependencies installed"
EOF
chmod +x "${PACKAGE_DIR}/install-deps.sh"

# 15. install-deps.bat (Windows)
cat > "${PACKAGE_DIR}/install-deps.bat" << 'EOF'
@echo off
where pnpm >nul 2>nul || npm install -g pnpm@9.15.0
pnpm install --prod --shamefully-hoist
echo Dependencies installed
EOF

# 16. Create ZIP
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

