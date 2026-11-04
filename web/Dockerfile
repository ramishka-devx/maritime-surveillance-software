FROM node:22-slim AS build
WORKDIR /app
COPY web/package*.json ./
RUN npm ci
COPY web/ .
# "/" makes api.js use same-origin /api/... (nginx proxies it to meta-service).
RUN VITE_API_BASE_URL=/ npm run build

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
