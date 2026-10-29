// Configuración de la app según el entorno (desarrollo, pre-producción, producción).
// Orden de prioridad:
//   1. window.__KAIROS_CONFIG__ → lo escribe el contenedor al arrancar (public/config.js)
//   2. VITE_API_URL del .env      → solo para desarrollo con `npm run dev`
//   3. http://localhost:8080      → valor por defecto

interface ConfigEjecucion {
  apiUrl?: string;
}

declare global {
  interface Window {
    __KAIROS_CONFIG__?: ConfigEjecucion;
  }
}

const enEjecucion = window.__KAIROS_CONFIG__ ?? {};

export const config = {
  apiUrl: enEjecucion.apiUrl || import.meta.env.VITE_API_URL || "http://localhost:8080",
};
