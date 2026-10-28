// Configuración en tiempo de ejecución (factor III de los 12 factores).
// En desarrollo queda vacío y la app usa VITE_API_URL del .env.
// En Docker, este archivo se reescribe al ARRANCAR el contenedor con las
// variables de entorno (ver docker/40-kairos-config.sh), sin recompilar.
window.__KAIROS_CONFIG__ = {};
