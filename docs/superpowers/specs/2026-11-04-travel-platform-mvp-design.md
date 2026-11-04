# System Architecture & Implementation Design: Flight-First Travel Booking Platform (MVP)

**Document Status:** Pending Approval  
**Date:** 2026-11-04  
**Author:** Antigravity / Engineering Team  
**Budget:** $0 Initial Infrastructure Expenditure  
**PRD Reference:** `docs/PRD.md`

---

## 1. Executive Summary & Core Requirements Analysis

The platform is a flight-first travel booking platform supporting two customer acquisition channels:
1. **Direct B2C Customers**: Register, search flights, select fares, provide passenger information, complete simulated payment, and manage their bookings.
2. **B2B Travel Agency-Assisted Customers**: Agency owners invite customers via secure tokens. Upon customer consent, the customer is associated with the agency (strictly one active agency association per customer). Agency owners can search and book on behalf of associated customers.

### Core Architecture Drivers:
- **Zero-Cost ($0) Infrastructure**: Powered by Cloudflare Workers (Backend API), Cloudflare Pages (Frontend SPA), and Supabase Free Tier (PostgreSQL + Auth).
- **Supplier-Agnostic Abstraction**: A standardized `FlightSupplierAdapter` interface decouples business logic from suppliers. The MVP ships with a deterministic mock supplier simulating search, price changes, timeouts, reservation failures, and fulfillment exceptions.
- **Simulated Payment Engine with Idempotent Reconciliation**: Two-phase payment state machine (`PENDING` -> `PROCESSING` -> `SUCCEEDED`/`FAILED`/`UNKNOWN` -> `RECONCILED`) with strict idempotency keys to prevent duplicate charges or reservations.
- **Administrative Control**: Operations dashboard for ticket fulfillment queues (generating mock 13-digit ticket numbers), payment reconciliation, agency inspection, and cancellation review.
- **Absolute Inventory Transparency**: Visible `[DEMO / MOCK]` indicators throughout the UI to avoid misleading users.

---

## 2. Technical Architecture & Alternatives Analysis

### Evaluated Architectural Approaches

| Dimension | Approach A: Unified Full-Stack Node App | Approach B: Monorepo Modular Monolith (Recommended) | Approach C: Next.js on Vercel |
|---|---|---|---|
| **Structure** | Single package with Hono serving both API and bundled Vite SPA | npm workspaces: `apps/web` (Vite), `apps/api` (Hono Workers), `packages/shared`, `packages/db` | Fullstack Next.js App Router |
| **Edge Compatibility** | Runs on standard Node.js VM | Native Cloudflare Workers & Pages deployment ($0) | Vercel Free Tier (Serverless Function limitations) |
| **Type Sharing** | Direct imports within single repo | Shared package `packages/shared` consumed by frontend & backend | Shared via internal paths |
| **Separation of Concerns**| Moderate (client/server dependencies mixed) | High (isolated API and UI lifecycles, clear module boundaries) | Moderate (monolithic build process) |
| **Cold Starts & Cost** | Requires container / persistent server ($$) | Zero cold-starts, 100% free tier on Cloudflare & Supabase ($0) | Free tier function timeouts |

**Decision**: **Approach B (Monorepo Modular Monolith)**.  
It strictly complies with PRD Section 15.2 (React + Vite, Hono + Cloudflare Workers, Supabase PostgreSQL), enforces boundary isolation between business modules, allows shared Zod validation schemas across frontend and backend, and deploys cleanly to free-tier edge hosts.

---

## 3. Modular Monolith Decomposition

The backend (`apps/api`) is structured into decoupled domain modules communicating through typed service interfaces:

```
apps/api/src/modules/
├── identity/          # Supabase auth verification, user profiles, RBAC guards
├── agency/            # Agency registration, invitations, membership lifecycle
├── flight-search/     # Search coordination, cache/fixtures, route validation
├── supplier/          # FlightSupplierAdapter interface, mock supplier implementation
├── pricing/           # Base fare + configurable markup calculation, price snapshotting
├── booking/           # Idempotent reservation engine, PNR generation, lifecycle events
├── payment/           # Simulated gateway, payment attempts, retry & reconciliation
├── ticketing/         # Automatic fulfillment & admin manual ticketing queue
├── cancellation/      # Cancellation request workflow and audit state transitions
├── admin/             # Operational dashboard, audit logs, queue inspection
└── audit/             # Centralized audit logging for privileged and financial actions
```

---

## 4. Project Structure

```
travel-platform/
├── apps/
│   ├── web/                     # Frontend (React 19, Vite, Tailwind CSS, TanStack Query)
│   │   ├── src/
│   │   │   ├── components/      # UI components (SearchForm, FlightCard, BookingSummary, etc.)
│   │   │   ├── pages/           # Customer, Agency, Admin routes
│   │   │   ├── hooks/           # TanStack Query & Auth hooks
│   │   │   ├── lib/             # API client, Supabase browser client
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                     # Backend API (Hono, Cloudflare Workers runtime)
│       ├── src/
│       │   ├── middleware/      # Auth (JWT verification), CORS, Error handling, Idempotency
│       │   ├── modules/         # Modular monolith domains (see Section 3)
│       │   ├── db/              # Drizzle DB client instance
│       │   └── index.ts         # Hono entrypoint routing /api/v1/*
│       ├── wrangler.jsonc       # Cloudflare Workers configuration
│       └── package.json
│
├── packages/
│   ├── shared/                  # Common TypeScript interfaces & Zod schemas
│   │   ├── src/
│   │   │   ├── schemas/         # Search, Booking, Payment, Agency Zod schemas
│   │   │   ├── types/           # Domain models, Enums, API request/response DTOs
│   │   │   └── constants/       # Currency, cabin classes, mock markers
│   │   └── package.json
│   │
│   └── db/                      # Database layer
│       ├── migrations/          # SQL migrations
│       ├── schema/              # Drizzle ORM schema definitions
│       ├── seeds/               # Airports, airlines, mock inventory fixtures
│       ├── drizzle.config.ts
│       └── package.json
│
├── docs/                        # PRD and specs
├── package.json                 # Monorepo root workspaces
├── tsconfig.base.json           # Shared strict TypeScript config
└── vitest.workspace.ts          # Root test orchestration
```

---

## 5. Database Schema & Data Integrity Design

Using PostgreSQL (via Supabase) with Drizzle ORM for type safety. Monetary fields are stored in cents (`numeric(12,2)` or integer cents) to prevent floating-point rounding errors.

### 5.1 Schema Definitions

1. **`users`** (mirrors/extends Supabase `auth.users`):
   - `id`: UUID (PK, references auth.users)
   - `email`: text (unique, not null)
   - `role`: enum (`CUSTOMER`, `AGENCY_OWNER`, `ADMIN`)
   - `status`: enum (`ACTIVE`, `SUSPENDED`)
   - `created_at`, `updated_at`: timestamptz

2. **`customer_profiles`**:
   - `id`: UUID (PK)
   - `user_id`: UUID (FK -> users.id, unique)
   - `first_name`, `last_name`, `phone`: text

3. **`agencies`**:
   - `id`: UUID (PK)
   - `name`: text (not null)
   - `owner_user_id`: UUID (FK -> users.id, not null)
   - `status`: enum (`ACTIVE`, `SUSPENDED`)

4. **`agency_memberships`**:
   - `id`: UUID (PK)
   - `agency_id`: UUID (FK -> agencies.id, not null)
   - `customer_user_id`: UUID (FK -> users.id, not null)
   - `status`: enum (`ACTIVE`, `INACTIVE`)
   - `accepted_at`: timestamptz
   - *Constraint*: Partial unique index on `customer_user_id` WHERE `status = 'ACTIVE'` (guarantees max 1 active agency relationship).

5. **`agency_invitations`**:
   - `id`: UUID (PK)
   - `agency_id`: UUID (FK -> agencies.id)
   - `email`: text (not null)
   - `invitation_token_hash`: text (not null, unique)
   - `status`: enum (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`)
   - `expires_at`: timestamptz (default now() + 7 days)

6. **`airports` & `airlines`**:
   - Standard reference fixtures: `iata_code` (unique, 3 chars), `code` (unique, 2 chars).

7. **`flight_offers` & `flight_segments`**:
   - `supplier_id`, `supplier_offer_reference`, `origin_airport_id`, `destination_airport_id`, `departure_at`, `arrival_at`, `base_fare` (numeric 12,2), `currency` (default 'USD'), `cabin_class`, `inventory_source` ('MOCK').

8. **`bookings`**:
   - `id`: UUID (PK)
   - `booking_reference`: text (unique, format `BK-XXXXXX`)
   - `customer_user_id`: UUID (FK -> users.id, travel owner)
   - `created_by_user_id`: UUID (FK -> users.id, initiator)
   - `agency_id`: UUID (FK -> agencies.id, nullable)
   - `supplier_id`: UUID
   - `inventory_source`: text ('MOCK')
   - `supplier_booking_reference`: text
   - `pnr`: text (6 alphanumeric, nullable until confirmed)
   - `booking_status`: enum (`PENDING`, `CONFIRMED`, `TICKETED`, `CANCELLATION_PENDING`, `CANCELLED`, `FAILED`)
   - `currency`: text
   - `base_fare`, `markup_amount`, `total_amount`: numeric(12,2) (immutable snapshot)
   - `idempotency_key`: text (unique)

9. **`booking_passengers`**:
   - `id`: UUID (PK), `booking_id`: UUID (FK -> bookings.id)
   - `passenger_type`: enum (`ADULT`, `CHILD`, `INFANT`)
   - `first_name`, `last_name`, `date_of_birth`, `passport_number`

10. **`booking_events`**:
    - Audit trail of all booking state transitions with `actor_user_id` and metadata JSONB.

11. **`payments` & `payment_attempts`**:
    - `payment_reference`: unique format `PAY-XXXXXX`
    - `payment_status`: enum (`PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `UNKNOWN`, `RECONCILED`)
    - `idempotency_key`: unique per attempt
    - `failure_reason`, `reconciliation_status`

12. **`tickets`**:
    - `id`: UUID (PK), `booking_id`: UUID (FK), `passenger_id`: UUID (FK)
    - `ticket_number`: text (mock 13-digit format `001-XXXXXXXXXX`)
    - `issuance_method`: enum (`AUTOMATIC_SIMULATED`, `ADMIN_MANUAL`)
    - `issued_by`: UUID (FK -> users.id, nullable for automated)

13. **`cancellation_requests` & `audit_logs`**:
    - Complete review workflow and administrative trace.

---

## 6. API Boundaries (REST Specification)

### Public / Auth
- `POST /api/v1/auth/register` (Customer or Agency Owner registration)
- `GET /api/v1/auth/me` (Authenticated session & profile)

### Customer Portal
- `GET /api/v1/customers/me` & `PATCH /api/v1/customers/me` (Profile details)
- `GET /api/v1/customers/invitations` (View pending agency invitations)
- `POST /api/v1/customers/invitations/:id/accept`
- `POST /api/v1/customers/invitations/:id/reject`

### Agency Portal
- `POST /api/v1/agencies` (Create agency organization)
- `GET /api/v1/agencies/me` (Agency details & metrics)
- `POST /api/v1/agencies/invitations` (Invite customer by email)
- `GET /api/v1/agencies/invitations` (List invitations & statuses)
- `GET /api/v1/agencies/customers` (List associated customers)
- `GET /api/v1/agencies/bookings` (List agency-managed bookings)

### Flight Search & Pricing
- `GET /api/v1/flights/search?origin=JFK&destination=LHR&departureDate=2026-12-01&returnDate=2026-12-10&passengers=1&cabinClass=ECONOMY`
- `GET /api/v1/flights/:offerId` (Offer details with broken-down pricing)

### Booking Lifecycle
- `POST /api/v1/bookings` (Headers: `Idempotency-Key`; body: offerId, customerUserId, passengers)
- `GET /api/v1/bookings` (Customer or Agency filtered list)
- `GET /api/v1/bookings/:bookingId` (Full details, PNR, tickets, events)
- `POST /api/v1/bookings/:bookingId/cancellation-requests` (Submit cancellation reason)

### Payment & Reconciliation
- `POST /api/v1/bookings/:bookingId/payment` (Headers: `Idempotency-Key`; body: paymentMethod, simulationScenario: `SUCCESS` | `DECLINE` | `TIMEOUT`)
- `GET /api/v1/bookings/:bookingId/payments` (Payment attempt history)
- `POST /api/v1/payments/:paymentId/reconcile` (Admin trigger reconciliation)

### Administration Operations
- `GET /api/v1/admin/dashboard` (Operational metrics)
- `GET /api/v1/admin/bookings` (Platform-wide bookings filterable by status)
- `GET /api/v1/admin/payments` (All payment attempts with failure analysis)
- `GET /api/v1/admin/ticketing-queue` (Bookings awaiting ticket issuance)
- `POST /api/v1/admin/bookings/:bookingId/issue-ticket` (Manual ticket issuance)
- `POST /api/v1/admin/cancellations/:id/review` (Approve / Reject cancellation)
- `GET /api/v1/admin/agencies` & `GET /api/v1/admin/users`
- `GET /api/v1/admin/audit-logs`

---

## 7. Supplier & Payment Adapter Interfaces

### Flight Supplier Adapter Interface
```typescript
export interface FlightSupplierAdapter {
  supplierId: string;
  supplierName: string;
  searchFlights(criteria: FlightSearchCriteria): Promise<FlightSearchResult[]>;
  getOfferDetails(offerRef: string): Promise<FlightOfferDetails>;
  validateFare(offerRef: string, passengerCount: number): Promise<FareValidationResult>;
  createReservation(request: CreateReservationRequest): Promise<ReservationResult>;
  getReservationStatus(supplierBookingRef: string): Promise<ReservationStatusResult>;
  issueTicket(supplierBookingRef: string): Promise<TicketIssuanceResult>;
  cancelReservation(supplierBookingRef: string): Promise<SupplierCancellationResult>;
}
```

### Deterministic Mock Supplier Scenarios
- **Standard Success**: Returns realistic round-trip / one-way itineraries across 8 major international hubs.
- **Price Shift Scenario**: Triggers a simulated fare change to test frontend price-revalidation warnings.
- **Reservation Timeout**: Returns `UNKNOWN`/timeout to test pending state and recovery.
- **Ticketing Exception**: Emits fulfillment failure to push booking into administrative ticketing queue.

---

## 8. Potential Technical Risks and Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Race conditions on concurrent booking/payment requests** | Duplicate reservations or double charges | Enforce client-generated UUID `Idempotency-Key` stored in PostgreSQL with unique index; wrap booking creation and payment attempt in DB transactions. |
| **Data leakage across agencies** | Violation of privacy & tenancy boundaries | Service-level tenancy checks verifying agency membership before returning customer bookings; strict RBAC middleware. |
| **Floating-point currency errors** | Inconsistent ledger balances | Store all fares and markups as `numeric(12, 2)` or integer cents. Calculations done using exact decimal math. |
| **Supabase free-tier connection limits on edge** | Cloudflare Workers exhausting DB connections | Use Supabase Connection Pooler (PgBouncer/Supavisor over port 6543/transaction mode) and lightweight Drizzle query client. |
| **Mock vs. Real Inventory Confusion** | Stakeholders believing live bookings occurred | Unmissable `[DEMO / MOCK]` badge on search cards, checkout pages, admin screens, and ticket PDFs/views; 13-digit ticket numbers prefixed with `001-DEMO-`. |

---

## 9. Development Milestones & Phasing

- **Milestone 1: Project Scaffolding & Shared Core (Target: Foundation)**
  - Setup npm workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`, `packages/db`).
  - Configure TypeScript base configs, Tailwind CSS, Vite, Hono, and Drizzle ORM.
  - Setup Supabase migration scripts, airport/airline reference fixtures, and Vitest test runner.

- **Milestone 2: Identity, RBAC & Agency Domain**
  - Supabase Auth integration, user roles (`CUSTOMER`, `AGENCY_OWNER`, `ADMIN`).
  - Agency creation, invitation token generation/hashing, acceptance flow.
  - Enforce strictly one active agency per customer.

- **Milestone 3: Flight Search & Deterministic Mock Supplier**
  - Implement `FlightSupplierAdapter` interface and `MockFlightSupplier`.
  - One-way and round-trip search endpoints with airport code lookups.
  - Search UI with filters, itinerary cards, demo tags, and fare breakdowns.

- **Milestone 4: Booking Engine & Pricing Snapshot**
  - Passenger information validation with Zod.
  - Price snapshot calculation (`base_fare` + `markup_amount` = `total_amount`).
  - Idempotent booking creation, pending states, and mock PNR allocation.

- **Milestone 5: Payment Processing, Reconciliation & Ticketing**
  - Simulated payment provider with configurable test scenarios (`SUCCESS`, `DECLINE`, `TIMEOUT`).
  - Safe retry logic and administrative payment reconciliation.
  - Automatic ticket issuance vs. ticketing exception routing to admin queue.

- **Milestone 6: Administrative Operations & Cancellation Workflow**
  - Admin dashboard metrics and booking lifecycle inspector.
  - Ticketing operations queue for manual mock ticket generation.
  - Customer/agency cancellation requests and admin review.
  - Audit logging of all administrative actions.

- **Milestone 7: Verification, End-to-End Testing & Deployment Guide**
  - Comprehensive unit and integration test suite across all 5 PRD scenarios.
  - Deployment configuration for Cloudflare Workers and Cloudflare Pages.

