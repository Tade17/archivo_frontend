# Frontend (Angular) para despliegue con docker-compose.prod.yml.
# Etapa 1: compila. Etapa 2: nginx sirve los estáticos y reenvía /api al backend.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/archivo-frontend/browser /usr/share/nginx/html
EXPOSE 80
