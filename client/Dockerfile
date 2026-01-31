# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /build

# Copy shared types (needed for @shared/* path alias during build)
COPY shared/ ./shared/

# Install dependencies
COPY client/package.json client/package-lock.json ./client/
WORKDIR /build/client
RUN npm ci

# Copy source files and configs
COPY client/tsconfig.json client/vite.config.ts client/postcss.config.js client/tailwind.config.js ./
COPY client/index.html ./
COPY client/src/ ./src/

# Build the Vite app (produces dist/)
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from build stage
COPY --from=build /build/client/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
