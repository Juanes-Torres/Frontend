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

# Dirección del backend que usará el NAVEGADOR. Vite la escribe dentro de la
# página al compilar, por eso se pasa aquí y no al arrancar el contenedor.
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /build/dist /usr/share/nginx/html

EXPOSE 80
