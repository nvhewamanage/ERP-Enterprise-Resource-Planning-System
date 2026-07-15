# ERP System

Modular Enterprise Resource Planning system built with Next.js.
Modules: HR, Payroll, Inventory, Sales, Purchase Orders, Finance, Supplier Management.

**Stack:** Next.js (App Router) + TypeScript · PostgreSQL (raw SQL via `pg`, no ORM) · Docker Compose · Zod validation · Zustand.

# ERP System

Modular Enterprise Resource Planning system built with Next.js.
Modules: HR, Payroll, Inventory, Sales, Purchase Orders, Finance, Supplier Management.

**Stack:** Next.js (App Router) + TypeScript · PostgreSQL (raw SQL via `pg`, no ORM) · Docker Compose · Zod validation · Zustand · JWT auth (`jose`) with RBAC.

**Phase 3 — Business:** Sales (customers + sales orders), Payroll, Finance
(general ledger). Sales orders mirror Purchase Orders' shape exactly —
draft → confirmed → fulfilled/cancelled — except fulfilling a sales order
*debits* stock instead of crediting it, and fails the whole transition if
any line item doesn't have enough on hand (no negative stock).
`payroll:manage` is granted to `hr_manager` (see
`db/migrations/005_payroll_permission.sql`) since payroll processing is
conventionally handled by HR. The Products "list" endpoint now also
accepts `sales:manage` as an alternate permission, same reasoning as the
Purchase Orders fix above — the Sales Order form needs to read products
regardless of which manage-permission the current user holds.

## Modules built so far

**Phase 1 — Foundation:** Docker, Postgres, Auth (JWT), Roles/RBAC, Users, Dashboard shell.

**Phase 2 — Core ERP:** HR (employees), Inventory (products), Suppliers,
Purchase Orders. Purchase Orders ties the other three together: creating
one picks a supplier and one or more products; advancing it to `received`
credits the ordered quantities onto each product's stock automatically
(`src/modules/purchase/services/purchase-order.service.ts`).

Note: `purchase:manage` is granted to `inventory_manager` (see
`db/migrations/003_fix_purchase_role.sql`) — not to the `supplier` role.
Procurement is an internal buying decision made by whoever manages stock;
an external supplier shouldn't be able to create or cancel orders on
their own behalf. The Purchase Orders and Suppliers "list" endpoints also
accept `purchase:manage` as an alternate permission (see
`src/lib/api-auth.ts`'s `requirePermission`), since the PO form needs
read access to both suppliers and products regardless of which specific
module-manage permission the current user holds.

## Authentication & Roles

All `/dashboard/*` routes require a valid session (a JWT stored in an httpOnly
`erp_session` cookie), enforced in `src/middleware.ts`. Each dashboard section
also requires a specific permission — see `src/config/rbac.ts` for the
route → permission map, and `db/migrations/002_auth_roles_users.sql` for the
seeded roles/permissions.

Seeded roles: `super_admin`, `hr_manager`, `inventory_manager`,
`finance_manager`, `sales_manager`, `employee`, `supplier`.

**Default login (change immediately after first sign-in):**
- Email: `admin@erp.local`
- Password: `ChangeMe123!`

## Project structure

```
src/
  app/                  # Next.js routes (pages + API routes)
    api/<module>/       # REST endpoints per module, e.g. api/hr/employees
    api/auth/           # login / logout / me
    login/              # Public login page
    dashboard/           # Auth-protected shell (layout.tsx = sidebar + navbar)
      <module>/          # Page routes per module, e.g. dashboard/hr/page.tsx
      users/              # User management (super admin)
  modules/<module>/      # Business logic, isolated per module
    types/               # TS interfaces
    validations/         # Zod schemas
    services/            # DB access (SQL queries) + business rules
    components/          # Module-specific UI
  modules/auth/           # Login/session verification (no UI of its own)
  components/            # Shared/global UI (Sidebar, Navbar)
  config/rbac.ts          # Route → permission map, sidebar nav items
  lib/db.ts              # Shared Postgres connection pool
  lib/jwt.ts              # Sign/verify session JWTs (jose, Edge-compatible)
  middleware.ts            # Protects /dashboard/*, enforces RBAC
  store/                  # Zustand global stores (auth.store.ts)
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
   Fill in real secrets for `JWT_SECRET` (any long random string works for local dev, e.g. `openssl rand -base64 32`).

2. **Start everything:**
   ```bash
   npm run docker:up
   ```
   This builds the app image and starts two containers:
   - `postgres` — Postgres 16, with `db/migrations/*.sql` auto-applied on first boot
   - `app` — Next.js dev server with hot reload, mounted from your local files

3. **Open the app:** http://localhost:3000 → redirects to `/login`. Sign in with the default admin above.

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
like `db/migrations/003_add_something.sql`, then run:

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
6. Build the UI in `src/app/dashboard/<module>/page.tsx` + `src/modules/<module>/components/`.
7. If the module should be gated behind a permission, add a `permission:name`
   entry to `db/migrations/*.sql`, map it to the right role(s), and register
   the route + nav item in `src/config/rbac.ts`.