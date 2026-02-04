# Base Debian slim - glibc compatibile, dimensioni ridotte
FROM node:22-bookworm-slim

WORKDIR /opt/backend/app

# Install dependencies in single layer per ridurre dimensioni
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/* \
    && rm -rf /tmp/*

# Switch to node user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "/opt/backend/app/dist/main.js"]
