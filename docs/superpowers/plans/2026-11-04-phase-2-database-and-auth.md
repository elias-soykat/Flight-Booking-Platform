# Commercial MVP Phase 2: Database Persistence & Production Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish persistent PostgreSQL database operations via Drizzle ORM and production-grade Supabase JWT authentication, eliminating in-memory data loss and enabling real user registrations, logins, and session management.

**Architecture:** Introduce a clean repository pattern decoupling domain services from underlying storage. In production, domain services execute parameterized SQL queries and ACID transactions against PostgreSQL via Drizzle ORM with connection pooling; an in-memory repository adapter is retained for unit testing and offline development. Implement a complete authentication subsystem supporting email/password registration, login, token refresh, and cryptographic JWT verification, with a React AuthContext and authentication modal on the frontend.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL (`postgres-js`), Hono v4, Web Crypto API (`crypto.subtle`), React 19, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-commercial-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-commercial-mvp-design.md)

## Global Constraints

- Preserve all existing 121 automated tests across all 30 test files.
- $0 development cost: use Supabase Free Tier connection pooler and local Web Crypto API.
- Never hardcode credentials, secrets, or JWT private keys.
- Enforce strict role-based access control: `CUSTOMER`, `AGENCY_OWNER`, `ADMIN`.
- Maintain strict single-active-agency association rule per customer.
- In `NODE_ENV === 'production'`, reject `x-demo-user-id` headers and mandate cryptographically verified Bearer tokens.

## Review Focus

1. **Cold-start data persistence:** Bookings, payments, agency associations, and cancellations must survive Worker restarts and process recycles without state loss.
2. **Concurrent booking race conditions:** Unique constraints on `booking_reference` and `idempotency_key` must prevent duplicate reservations during simultaneous checkouts.
3. **Tampered JWT rejection:** Forged Bearer tokens or tokens signed with invalid HMAC secrets must be rejected with 401 Unauthorized.
4. **Duplicate registration prevention:** Attempting to register an already registered email must return 409 Conflict with a clear error payload.
5. **Multi-tenant data isolation:** Customers cannot access bookings belonging to another customer or unassociated agency.

---

### Task 1: Drizzle Repository Layer & Database Schema Extensions

**Files:**
- Modify: `packages/db/src/schema/bookings.ts` (add supplier order details & currency support)
- Modify: `packages/db/src/schema/payments.ts` (add gateway provider enum, transaction IDs, BDT currency)
- Modify: `packages/db/src/schema/tickets.ts` (add SUPPLIER_ISSUED issuance method)
- Create: `apps/api/src/repositories/types.ts`
- Create: `apps/api/src/repositories/drizzle-repository.ts`
- Create: `apps/api/src/repositories/memory-repository.ts`
- Create: `apps/api/src/repositories/index.ts`
- Test: `apps/api/tests/repositories.test.ts`

- [ ] **Step 1: Write repository contract and unit test suite**
  - Define `apps/api/src/repositories/types.ts` specifying repository interfaces for Users, Agencies, Bookings, Payments, Tickets, Cancellations, and Audit Logs.
  - Create `apps/api/tests/repositories.test.ts` testing CRUD, transactional booking with passengers, and idempotency key retention.

- [ ] **Step 2: Run test to verify it fails (Red phase)**
  - Run: `npx vitest run apps/api/tests/repositories.test.ts`
  - Expected: FAIL (files not yet created).

- [ ] **Step 3: Update Drizzle schemas and implement memory & Drizzle repositories**
  - Update `packages/db/src/schema/` with commercial fields (`inventory_source`, `supplier_order_id`, `gateway_provider`, `SUPPLIER_ISSUED`).
  - Implement `apps/api/src/repositories/memory-repository.ts` conforming to repository interfaces.
  - Implement `apps/api/src/repositories/drizzle-repository.ts` leveraging Drizzle client and transactions.
  - Implement `apps/api/src/repositories/index.ts` providing factory `getRepository(env)` that returns Drizzle repository when `DATABASE_URL` exists, or memory repository as fallback.

- [ ] **Step 4: Run repository tests to verify (Green phase)**
  - Run: `npx vitest run apps/api/tests/repositories.test.ts`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/db/src/schema/ apps/api/src/repositories/ apps/api/tests/repositories.test.ts
  git commit -m "feat(db): implement database repository layer and schema extensions"
  ```

---

### Task 2: Wire Domain Services to Persistent Repository Layer

**Files:**
- Modify: `apps/api/src/modules/identity/service.ts`
- Modify: `apps/api/src/modules/agency/service.ts`
- Modify: `apps/api/src/modules/booking/service.ts`
- Modify: `apps/api/src/modules/payment/service.ts`
- Modify: `apps/api/src/modules/cancellation/service.ts`
- Modify: `apps/api/src/modules/audit/service.ts`
- Test: Existing test suites (`apps/api/tests/agencies.test.ts`, `apps/api/tests/bookings-api.test.ts`, `apps/api/tests/payments-api.test.ts`, `apps/api/tests/cancellations-api.test.ts`)

- [ ] **Step 1: Refactor identityService and agencyService to use repository**
  - Replace direct `Map` operations in `identityService` and `agencyService` with calls to `getRepository()`.
  - Maintain all existing methods and signature compatibility.

- [ ] **Step 2: Refactor bookingService, paymentService, cancellationService, and auditService**
  - Replace in-memory stores in `bookingService`, `paymentService`, `cancellationService`, and `auditService` with repository calls.
  - Preserve all business rules, pricing snapshots, idempotency logic, and audit trail hooks.

- [ ] **Step 3: Run full API test suite to verify regression-free migration**
  - Run: `npx vitest run apps/api/tests/agencies.test.ts apps/api/tests/bookings-api.test.ts apps/api/tests/payments-api.test.ts apps/api/tests/cancellations-api.test.ts`
  - Expected: PASS across all existing domain tests.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/api/src/modules/
  git commit -m "refactor(services): wire domain services to persistent repository layer"
  ```

---

### Task 3: Production Authentication Engine & Cryptographic JWT Verification

**Files:**
- Create: `apps/api/src/modules/auth/service.ts`
- Create: `apps/api/src/routes/auth.ts` (expand with register, login, refresh, logout)
- Modify: `apps/api/src/middleware/auth.ts` (add cryptographic HMAC-SHA256 signature verification & production demo header protection)
- Test: `apps/api/tests/auth-production.test.ts`

- [ ] **Step 1: Write production authentication test suite**
  - Create `apps/api/tests/auth-production.test.ts`:
    - Tests user registration (`POST /api/v1/auth/register`) for Customer and Agency Owner.
    - Tests duplicate email registration rejection (409 Conflict).
    - Tests password login (`POST /api/v1/auth/login`) returning valid JWT and user info.
    - Tests invalid password rejection (401 Unauthorized).
    - Tests token verification via `GET /api/v1/auth/me`.
    - Tests token expiration and tampered signature rejection.
    - Tests demo header rejection in production mode (`NODE_ENV === 'production'`).

- [ ] **Step 2: Run test to verify it fails (Red phase)**
  - Run: `npx vitest run apps/api/tests/auth-production.test.ts`
  - Expected: FAIL.

- [ ] **Step 3: Implement authService, expanded authRouter, and secure authMiddleware**
  - Create `apps/api/src/modules/auth/service.ts`:
    - Password hashing using Web Crypto PBKDF2 / SHA-256 with random salt.
    - JWT signing and verification using Web Crypto HMAC-SHA256 (`crypto.subtle.sign`, `crypto.subtle.verify`).
    - User registration and login validation.
  - Expand `apps/api/src/routes/auth.ts` with `/register`, `/login`, `/refresh`, `/logout`, `/me`.
  - Update `apps/api/src/middleware/auth.ts`:
    - In `NODE_ENV === 'production'`, disallow `x-demo-user-id` and mandate valid signed JWT Bearer tokens.
    - In dev/test, maintain demo header support for backward test compatibility.

- [ ] **Step 4: Run auth tests to verify (Green phase)**
  - Run: `npx vitest run apps/api/tests/auth-production.test.ts`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/modules/auth/ apps/api/src/routes/auth.ts apps/api/src/middleware/auth.ts apps/api/tests/auth-production.test.ts
  git commit -m "feat(auth): implement production authentication engine and JWT verification"
  ```

---

### Task 4: Frontend Authentication Context & Modal UI

**Files:**
- Create: `apps/web/src/context/AuthContext.tsx`
- Create: `apps/web/src/components/AuthModal.tsx`
- Modify: `apps/web/src/components/Navbar.tsx`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/AuthIntegration.test.tsx`

- [ ] **Step 1: Write frontend auth integration test**
  - Create `apps/web/tests/AuthIntegration.test.tsx`:
    - Tests rendering Sign In / Sign Up triggers in Navbar when unauthenticated.
    - Tests opening AuthModal and submitting registration.
    - Tests logging in and updating Navbar to show user name, role pill, and Logout action.
    - Tests logging out clears session and restores Sign In button.

- [ ] **Step 2: Run test to verify it fails (Red phase)**
  - Run: `npx vitest run apps/web/tests/AuthIntegration.test.tsx`
  - Expected: FAIL.

- [ ] **Step 3: Implement AuthContext, AuthModal, and integrate into Navbar and API client**
  - Create `apps/web/src/context/AuthContext.tsx` managing `user`, `token`, `login()`, `register()`, `logout()`, and localStorage persistence.
  - Create `apps/web/src/components/AuthModal.tsx` with clean tabs for "Sign In" and "Create Account" (selecting Customer or Agency Owner).
  - Update `apps/web/src/lib/api-client.ts` to automatically inject `Authorization: Bearer <token>` into fetch headers.
  - Update `apps/web/src/components/Navbar.tsx` to display real authenticated user state and Sign In / Sign Out actions.
  - Wrap `App.tsx` in `AuthProvider`.

- [ ] **Step 4: Run test to verify (Green phase)**
  - Run: `npx vitest run apps/web/tests/AuthIntegration.test.tsx`
  - Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web/src/context/ apps/web/src/components/AuthModal.tsx apps/web/src/components/Navbar.tsx apps/web/src/lib/api-client.ts apps/web/src/App.tsx apps/web/tests/AuthIntegration.test.tsx
  git commit -m "feat(web): add authentication context, login/register modal, and session management"
  ```

---

### Task 5: Full Phase 2 Verification & Build Pass

**Files:**
- Monorepo wide

- [ ] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites (32+ suites, 130+ tests) pass cleanly.

- [ ] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 build errors across `@travel-platform/db`, `@travel-platform/shared`, `@travel-platform/api`, and `@travel-platform/web`.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Phase 2 database persistence and authentication"
  ```
