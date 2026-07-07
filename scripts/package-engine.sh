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

# 3. Build @dflow/core (CommonJS — required by compiled modules)
echo "🔨 Building @dflow/core..."
pnpm --filter @dflow/core build

# 4. Build modules (TypeScript → JavaScript via esbuild)
echo "🔨 Building modules..."
bash scripts/build-modules.sh

# 5. Copy API — built JS only, NO node_modules
echo "📁 Copying API..."
mkdir -p "${PACKAGE_DIR}/apps/api"
cp -r apps/api/dist "${PACKAGE_DIR}/apps/api/"
cp apps/api/package.json "${PACKAGE_DIR}/apps/api/"

# 6. Copy frontend built files only
echo "📁 Copying frontend..."
mkdir -p "${PACKAGE_DIR}/apps/web"
cp -r apps/web/dist "${PACKAGE_DIR}/apps/web/"

# 7. Copy packages — source + package.json, NO node_modules
echo "📁 Copying packages..."
mkdir -p "${PACKAGE_DIR}/packages"
for pkg in packages/*/; do
  pkg_name=$(basename "$pkg")
  rsync_excludes=(--exclude='node_modules')
  if [ "$pkg_name" != "db" ] && [ "$pkg_name" != "core" ]; then
    rsync_excludes+=(--exclude='dist')
  fi
  rsync -a "${rsync_excludes[@]}" \
    "${pkg}" "${PACKAGE_DIR}/packages/${pkg_name}/"
done

# Ensure packages/core has compiled dist + production entry point
if [ -d "packages/core/dist" ]; then
  mkdir -p "${PACKAGE_DIR}/packages/core"
  cp packages/core/package.json "${PACKAGE_DIR}/packages/core/"
  cp -r packages/core/dist "${PACKAGE_DIR}/packages/core/"
  if [ -d "packages/core/src" ]; then
    cp -r packages/core/src "${PACKAGE_DIR}/packages/core/"
  fi
  node -e "
    const fs = require('fs');
    const path = '${PACKAGE_DIR}/packages/core/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.main = 'dist/index.js';
    delete pkg.type;
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
fi

# 8. Copy modules — compiled JS only (no TypeScript source)
echo "📁 Copying modules (compiled)..."
mkdir -p "${PACKAGE_DIR}/modules"
for module in wms scm mes pos backup finance; do
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

# 10. Root config files
cp package.json "${PACKAGE_DIR}/"
cp pnpm-workspace.yaml "${PACKAGE_DIR}/"
cp pnpm-lock.yaml "${PACKAGE_DIR}/" 2>/dev/null || true

# 11. Prisma schema (needed for migrate deploy)
mkdir -p "${PACKAGE_DIR}/packages/db/prisma"
cp packages/db/prisma/schema.prisma "${PACKAGE_DIR}/packages/db/prisma/"
cp -r packages/db/prisma/migrations "${PACKAGE_DIR}/packages/db/prisma/" 2>/dev/null || true

# 12. .env.example
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

# 13. start.sh (Linux/Mac)
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

# 14. start.bat (Windows)
cat > "${PACKAGE_DIR}/start.bat" << 'EOF'
@echo off
if not exist .env (
  echo ERROR: Run installer first.
  exit /b 1
)
echo Starting DFlowERP...
node apps\api\dist\server.js
EOF

# 15. install-deps.sh — run by installer after unzip
cat > "${PACKAGE_DIR}/install-deps.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Installing Node.js dependencies..."
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm@9.15.0
fi
pnpm install --prod --shamefully-hoist
# Ensure workspace packages resolve for compiled modules
mkdir -p node_modules/@dflow
ln -sfn ../../packages/core node_modules/@dflow/core 2>/dev/null || true
ln -sfn ../../packages/db node_modules/@dflow/db 2>/dev/null || true
echo "✅ Dependencies installed"
EOF
chmod +x "${PACKAGE_DIR}/install-deps.sh"

# 16. install-deps.bat (Windows)
cat > "${PACKAGE_DIR}/install-deps.bat" << 'EOF'
@echo off
where pnpm >nul 2>nul || npm install -g pnpm@9.15.0
pnpm install --prod --shamefully-hoist
echo Dependencies installed
EOF

# 17. Create ZIP
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

