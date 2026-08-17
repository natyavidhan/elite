# ---- Frontend build ----
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The bundled deploy serves the frontend and the API from the same
# process and port, so sync just targets same-origin /api/sync — nothing
# to configure. Override at build time (--build-arg VITE_API_URL=...) if
# you're building this image to talk to a *different* server instead.
ARG VITE_API_URL=same-origin
ARG VITE_SYNC_TOKEN=
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SYNC_TOKEN=${VITE_SYNC_TOKEN}
RUN npm run build

# ---- Server dependencies (compiles better-sqlite3's native binding) ----
# Debian slim, not alpine: musl (alpine's libc) isn't glibc, so even a
# platform with a prebuilt better-sqlite3 binary available falls back to
# compiling from source here — hence python3/make/g++ in this stage only.
# The final runtime stage below copies the compiled result and skips the
# toolchain entirely, keeping the shipped image lean.
FROM node:22-bookworm-slim AS server-builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ---- Server + static runtime ----
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=server-builder /app/node_modules ./node_modules
COPY server/ ./
COPY --from=frontend-builder /app/dist ./public

ENV PORT=8080
ENV DATA_DIR=/data
VOLUME /data
EXPOSE 8080

CMD ["node", "index.js"]
