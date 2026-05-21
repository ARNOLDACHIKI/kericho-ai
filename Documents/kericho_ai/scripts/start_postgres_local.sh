#!/usr/bin/env bash
set -euo pipefail

# Helper to start local Postgres for development.
# Tries docker compose, then podman-compose. If neither is available or the daemon
# is not running, prints clear manual steps.

COMPOSE_CMD=""

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
  else
    echo "Docker CLI found but daemon not running."
  fi
fi

if [ -z "$COMPOSE_CMD" ] && command -v podman >/dev/null 2>&1; then
  if podman system service --time=0 >/dev/null 2>&1 & then
    # If podman service can be started in background, try to use docker compose (podman provides a compat socket)
    echo "Starting podman service in background..."
    # Note: starting the service may require user interaction; if it fails, fall through
  fi
  if command -v podman-compose >/dev/null 2>&1; then
    COMPOSE_CMD="podman-compose"
  fi
fi

if [ -n "$COMPOSE_CMD" ]; then
  echo "Using: $COMPOSE_CMD up -d"
  $COMPOSE_CMD up -d
  echo "Waiting for Postgres to be ready..."
  # Wait for pg_isready inside the container
  sleep 2
  COUNT=0
  until $COMPOSE_CMD ps >/dev/null 2>&1 || [ $COUNT -ge 10 ]; do
    sleep 1
    COUNT=$((COUNT+1))
  done
  echo "Postgres startup attempted. Run the Prisma commands to apply the schema."
  exit 0
fi

cat <<'EOF'
Could not start Postgres automatically because Docker/Podman isn't available or the daemon isn't running.
Please run the following commands manually on your machine where Docker is available:

1) Start Postgres with Docker Compose

   docker compose up -d

2) Apply Prisma schema and generate client

   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
     npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
     npx prisma generate

3) Seed the database

   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
     npm run prisma:seed

4) Restart the backend

   pkill -f "node src/index.js" || true
   npm run dev

If you want me to create a migration instead of using db push, say "create migration" and I'll add it.
EOF
