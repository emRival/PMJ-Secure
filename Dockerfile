# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install build deps for native modules (needed for better-sqlite3), then cleanup immediately
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install production deps, then remove build tools to reduce attack surface
# Also install 'gosu' for safe user switching in entrypoint
RUN npm ci --omit=dev && \
    apt-get update && \
    apt-get install -y --no-install-recommends gosu && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build ./build

# Create a directory for the database
# We still set basic permissions, but entrypoint will fix bind mounts
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Copy entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV DB_PATH=/app/data/passwords.db
ENV PORT=3000
# ENV ORIGIN=http://localhost:3000

EXPOSE 3000

# Use the entrypoint script to handle permissions dropping
ENTRYPOINT ["entrypoint.sh"]
CMD ["node", "build"]
