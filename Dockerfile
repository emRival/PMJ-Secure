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
RUN npm ci --omit=dev && \
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build ./build

# Create a directory for the database and set permissions for non-root user
# We only chown the data directory to avoid slow `chown -R` on node_modules
RUN mkdir -p /app/data && \
    chown -R node:node /app/data

# Switch to non-root user for security
USER node

ENV DB_PATH=/app/data/passwords.db
ENV PORT=3000
# ENV ORIGIN=http://localhost:3000

EXPOSE 3000

CMD ["node", "build"]
