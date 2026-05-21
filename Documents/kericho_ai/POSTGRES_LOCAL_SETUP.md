Local Postgres (Docker) setup

This project expects PostgreSQL in production, and the repo includes a `docker-compose.yml` to run a local Postgres for development.

If Docker is available on your machine, run:

```bash
# start Postgres
docker compose up -d

# apply Prisma schema and generate client
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
  npx prisma generate

# seed DB
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public" \
  npm run prisma:seed

# restart backend
pkill -f "node src/index.js" || true
npm run dev
```

If Docker isn't available here, you can run `npm run postgres:start` which will try `docker compose` or `podman-compose` and otherwise print the manual steps above.

If you prefer to keep working with SQLite locally, set `DATABASE_URL=file:./dev.db` in your environment; see `src/config/env.js` for validation rules.