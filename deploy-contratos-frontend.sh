#!/usr/bin/env bash
# ===========================================================================
#  deploy.sh — contratosQuliatasIAFront
#  Build de Angular + sustitución de placeholders + deploy a Firebase
#  Hosting. Vive en la raíz del repo.
# ===========================================================================
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

PROJECT_ID="${PROJECT_ID:-qlts-dev-mx-au-ia-agentes}"
REGION="${REGION:-us-central1}"
FIREBASE_HOSTING_TARGET="${FIREBASE_HOSTING_TARGET:-desa}"
AUTH_USUARIO="${AUTH_USUARIO:-}"
AUTH_CONTRASENA="${AUTH_CONTRASENA:-}"

echo "▸ Resolviendo URLs de backend dinámicamente (nunca hardcodear)"

FILES_BASE_URL="$(gcloud run services describe agentes-files \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
VECTOR_ADMIN_BASE_URL="$(gcloud run services describe agentes-vector-admin \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
VECTOR_SEARCH_BASE_URL="$(gcloud run services describe agentes-vector-search \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
CONVERSATION_BASE_URL="$(gcloud run services describe agentes-conversation \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
INSTRUCCIONES_SISTEMA_BASE_URL="$(gcloud run services describe instrucciones-sistema \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"
BITACORA_BASE_URL="$(gcloud run services describe agentes-bitacora \
  --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)' 2>/dev/null || true)"

echo "  FILES_BASE_URL:                 ${FILES_BASE_URL}"
echo "  VECTOR_ADMIN_BASE_URL:          ${VECTOR_ADMIN_BASE_URL}"
echo "  VECTOR_SEARCH_BASE_URL:         ${VECTOR_SEARCH_BASE_URL}"
echo "  CONVERSATION_BASE_URL:          ${CONVERSATION_BASE_URL}"
echo "  INSTRUCCIONES_SISTEMA_BASE_URL: ${INSTRUCCIONES_SISTEMA_BASE_URL} (vacío hasta que se despliegue)"
echo "  BITACORA_BASE_URL:              ${BITACORA_BASE_URL}"

npm ci

# Sustituir los placeholders ANTES del build.
sed -i "s|__FILES_BASE_URL__|${FILES_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__VECTOR_ADMIN_BASE_URL__|${VECTOR_ADMIN_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__VECTOR_SEARCH_BASE_URL__|${VECTOR_SEARCH_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__CONVERSATION_BASE_URL__|${CONVERSATION_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__INSTRUCCIONES_SISTEMA_BASE_URL__|${INSTRUCCIONES_SISTEMA_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__BITACORA_BASE_URL__|${BITACORA_BASE_URL}|g" src/environments/environment.prod.ts
sed -i "s|__AUTH_USUARIO__|${AUTH_USUARIO}|g" src/environments/environment.prod.ts
sed -i "s|__AUTH_CONTRASENA__|${AUTH_CONTRASENA}|g" src/environments/environment.prod.ts

npx ng build --configuration production

echo "▸ Desplegando a Firebase Hosting (target: ${FIREBASE_HOSTING_TARGET})"

npx firebase-tools@latest deploy \
  --only "hosting:${FIREBASE_HOSTING_TARGET}" \
  --project "${PROJECT_ID}"

echo "✔ Desplegado"