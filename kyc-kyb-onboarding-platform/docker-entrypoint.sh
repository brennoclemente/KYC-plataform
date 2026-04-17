#!/bin/sh
set -e

echo "==> Running database migrations..."
# Use node to run prisma migrate deploy to avoid PATH issues
node_modules/.bin/prisma migrate deploy

echo "==> Starting application..."
exec node server.js
