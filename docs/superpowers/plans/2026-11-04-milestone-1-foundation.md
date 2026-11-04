# Milestone 1: Project Foundation & Shared Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the complete monorepo foundation, shared domain schemas, database schema & migrations, backend Hono API on Cloudflare Workers, and frontend React + Vite + Tailwind shell with a shared test runner.

**Architecture:** An npm workspaces monorepo with `apps/web` (React/Vite), `apps/api` (Hono Workers), `packages/shared` (Zod schemas, types, constants), and `packages/db` (Drizzle ORM schema, Supabase migrations, and reference airport/airline seed fixtures).

**Tech Stack:** TypeScript 5+, npm workspaces, React 19, Vite, Tailwind CSS, Hono, Cloudflare Workers (Wrangler), Supabase PostgreSQL, Drizzle ORM, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

## Global Constraints

- Keep the initial development cost at $0 using free-tier / open-source technologies.
- Enforce strict TypeScript typing across all packages (`strict: true`, `noImplicitAny: true`).
- Monetary values must be handled as decimals/integers (numeric 12,2 or cents), never floating-point.
- Every user-facing UI component displaying mock flight data must contain a prominent `[DEMO / MOCK]` indicator.
- Tests must execute via Vitest and pass cleanly in the sandboxed local environment.

## Review Focus

- Missing environment variables in Edge runtime must fail gracefully with descriptive 500 errors.
- Schema validation with Zod must reject invalid IATA airport codes (must be uppercase 3 letters) and non-numeric monetary strings.
- Root scripts (`test`, `build`, `lint`) must propagate across all monorepo workspaces without hanging.
- Frontend layout must render the demo warning banner persistently.
- Database schema must enforce the one-active-agency constraint via a partial unique index.

---

### Task 1: Root Monorepo Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `vitest.workspace.ts`

**Interfaces:**
- Consumes: None (root level)
- Produces: Monorepo workspace orchestration for `apps/*` and `packages/*`

- [ ] **Step 1: Write root configuration files**
  - Create `.gitignore` ignoring `node_modules`, `dist`, `.wrangler`, `.env`, `.env.local`.
  - Create `tsconfig.base.json` with strict type checking, `target: "ES2022"`, `moduleResolution: "Bundler"`.
  - Create root `package.json` defining `workspaces: ["packages/*", "apps/*"]` and scripts: `build`, `test`, `lint`.
  - Create `vitest.workspace.ts` orchestrating workspaces.

- [ ] **Step 2: Verify root workspace resolution**
  - Run: `npm install --dry-run` or verify workspace configuration.

- [ ] **Step 3: Commit**
  ```bash
  git add package.json tsconfig.base.json .gitignore vitest.workspace.ts
  git commit -m "chore: setup monorepo root workspaces and base tsconfig"
  ```

---

### Task 2: Shared Domain Core (`packages/shared`)

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/constants/index.ts`
- Create: `packages/shared/src/schemas/flight.schema.ts`
- Create: `packages/shared/src/schemas/booking.schema.ts`
- Create: `packages/shared/src/schemas/agency.schema.ts`
- Create: `packages/shared/src/schemas/payment.schema.ts`
- Test: `packages/shared/tests/schemas.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `UserRole`, `BookingStatus`, `PaymentStatus`, `CabinClass`, `PassengerType` enums
  - `FlightSearchQuerySchema`, `CreateBookingSchema`, `PaymentSimulationSchema` Zod schemas
  - `AIRPORT_FIXTURES`, `AIRLINE_FIXTURES` baseline fixtures

- [ ] **Step 1: Write the failing test for shared domain schemas**
  - In `packages/shared/tests/schemas.test.ts`, write tests validating `FlightSearchQuerySchema` rejects same origin/destination and invalid date order, and `PaymentSimulationSchema` accepts allowed scenarios.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run packages/shared/tests/schemas.test.ts`
  - Expected: FAIL with missing module/schemas.

- [ ] **Step 3: Implement shared schemas, types, and constants**
  - Implement Zod schemas and TypeScript types in `packages/shared/src`.
  - Export from `packages/shared/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run packages/shared/tests/schemas.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add packages/shared
  git commit -m "feat(shared): implement domain schemas, enums, and fixtures"
  ```

---

### Task 3: Database Layer & Drizzle Schema (`packages/db`)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/users.ts`
- Create: `packages/db/src/schema/agencies.ts`
- Create: `packages/db/src/schema/flights.ts`
- Create: `packages/db/src/schema/bookings.ts`
- Create: `packages/db/src/schema/payments.ts`
- Create: `packages/db/src/schema/tickets.ts`
- Create: `packages/db/src/schema/audit.ts`
- Create: `packages/db/src/seeds/initial-fixtures.ts`
- Create: `packages/db/drizzle.config.ts`
- Test: `packages/db/tests/schema.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`
- Produces:
  - Drizzle PostgreSQL table definitions with foreign keys and unique constraints
  - One active agency membership partial unique index
  - Seed fixtures loader for airports & airlines

- [ ] **Step 1: Write the failing test for DB schema definitions**
  - In `packages/db/tests/schema.test.ts`, test that the schema exports all required tables and verifies that the agency membership partial unique constraint is declared.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run packages/db/tests/schema.test.ts`
  - Expected: FAIL with missing schema modules.

- [ ] **Step 3: Implement Drizzle table definitions and client factory**
  - Implement PostgreSQL schema tables with exact columns from PRD Section 14.
  - Implement `createDbClient(connectionString: string)` with Drizzle.
  - Add initial airport/airline seed fixtures (JFK, LHR, DXB, CDG, SIN, HND, etc.).

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run packages/db/tests/schema.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add packages/db
  git commit -m "feat(db): implement Drizzle PostgreSQL schema and seed fixtures"
  ```

---

### Task 4: Backend Hono API (`apps/api`)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/wrangler.jsonc`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/types/env.ts`
- Create: `apps/api/src/middleware/error-handler.ts`
- Create: `apps/api/src/middleware/cors.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/health.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`, `@travel-platform/db`
- Produces: Hono application running on Cloudflare Workers edge runtime with `/health` and `/api/v1` routes

- [ ] **Step 1: Write the failing test for API health and routes**
  - In `apps/api/tests/health.test.ts`, test `app.request('/health')` returns `200 OK` with `{ status: "healthy", timestamp: ... }`, and `/api/v1` returns API version metadata.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/health.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement Hono API entrypoint and middlewares**
  - Implement Hono app with global CORS, structured JSON error handling, and route mounting.
  - Configure `wrangler.jsonc` for Cloudflare Workers.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/health.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement Hono API server, Cloudflare Workers config, and healthcheck"
  ```

---

### Task 5: Frontend Web Application Shell (`apps/web`)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/components/DemoBanner.tsx`
- Create: `apps/web/src/components/Navbar.tsx`
- Create: `apps/web/src/lib/api-client.ts`
- Test: `apps/web/tests/App.test.tsx`

**Interfaces:**
- Consumes: `@travel-platform/shared`
- Produces: React SPA with Tailwind CSS, global Demo indicator banner, navigation header, and typed API client

- [ ] **Step 1: Write the failing test for frontend shell**
  - In `apps/web/tests/App.test.tsx`, assert that `DemoBanner` renders "DEMO / MOCK ENVIRONMENT - No Real Tickets or Payments", and navigation contains links for Flights, Agency, and Admin.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/App.test.tsx`
  - Expected: FAIL

- [ ] **Step 3: Implement Frontend Shell and Tailwind CSS layout**
  - Setup Vite + React + Tailwind CSS with responsive layout.
  - Implement `DemoBanner`, `Navbar`, and baseline `App.tsx`.
  - Implement typed `apiClient` pointing to `/api/v1`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/App.test.tsx`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement React + Vite + Tailwind shell with persistent demo banner"
  ```

---

### Task 6: Monorepo Orchestration & Full Build Verification

**Files:**
- Modify: `package.json` (root build/test/lint scripts)
- Test: Run root `npm run build` and `npm test`

- [ ] **Step 1: Run comprehensive monorepo test suite**
  - Run: `npm test` from root
  - Expected: All test suites in `packages/shared`, `packages/db`, `apps/api`, and `apps/web` pass cleanly.

- [ ] **Step 2: Run comprehensive monorepo build**
  - Run: `npm run build` from root
  - Expected: Clean compilation with 0 errors across all workspaces.

- [ ] **Step 3: Commit**
  ```bash
  git add package.json
  git commit -m "chore: verify monorepo build and test orchestration"
  ```

