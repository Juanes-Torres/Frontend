# KAIRÓS · Frontend

Página web de KAIRÓS: catálogo de productos, inventario por almacén, administración de usuarios y registro de empresas.
Está hecha con **React 19 + TypeScript + Vite** y consume la API REST del backend ([Juanes-Torres/Backen](https://github.com/Juanes-Torres/Backen)).

## Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | **24** (ver `.nvmrc`) | Desarrollo local |
| npm | 11 o superior | Viene con Node 24 |
| Docker Desktop | Reciente | Correr todo en contenedores |

La versión de Node es la misma en tu equipo y en la imagen de Docker (`node:24-alpine`).
Si usas otra, `npm install` falla a propósito (`engine-strict` en `.npmrc`). Con nvm: `nvm use`.

## Formas de correr el proyecto

### 1. Todo en contenedores (recomendado)

El `docker-compose.yml` está en el repositorio del **backend** y levanta PostgreSQL, el backend y este frontend.
Clona los dos repositorios uno al lado del otro:

```
kairos-backend/    ← docker-compose.yml y .env
kairos-frontend/   ← este repositorio
```

En `kairos-backend`, copia `.env.example` como `.env`, llena las claves y pon `FRONTEND_PATH=../kairos-frontend`. Luego:

```bash
docker compose up --build -d     # levanta todo
docker compose ps                # el frontend debe verse "healthy"
docker compose down              # detiene (los datos se conservan)
docker compose down -v           # detiene y BORRA los datos de la base
```

| Servicio | Dirección |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 (Swagger en `/swagger-ui.html`) |
| PostgreSQL | `localhost:5433` |

### 2. Frontend en modo desarrollo (recarga al guardar)

Útil para trabajar en las pantallas. Necesita el backend corriendo en `http://localhost:8080`.

```bash
cp .env.example .env   # solo la primera vez
npm ci                 # instala exactamente lo que dice package-lock.json
npm run dev            # http://localhost:5173
```

El puerto es siempre **5173**, porque es el origen que el backend acepta en CORS.
Si el contenedor del frontend está corriendo, ocupa ese puerto: detenlo con `docker compose stop frontend` antes de `npm run dev`.

### 3. Solo la imagen del frontend

```bash
docker build -t kairos-frontend .
docker run -p 8081:80 -e API_URL=http://localhost:8080 kairos-frontend
```

## Configuración

La dirección del backend **no** se mete en el código ni en la imagen: llega desde afuera, así la misma imagen sirve para desarrollo, pre-producción y producción.

| Variable | Dónde | Obligatoria | Descripción |
|---|---|---|---|
| `VITE_API_URL` | `.env` (solo `npm run dev`) | No (por defecto `http://localhost:8080`) | Dirección del backend en desarrollo |
| `API_URL` | Contenedor (`-e`) | **Sí** | Dirección del backend que usa el navegador |
| `PORT` | Contenedor (`-e`) | No (por defecto `80`) | Puerto donde escucha nginx dentro del contenedor |

Al arrancar, el contenedor escribe `config.js` con `API_URL`, y la página lo lee antes de iniciar ([src/config.ts](src/config.ts)).
Si falta `API_URL` o `PORT` no es válido, el contenedor se detiene con un mensaje claro.

**Health check:** `GET /salud` responde `{"estado":"UP"}`. Docker lo consulta cada 10 segundos.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Revisa los tipos y arma la página en `dist/` |
| `npm run lint` | Revisa el estilo del código con ESLint |
| `npm run preview` | Sirve `dist/` para probar la compilación |

## Estructura

```
src/
  api/          cliente HTTP (client.ts) y un archivo por recurso del backend
  context/      sesión del usuario (AuthContext)
  components/   piezas reutilizables (Navbar, Mensaje, rutas protegidas)
  pages/        una pantalla por archivo
  utils/        funciones de apoyo
  config.ts     de dónde sale la dirección del backend
docker/         plantilla de nginx y script de arranque del contenedor
```

## Ramas

| Rama | Ambiente |
|---|---|
| `main` | Producción |
| `staging` | Pre-producción |
| `develop` | Desarrollo: aquí llegan los PR de `feature/*` |

Las ramas nuevas salen de `develop` con el nombre `feature/SCRUM-<número>-<descripción>`.

## 12 factores

| Factor | Cómo se cumple |
|---|---|
| I. Código base | Un repositorio, varios despliegues (ramas por ambiente) |
| II. Dependencias | `package-lock.json` + `npm ci`; Node fijado en `.nvmrc` y `engines` |
| III. Configuración | `API_URL` y `PORT` como variables de entorno |
| IV. Servicios de respaldo | El backend es una URL intercambiable |
| V. Construir, publicar, ejecutar | Una imagen; la configuración se aplica al arrancar |
| VI. Procesos | Sin estado en el servidor: la sesión vive en el navegador (JWT) |
| VII. Puertos | nginx escucha en `PORT` |
| IX. Desechabilidad | El contenedor arranca en segundos y se puede reemplazar |
| X. Paridad dev/prod | Misma versión de Node, mismo puerto 5173 y el mismo stack con Docker Compose |
