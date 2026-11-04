FROM node:22-slim
WORKDIR /app
COPY ingest-service/package*.json ./
RUN npm ci --omit=dev
COPY ingest-service/ .
CMD ["node", "index.js"]
