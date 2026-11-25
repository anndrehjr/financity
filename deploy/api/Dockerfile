# API do Financity (VPS). Build multi-stage; contexto de build = raiz do repositório.
#   docker build -f deploy/api/Dockerfile -t financity-api:TAG .
FROM node:25-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/gateway-sign packages/gateway-sign
# instala só o necessário para a API (sem Next/React); better-sqlite3 é dev-only (migração) e não vai para a imagem final
RUN npm ci --workspace apps/api --workspace packages/gateway-sign --include-workspace-root --ignore-scripts
COPY apps/api apps/api
RUN npm run build --workspace apps/api

FROM node:25-bookworm-slim AS run
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/gateway-sign packages/gateway-sign
RUN npm ci --omit=dev --omit=optional --workspace apps/api --workspace packages/gateway-sign --include-workspace-root --ignore-scripts \
 && npm cache clean --force
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/migrations apps/api/migrations
USER node
WORKDIR /app/apps/api
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "fetch('http://127.0.0.1:8787/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# aplica migrações pendentes (idempotente, com trava) e inicia
CMD ["sh", "-c", "node dist/migrate-cli.js && exec node dist/server.js"]
