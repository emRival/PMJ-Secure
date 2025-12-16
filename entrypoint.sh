#!/bin/sh
set -e

# Fix permissions on the data directory (mounted volume)
# This runs as root before switching users
if [ -d "/app/data" ]; then
    echo "Fixing permissions for /app/data..."
    chown -R node:node /app/data
fi

# Switch to 'node' user and run the intended command
# We use 'gosu' if available (preferred), otherwise fall back to su-exec or su
# But for this setup, we will ensure gosu is installed in Dockerfile
exec gosu node "$@"
