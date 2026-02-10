# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

ARG BASE_PATH=

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
COPY client/public/ ./public/
COPY client/src/ ./src/

# Build the Vite app (produces dist/)
# When BASE_PATH is set (e.g. /quizapp), Vite uses it as the base for all assets.
# When empty, defaults to "/" (root deployment).
RUN VITE_BASE_PATH=${BASE_PATH:-/} npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM nginx:alpine

ARG BASE_PATH=

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template (envsubst processes it at startup)
COPY client/nginx.conf.template /etc/nginx/templates/default.conf.template

# Copy built static files into subdirectory matching base path.
# Root deployment: files go to /usr/share/nginx/html/
# Base path deployment: files go to /usr/share/nginx/html/quizapp/
COPY --from=build /build/client/dist/ /usr/share/nginx/html${BASE_PATH}/

ENV BASE_PATH=${BASE_PATH}

EXPOSE 80

# Use envsubst to process nginx template at container start.
# Only $BASE_PATH is substituted — nginx variables ($host, $uri, etc.) are left intact.
CMD ["/bin/sh", "-c", "envsubst '$BASE_PATH' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
