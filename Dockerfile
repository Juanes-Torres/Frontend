# =========================================================
# KAIRÓS frontend - imagen de Docker en DOS etapas
#   1. "compilacion": tiene Node; instala paquetes y arma la página (carpeta dist)
#   2. imagen final: solo nginx sirviendo los archivos ya armados -> liviana
# Construir:  docker build -t kairos-frontend .
# =========================================================

# ---------- Etapa 1: armar la página ----------
FROM node:24-alpine AS compilacion
WORKDIR /build

# Primero solo package.json y package-lock.json: así Docker reutiliza
# node_modules si solo cambió el código (las siguientes compilaciones son más rápidas)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# La compilación NO lleva la dirección del backend: la imagen es la misma para
# todos los entornos. La configuración llega al arrancar (factor III).
RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /build/dist /usr/share/nginx/html

# Al arrancar, este script escribe config.js con las variables de entorno
COPY --chmod=755 docker/40-kairos-config.sh /docker-entrypoint.d/40-kairos-config.sh

EXPOSE 80
# Ejecutar:  docker run -p 8081:80 -e API_URL=http://localhost:8080 kairos-frontend
