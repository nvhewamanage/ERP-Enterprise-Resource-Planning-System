# ERP System

Modular Enterprise Resource Planning system built with Next.js.
Modules: HR, Payroll, Inventory, Sales, Purchase Orders, Finance, Supplier Management.

**Stack:** Next.js (App Router) + TypeScript · PostgreSQL (raw SQL via `pg`, no ORM) · Docker Compose · Zod validation · Zustand.

## Project structure

```
src/
  app/                  # Next.js routes (pages + API routes)
    api/<module>/       # REST endpoints per module, e.g. api/hr/employees
    <module>/           # Page routes per module, e.g. app/hr/page.tsx
  modules/<module>/      # Business logic, isolated per module
    types/               # TS interfaces
    validations/         # Zod schemas
    services/            # DB access (SQL queries) + business rules
    components/          # Module-specific UI
    hooks/                # Module-specific React hooks
  components/            # Shared/global UI (Sidebar, etc.)
  lib/db.ts              # Shared Postgres connection pool
  config/                # App-wide config
  middleware/             # Auth/request middleware
  store/                  # Zustand global stores
  utils/                  # Shared utilities
db/
  migrations/             # Plain SQL migration files, run in order
scripts/
  migrate.js              # Applies any not-yet-applied migrations
```

Each module is self-contained: its own types, validation, and DB queries.
This keeps HR, Payroll, Inventory, etc. independently extendable without
tangling their logic together — the same shape you'd want if this ever
gets split into microservices later.

## Getting started (Docker)

1. **Copy the env file:**
   ```bash
   cp .env.example .env
   ```
   Fill in real secrets for `NEXTAUTH_SECRET` and `JWT_SECRET` (any long random string works for local dev).

2. **Start everything:**
   ```bash
   npm run docker:up
   ```
   This builds the app image and starts two containers:
   - `postgres` — Postgres 16, with `db/migrations/001_init.sql` auto-applied on first boot
   - `app` — Next.js dev server with hot reload, mounted from your local files

3. **Open the app:** http://localhost:3000

4. **Stop everything:**
   ```bash
   npm run docker:down
   ```

5. **Reset the database** (wipes all data, re-runs migrations from scratch):
   ```bash
   npm run docker:reset
   npm run docker:up
   ```

### Adding new migrations later

Postgres only auto-runs files in `db/migrations/` the *first* time the
database volume is created. Once the DB already has data, add a new file
like `db/migrations/002_add_something.sql`, then run:

```bash
docker compose exec app npm run migrate
```

### Running without Docker (optional)

If you'd rather run Postgres locally instead of in a container, just point
`DATABASE_URL` in `.env` at your local instance, then:

```bash
npm install
npm run migrate
npm run dev
```

## Database access pattern

No ORM. `src/lib/db.ts` exports a `query()` helper around a `pg` connection
pool. Each module's `services/*.service.ts` file writes plain SQL against
its own tables (see `src/modules/hr/services/employee.service.ts` for the
full pattern: list / getById / create / update / delete).

## Adding a new module feature

1. Add/adjust a table in a new file under `db/migrations/`.
2. Define the TS type in `src/modules/<module>/types/`.
3. Define the Zod schema in `src/modules/<module>/validations/`.
4. Write the SQL queries in `src/modules/<module>/services/`.
5. Expose it via `src/app/api/<module>/route.ts`.
6. Build the UI in `src/app/<module>/page.tsx` + `src/modules/<module>/components/`.