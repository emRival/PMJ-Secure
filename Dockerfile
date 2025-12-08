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

# Install runtime dependencies for better-sqlite3 (if needed, usually just node is enough if prebuilt works, 
# but better-sqlite3 might need recompiling if glibc versions differ significantly, though node:20-slim to node:20-slim is safe)
# We might need python3/make/g++ again if npm ci --omit=dev triggers a build
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

# Create a directory for the database
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/passwords.db
ENV PORT=3000
# ENV ORIGIN=http://localhost:3000

EXPOSE 3000

CMD ["node", "build"]
