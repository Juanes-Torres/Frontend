#!/bin/sh
# =========================================================
# Genera config.js con las variables de entorno al ARRANCAR el contenedor.
# La imagen oficial de nginx ejecuta todo lo que está en /docker-entrypoint.d/
# antes de iniciar el servidor.
#
# Así la MISMA imagen sirve para desarrollo, pre-producción y producción:
#   docker run -e API_URL=https://api.kairos.com kairos-frontend
#
# Variables:
#   API_URL   (obligatoria) dirección del backend que usará el navegador
# =========================================================
set -eu

HTML_DIR="${HTML_DIR:-/usr/share/nginx/html}"

# Falla al arrancar si falta la configuración (mejor que fallar en el navegador)
if [ -z "${API_URL:-}" ]; then
  echo "kairos-config: ERROR falta la variable de entorno API_URL (ej. -e API_URL=https://api.kairos.com)" >&2
  exit 1
fi

# Solo se aceptan URLs http(s) sin comillas ni espacios, para escribirla segura en JavaScript
if ! printf '%s' "$API_URL" | grep -Eq '^https?://[^"\\<> ]+$'; then
  echo "kairos-config: ERROR API_URL no es una URL válida: $API_URL" >&2
  exit 1
fi

cat > "$HTML_DIR/config.js" <<EOF
// Generado al arrancar el contenedor. No editar a mano.
window.__KAIROS_CONFIG__ = { apiUrl: "$API_URL" };
EOF

echo "kairos-config: API_URL=$API_URL"
