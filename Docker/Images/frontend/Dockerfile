# Usa una versione specifica e stabile di Nginx su Alpine
FROM nginx:1.27-alpine

# Set permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]