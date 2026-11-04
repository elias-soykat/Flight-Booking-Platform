# Flight Booking Platform — Deployment and Operations Runbook
**Zero-Dollar Infrastructure ($0 Tier) & Production Verification Guide**

---

## 1. Executive Summary & Zero-Dollar Infrastructure

This platform is a flight-first Travel Booking Platform MVP engineered as a TypeScript modular monolith monorepo (`npm` workspaces). It provides complete flight search, markup engine, deterministic mock inventory, passenger checkout, idempotent payment simulation, 13-digit e-ticket generation, agency multi-party management, cancellation workflow, live operational metrics, and immutable audit trails.

To satisfy the strict **$0 initial infrastructure requirement**, the production deployment targets enterprise-grade free tiers:

| Component | Platform | Free Tier Quota / Benefit | Cost |
| :--- | :--- | :--- | :--- |
| **Edge API Worker** | Cloudflare Workers | 100,000 requests/day, global edge latency (<50ms) | **$0.00** |
| **Frontend SPA** | Cloudflare Pages | Unlimited bandwidth, global CDN, automated Git preview | **$0.00** |
| **Database & Auth** | Supabase Free Tier | 500 MB PostgreSQL, connection pooler (port 6543), Auth | **$0.00** |
| **Monorepo Tooling** | Vitest & TypeScript | Local & CI execution, zero external paid tooling | **$0.00** |
| **Total Monthly Spend** | | | **$0.00** |

---

## 2. Prerequisite Setup ($0 Free Tier Accounts)

### 2.1 Cloudflare Account
1. Create a free account at [Cloudflare](https://dash.cloudflare.com/sign-up).
2. Authenticate the local Wrangler CLI:
   ```bash
   npx wrangler login
   ```
3. Verify your account ID:
   ```bash
   npx wrangler whoami
   ```

### 2.2 Supabase Account
1. Create a free project at [database.new](https://database.new).
2. Select your closest region (e.g., `us-east-1` or `eu-central-1`).
3. Note your project credentials under **Project Settings &rarr; API**:
   - `Project URL`: `https://<project-ref>.supabase.co`
   - `anon public key`: `eyJhbGciOi...`
   - `service_role secret key`: `eyJhbGciOi...`
4. Retrieve your **Transaction Connection Pooler** URI under **Project Settings &rarr; Database &rarr; Connection Pooling**:
   - `postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

---

## 3. Database Schema & Migration Execution

The database layer utilizes **Drizzle ORM** with PostgreSQL schemas located in `packages/db/src/schema/`.

### 3.1 Environment Configuration
Create `.env` in the repository root or `packages/db/.env`:
```env
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 3.2 Executing Migrations
Push schema definitions directly to the Supabase database:
```bash
# Push schema changes to Supabase PostgreSQL
npm run db:push --workspace=@travel-platform/db

# Or generate SQL migrations
npm run db:generate --workspace=@travel-platform/db
```

The database initializes 8 core tables:
- `users`: Core user accounts with role-based attributes (`CUSTOMER`, `AGENCY_AGENT`, `AGENCY_ADMIN`, `PLATFORM_ADMIN`).
- `agencies`: Registered agency entities with verification status and credit limits.
- `agency_members`: Multi-tenant associations linking agents/customers to specific agencies.
- `agency_invitations`: Secure SHA-256 hashed invite tokens for customer/agent onboarding.
- `bookings`: Master booking records with lifecycle state and deterministic price snapshots.
- `passengers`: Passenger details, document info, and baggage allocations.
- `payments`: Payment simulation tracking, transaction IDs, and idempotency signatures.
- `tickets`: Issued 13-digit e-tickets (`001-DEMO-XXXXXXXXXX`).
- `cancellation_requests`: Customer-initiated cancellation requests pending review.
- `audit_logs`: Append-only immutable administrative audit trail.

---

## 4. Backend Cloudflare Workers API Deployment

The backend application is built on **Hono v4** and compiled for Cloudflare Workers edge runtime.

### 4.1 Configuration (`apps/api/wrangler.toml`)
```toml
name = "travel-platform-api"
main = "src/index.ts"
compatibility_date = "2024-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"
DEFAULT_CURRENCY = "USD"
SUPABASE_URL = "https://<your-project>.supabase.co"
SUPABASE_ANON_KEY = "<your-anon-key>"
```

### 4.2 Binding Production Secrets
Cloudflare Workers secrets must be encrypted and stored directly in Cloudflare:
```bash
# Bind Supabase connection pooler securely
npx wrangler secret put DATABASE_URL --config apps/api/wrangler.toml

# Bind Supabase Service Role Key
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config apps/api/wrangler.toml
```

### 4.3 Deployment Execution
```bash
# Build and deploy API to Cloudflare Workers
npm run deploy:api
```
Your API will deploy to `https://travel-platform-api.<your-subdomain>.workers.dev`.

### 4.4 Health Check Verification
```bash
curl https://travel-platform-api.<your-subdomain>.workers.dev/health
# Response: {"status":"healthy","timestamp":...}
```

---

## 5. Frontend Cloudflare Pages SPA Deployment

The frontend is a Vite + React 19 Single Page Application equipped with Tailwind CSS and Lucide icons.

### 5.1 Cloudflare Pages Configuration
- `apps/web/public/_routes.json`: Directs all non-static asset routes through SPA routing rules.
- `apps/web/public/_redirects`: Provides `/*  /index.html  200` rewrite rules for client-side routing.

### 5.2 Build & Deploy Command
```bash
# Deploy static build to Cloudflare Pages
npm run deploy:web
```
Or connect your GitHub repository directly to Cloudflare Pages:
- **Build command**: `npm run build --workspace=@travel-platform/web`
- **Output directory**: `apps/web/dist`
- **Root directory**: `/`

---

## 6. End-to-End Verification Matrix (PRD Section 20 Compliance)

The platform is strictly verified against all 5 mandatory scenarios specified in **PRD Section 20 "Definition of Done"**. All tests run fully automated against the Hono API routes:

| PRD Scenario | Scope & Requirements | Automated Test Suite | Status |
| :--- | :--- | :--- | :--- |
| **Scenario A: Direct Customer Booking & Mock Issuance** | Search flight &rarr; verify search results &rarr; create booking &rarr; simulate SUCCESS payment &rarr; verify 13-digit ticket issuance (`001-DEMO-...`) &rarr; retrieve booking details. | `apps/api/tests/e2e-scenarios-ab.test.ts` (Scenario A) | **PASSED** (100%) |
| **Scenario B: Agency Multi-Party Booking & RBAC Separation** | Register agency &rarr; issue invitation token &rarr; customer accepts &rarr; verify strictly one active agency constraint &rarr; agency books on customer's behalf &rarr; customer and agency visibility verified &rarr; unauthorized access blocked. | `apps/api/tests/e2e-scenarios-ab.test.ts` (Scenario B) | **PASSED** (100%) |
| **Scenario C: Payment Failure, Idempotency & Admin Reconciliation** | Customer checkout triggers simulated `TIMEOUT` &rarr; verify booking status is `PENDING` & payment status is `UNKNOWN` &rarr; re-submission with duplicate idempotency key is safely deduplicated &rarr; administrator reviews unreconciled list &rarr; manual reconciliation forces status & emits immutable audit log. | `apps/api/tests/e2e-scenarios-cde.test.ts` (Scenario C) | **PASSED** (100%) |
| **Scenario D: Ticketing Queue & Administrative Manual Fulfillment** | Booking with settled payment awaiting ticketing is placed in ticketing queue &rarr; admin queries `/api/v1/admin/ticketing-queue` &rarr; admin triggers manual fulfillment &rarr; 13-digit ticket numbers generated &rarr; booking state transitions to `TICKETED`. | `apps/api/tests/e2e-scenarios-cde.test.ts` (Scenario D) | **PASSED** (100%) |
| **Scenario E: Cancellation Request, Admin Review & Reversal Cycle** | Customer submits cancellation request with reason &rarr; booking status becomes `CANCELLATION_PENDING` &rarr; admin reviews and rejects &rarr; booking reverts to previous state (`TICKETED`) &rarr; customer re-submits &rarr; admin approves &rarr; booking transitions to `CANCELLED` & audit log recorded. | `apps/api/tests/e2e-scenarios-cde.test.ts` (Scenario E) | **PASSED** (100%) |

### Running the Full Test Suite
```bash
# Run all 29+ test suites across API, Web, and Shared packages
npm test
```

---

## 7. Operational Runbook & Day-2 Workflows

### 7.1 Operational Metrics Dashboard
Platform administrators access the live 8-card dynamic operational dashboard via `GET /api/v1/admin/metrics`:
1. **Total Bookings**: Count of all bookings created across direct and agency channels.
2. **Confirmed Bookings**: Count of bookings in `CONFIRMED` or `TICKETED` status.
3. **Pending Cancellations**: Count of active `CANCELLATION_PENDING` requests requiring urgent attention.
4. **Cancelled Bookings**: Count of finalized cancellations.
5. **Gross Booking Value (GBV)**: Total transaction value processed in USD.
6. **Active Agencies**: Count of approved and verified travel agencies.
7. **Pending Invitations**: Unaccepted agency customer invitations.
8. **Recent Audit Actions**: 24-hour tally of recorded administrative audit log entries.

### 7.2 Cancellation Review Workflow
1. Direct customers or agency agents submit requests via `POST /api/v1/bookings/:id/cancellation-requests`.
2. Platform Administrators retrieve active requests via `GET /api/v1/admin/cancellations`.
3. Administrator reviews reason and submits decision via `POST /api/v1/admin/cancellations/:id/review`:
   - `action: "APPROVE"`: Booking transitions permanently to `CANCELLED`.
   - `action: "REJECT"`: Booking status automatically restores to its pre-request state (e.g. `TICKETED`).
4. Every decision automatically logs an immutable entry to `auditService`.

### 7.3 Payment Reconciliation & Ticketing Queue
- Payments flagged as `UNKNOWN` or `TIMEOUT` appear in `GET /api/v1/payments/unreconciled`.
- Administrators can force reconciliation via `POST /api/v1/payments/:id/reconcile` with `action: "CONFIRM"` or `action: "FAIL"`.
- Bookings confirmed without tickets appear in `GET /api/v1/admin/ticketing-queue`. Manual fulfillment is triggered via `POST /api/v1/admin/ticketing-queue/:id/fulfill`.

---

## 8. Post-MVP Extensibility Guide

The architecture adheres strictly to the **Open-Closed Principle** and Adapter Pattern, ensuring that simulated/mock components can be replaced with production vendors without altering business logic.

### 8.1 Replacing Mock Flight Supplier with Real GDS (Amadeus / Sabre)
1. In `apps/api/src/modules/supplier/adapter.ts`, the interface `FlightSupplierAdapter` is defined:
   ```typescript
   export interface FlightSupplierAdapter {
     readonly supplierCode: string;
     readonly supplierName: string;
     searchFlights(query: FlightSearchQuery): Promise<FlightSearchResult>;
     validatePrice(offerId: string): Promise<FlightOffer | null>;
     reserveOffer(offerId: string, passengers: PassengerDetails[]): Promise<SupplierReservation>;
     issueTickets(pnr: string, eTicketNumbers: string[]): Promise<TicketIssuanceResult>;
   }
   ```
2. Create a new adapter implementing this interface (e.g., `AmadeusFlightSupplier` or `SabreFlightSupplier`).
3. Replace `defaultFlightSupplier` in `supplierService` with the production adapter or configure multi-supplier routing based on airline code.
4. The core booking engine, pricing snapshot system, and passenger checkout will remain completely untouched.

### 8.2 Replacing Payment Simulator with Stripe / Adyen
1. The payment module currently simulates payment processing via `paymentService.processPayment(bookingId, method, simulationResult)`.
2. To integrate Stripe:
   - Create a Stripe Checkout Session or PaymentIntent endpoint.
   - Configure a Cloudflare Workers Stripe webhook handler at `/api/v1/webhooks/stripe`.
   - Upon receiving `checkout.session.completed`, call `bookingService.confirmBooking(bookingId)` and invoke ticket issuance.
   - All state transitions, ticketing rules, and audit logging will behave identically.

### 8.3 Unmissable `[DEMO / MOCK]` Safety Disclaimers
Per PRD requirements, all simulated entities (inventory, flights, PNRs, tickets, and payment receipts) feature unmissable `[DEMO / MOCK]` indicators:
- Flight search results tag every flight with `[DEMO / MOCK]`.
- All issued ticket numbers follow the format `001-DEMO-XXXXXXXXXX`.
- The frontend includes a persistent amber demonstration warning banner across all views.
- When transitioning to live inventory, toggle `NODE_ENV=production` and remove demo prefixes from ticket numbering generator in `apps/api/src/modules/payment/service.ts`.
