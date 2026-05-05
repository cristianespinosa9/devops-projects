# syntax=docker/dockerfile:1.7
FROM node:20.11-alpine AS builder
WORKDIR /app
COPY src/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src/ ./

FROM node:20.11-alpine
LABEL org.opencontainers.image.title="prod-app" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/cristianespinosa9/devops-projects"

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package.json ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

CMD ["node", "server.js"]
