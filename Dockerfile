# Frontend (Angular) para despliegue con docker-compose.prod.yml.
# Etapa 1: compila. Etapa 2: nginx sirve los estáticos y reenvía /api al backend.
# El caché de npm se conserva entre intentos si la conexión se corta.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=8 --fetch-retry-mintimeout=5000 --fetch-retry-maxtimeout=120000
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/archivo-frontend/browser /usr/share/nginx/html
EXPOSE 80
