import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Siempre 5173: es el origen que el backend permite en CORS. Si el puerto está
    // ocupado (por ejemplo por el contenedor), Vite falla en vez de usar otro en silencio.
    port: 5173,
    strictPort: true,
  },
  // Pruebas: npm test · Cobertura: npm run test:coverage
  test: {
    environment: 'jsdom',            // simula el navegador (document, localStorage...)
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // lcov.info es el archivo que lee SonarQube (sonar.javascript.lcov.reportPaths)
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // Lo mismo que sonar.coverage.exclusions: arranque y archivos solo de tipos
      exclude: ['src/main.tsx', 'src/types.ts', 'src/vite-env.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      // Si la cobertura baja de 80% las pruebas fallan (también en el CI)
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 80 },
    },
  },
})
