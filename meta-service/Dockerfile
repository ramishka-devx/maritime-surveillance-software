FROM node:22-slim
WORKDIR /app
COPY meta-service/package*.json ./
RUN npm ci --omit=dev
COPY meta-service/ .
# Migrations are idempotent, so run them on every start.
CMD ["sh", "-c", "npm run db:migrate && node src/server.js"]
