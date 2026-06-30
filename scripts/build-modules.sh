#!/bin/bash
set -e

MODULES=(wms scm mes pos backup finance)

echo "🔨 Building modules..."
for module in "${MODULES[@]}"; do
  dir="modules/${module}"
  if [ ! -f "${dir}/module.plugin.ts" ]; then
    echo "  ⚠ Skipping ${module} (no module.plugin.ts)"
    continue
  fi

  echo "  Building ${module}..."
  rm -rf "${dir}/dist"
  npx esbuild "${dir}/module.plugin.ts" "${dir}/manifest.ts" "${dir}/src/**/*.ts" \
    --platform=node \
    --format=cjs \
    --outdir="${dir}/dist" \
    --outbase="${dir}"
done

echo "✅ Modules built"
