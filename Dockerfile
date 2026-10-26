# syntax=docker/dockerfile:1.7
# VMS Enterprise: single image serving the API and the built web console.

# ---- build: install all deps, typecheck, build the web console ------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run typecheck && npm run build:web

# ---- runtime: production deps only, non-root ------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    WEB_DIST_DIR=/app/dist
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY tsconfig.json ./
COPY apps/api ./apps/api
COPY packages ./packages
COPY services ./services
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "--import", "tsx", "apps/api/src/server.ts"]
