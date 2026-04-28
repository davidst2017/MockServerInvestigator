# Stage 1 — build
FROM node:22.14-alpine3.21 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve
FROM nginx:1.27.4-alpine3.21

# Create a non-root user and fix ownership of directories nginx needs to write at runtime
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app \
        /var/cache/nginx \
        /var/log/nginx \
        /etc/nginx/conf.d \
        /usr/share/nginx/html \
    # Move nginx pid file out of /var/run (requires root) to /tmp
    && sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf

# SPA routing config, listens on unprivileged port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder --chown=app:app /app/dist /usr/share/nginx/html

USER app
EXPOSE 8080
