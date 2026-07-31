FROM --platform=arm64 nginx:1.25-alpine
COPY ./default.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/www/html
COPY --from=frontend /app/.next/standalone /var/www/html