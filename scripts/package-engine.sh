#!/bin/bash
set -e

VERSION=${1:-"0.1.0"}
OUTPUT_DIR="dist/engine"
PACKAGE_NAME="dflow-engine-${VERSION}"
PACKAGE_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}"

echo "📦 Packaging DFlowERP Engine v${VERSION}..."

# Clean
rm -rf "${OUTPUT_DIR}"
mkdir -p "${PACKAGE_DIR}"

# 1. Build frontend
echo "🔨 Building frontend..."
pnpm --filter @dflow/web build

# 2. Build API (TypeScript → JavaScript)
echo "🔨 Building API..."
pnpm --filter @dflow/api build

# 3. Copy API built files
echo "📁 Copying API..."
mkdir -p "${PACKAGE_DIR}/apps/api"
cp -r apps/api/dist "${PACKAGE_DIR}/apps/api/"
cp apps/api/package.json "${PACKAGE_DIR}/apps/api/"

# 4. Copy frontend built files
echo "📁 Copying frontend..."
mkdir -p "${PACKAGE_DIR}/apps/web"
cp -r apps/web/dist "${PACKAGE_DIR}/apps/web/"

# 5. Copy packages
echo "📁 Copying packages..."
cp -r packages "${PACKAGE_DIR}/"

# 6. Copy modules
echo "📁 Copying modules..."
cp -r modules "${PACKAGE_DIR}/"

# 7. Copy root package files
cp package.json "${PACKAGE_DIR}/"
cp pnpm-workspace.yaml "${PACKAGE_DIR}/"
cp pnpm-lock.yaml "${PACKAGE_DIR}/" 2>/dev/null || true

# 8. Create production .env.example
cat > "${PACKAGE_DIR}/.env.example" << 'EOF'
DATABASE_URL=postgresql://dflow:PASSWORD@localhost:5432/dflow_erp
JWT_SECRET=CHANGE_THIS_32_CHAR_SECRET
JWT_REFRESH_SECRET=CHANGE_THIS_ANOTHER_32_CHAR_SECRET
LICENSE_KEY=YOUR-LICENSE-KEY
LICENSE_SERVER_URL=https://lvhraynmvyvancqyezef.supabase.co
NODE_ENV=production
PORT=3001
API_HOST=localhost
VITE_API_URL=http://localhost:3001
EOF

# 9. Create startup script for Linux/Mac
cat > "${PACKAGE_DIR}/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ ! -f .env ]; then
  echo "❌ .env file not found. Copy .env.example to .env and configure it."
  exit 1
fi
echo "🚀 Starting DFlowERP..."
node apps/api/dist/server.js
EOF
chmod +x "${PACKAGE_DIR}/start.sh"

# 10. Create startup script for Windows
cat > "${PACKAGE_DIR}/start.bat" << 'EOF'
@echo off
if not exist .env (
  echo ERROR: .env file not found. Copy .env.example to .env and configure it.
  exit /b 1
)
echo Starting DFlowERP...
node apps\api\dist\server.js
EOF

# 11. Create install-deps script (run after unzip)
cat > "${PACKAGE_DIR}/install-deps.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📦 Installing dependencies..."
npm install -g pnpm
pnpm install --frozen-lockfile --prod
echo "✅ Dependencies installed"
EOF
chmod +x "${PACKAGE_DIR}/install-deps.sh"

# 12. Create ZIP
echo "🗜️  Creating ZIP archive..."
cd "${OUTPUT_DIR}"
zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}/"
cd -

ZIP_SIZE=$(du -sh "${OUTPUT_DIR}/${PACKAGE_NAME}.zip" | cut -f1)
echo ""
echo "✅ Engine packaged successfully!"
echo "   File: ${OUTPUT_DIR}/${PACKAGE_NAME}.zip"
echo "   Size: ${ZIP_SIZE}"
echo ""
echo "Next: Upload to GitHub Releases as dflow-engine-${VERSION}.zip"

