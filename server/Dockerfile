# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS build

WORKDIR /build

# Copy shared types (needed for @shared/* alias resolution)
COPY shared/ ./shared/

# Install dependencies + esbuild for transpilation
COPY server/package.json server/package-lock.json ./server/
WORKDIR /build/server
RUN npm ci && npm install --no-save esbuild

# Copy server source
COPY server/tsconfig.json ./
COPY server/src/ ./src/

# Bundle with esbuild: transpiles TS (no type-checking, like tsx in dev),
# resolves @shared/* aliases, keeps node_modules as external requires.
RUN npx esbuild src/index.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile=dist/index.js \
    --packages=external \
    --alias:@shared=../shared

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-bullseye-slim

WORKDIR /app

# Install production dependencies only
# (better-sqlite3 native addon is compiled here for the runtime image)
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy bundled JS from build stage
COPY --from=build /build/server/dist/ ./dist/

# Create data directory for SQLite volume mount
RUN mkdir -p /app/data

ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/app/data/quiz.db

EXPOSE 3001

CMD ["node", "dist/index.js"]
