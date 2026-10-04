# TaxIT - Backend (v0.1)

Tax and bookkeeping API for Philippine doctors. Plain **JavaScript** (ES modules) with **Express 5**,
**Prisma** and **PostgreSQL**.

## Project structure

```
server.js                 starts the HTTP server (listen + graceful shutdown)
nodemon.json              dev auto-reload settings
envs/.env.example         template for the real .env in the project root
src/
  app.js                  builds the Express app (helmet, cors, json, routes, error handling)
  config/                 env.js (validated environment), prisma.js (shared database client)
  routes/                 URL -> controller wiring, one file per feature (+ index.js)
  controllers/            thin HTTP layer: read req, call a service, send res
  services/               business logic and database access
  middlewares/            authenticate, requireRole, validate (Zod), rateLimit, errorHandler
  models/                 request validation schemas (Zod)
  shared/                 framework-free code: money, dates, errors, tax rules/engine/deadlines (+ tests)
  prisma/                 schema.prisma, seed.js, migrations/ (created by `prisma migrate dev`)
  generated/prisma/       generated Prisma client (git-ignored, rebuilt on `npm install`)
```

Request flow: `route -> middlewares (auth, validate) -> controller -> service -> Prisma`.

## 1. Database setup (PostgreSQL 16+, installed locally)

Create an empty database named `TaxIT` using your existing Postgres login (the `postgres` superuser works).

**Option A - psql / SQL Shell:**

```sql
CREATE DATABASE "TaxIT";
```

**Option B - pgAdmin:** right-click **Databases** > **Create** > **Database...**, set the name to `TaxIT`
and save (or run the statement above in a Query Tool).

Then put your own Postgres login in `DATABASE_URL` in `.env` (step 2):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/TaxIT
```

- `USER` / `PASSWORD` are the login you already use in pgAdmin (often `postgres`).
  If the password has special characters, URL-encode them (`@` becomes `%40`, `#` becomes `%23`).
- `5432` is the default port; use yours if you changed it during install.
- The login must be allowed to create databases (the `postgres` superuser is), because
  `prisma migrate dev` creates a temporary shadow database.

## 2. Run it

```bash
npm install                    # also runs `prisma generate`
```

Create `.env` in the project root from the template (`cp envs/.env.example .env` on macOS/Linux,
`copy envs\.env.example .env` on Windows), then edit it:

- `DATABASE_URL`: replace `YOUR_PASSWORD` (and the user, if it is not `postgres`) with your Postgres login.
- `JWT_SECRET`: any random string of at least 32 characters. The server will not start without it.

```bash
npx prisma migrate dev --name init     # creates src/prisma/migrations/ and applies it
npx prisma db seed                     # system categories + placeholder plans
npm run dev                            # nodemon, http://localhost:3000/api
```

Check `http://localhost:3000/api/health` returns `{"status":"ok"}`.

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start with plain node (production) |
| `npm test` | Run the tax-engine tests (Node's built-in test runner) |
| `npx prisma migrate dev` | Create/apply a migration after editing `src/prisma/schema.prisma` |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma studio` | Browse the data in the browser |

## Endpoints (all under `/api`; everything except `/health` and `/auth/*` needs `Authorization: Bearer <token>`)
re
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + DB check |
| POST | `/auth/register` `/auth/login` | Returns `accessToken` (15 min) + `refreshToken` |
| POST | `/auth/refresh` `/auth/logout` | Rotating refresh tokens |
| GET/PUT | `/profile` | Doctor profile: TIN, VAT status, income-tax option |
| GET/POST | `/categories` | System + custom categories |
| GET/POST | `/transactions` | List (filters + paging) / create income or expense |
| PUT/DELETE | `/transactions/:id` | Update / soft delete |
| GET | `/tax/income?year=2026` | Cumulative quarterly 1701Q / annual 1701 estimate + percentage tax |
| GET | `/compliance/deadlines?year=2026` | Filing calendar for the doctor's tax setup |

## Adding a feature (example: `invoices`)

1. Add a model to `src/prisma/schema.prisma`, then `npx prisma migrate dev --name add_invoices`.
2. `src/models/invoice.model.js` (Zod schema) -> `src/services/invoice.service.js` ->
   `src/controllers/invoice.controller.js` -> `src/routes/invoice.routes.js`.
3. Mount it in `src/routes/index.js`. Put it below `router.use(authenticate)` to require login, and use
   `requireRole('ACCOUNTANT')` for staff-only routes. Imports use ES module syntax and relative imports 
   need the `.js` extension (`import * as invoiceService from '../services/invoice.service.js'`).

## Design decisions

- **Money is never a JS number.** Amounts are `Decimal(14,2)` in Postgres, 2-dp strings in the JSON
  (services convert Prisma's `Decimal`), and `decimal.js` in the tax engine.
- **Tax engine is pure** (`src/shared/tax`): no database or Express inside it. Rates live in versioned
  rule sets (`rules.js`); add a new set when the law changes instead of editing the old one.
- **Secure by default:** everything under `/api` is behind `authenticate` except health and auth;
  rate limiting (10/min on auth, 120/min overall), helmet, argon2id password hashing, hashed refresh
  tokens with rotation and reuse detection.
- **Every route validates input** with Zod via the `validate` middleware (parsed data is in `req.valid`).
- **Errors:** throw `HttpError` helpers from `src/shared/errors.js`; `errorHandler` formats them as JSON.
  Express 5 forwards errors from `async` handlers automatically, so controllers need no try/catch.
- **Audit log** records auth events and ledger/profile changes (never the TIN itself).
- **Rust-free Prisma client** (`engineType = "client"` + `@prisma/adapter-pg`), generated into
  `src/generated/prisma` and loaded with `import { PrismaClient } from '../generated/prisma/index.js'`.

## Assumptions and known gaps (read before trusting the numbers)

- **Have a Philippine CPA verify `src/shared/tax/rules.js` and the engine.** Figures are estimates, not filing-ready.
- Engine assumes purely self-employed professional income (no compensation income or other sources).
- Not yet implemented: VAT (2550Q) computation, 2307 certificate tracking beyond a withheld-tax amount,
  deadline adjustment for weekends/holidays, 2FA (TOTP), email verification and password reset,
  receipt upload (the `receiptKey` column exists), billing/PayMongo, accountant portal endpoints
  (models `ClientAssignment`, `TaxFiling`, `Subscription` exist already), background jobs.
- Plan prices in `src/prisma/seed.js` are placeholders; set your own.
- Prisma settings live in `package.json` (`"prisma": { "schema", "seed" }`), which Prisma 6 flags as
  deprecated; move them to `prisma.config` when you upgrade to Prisma 7.
- Behind a reverse proxy, call `app.set('trust proxy', 1)` in `src/app.js` so rate limiting sees real client IPs.
- Access tokens stay valid until expiry (15 min) even if a user's role changes.
