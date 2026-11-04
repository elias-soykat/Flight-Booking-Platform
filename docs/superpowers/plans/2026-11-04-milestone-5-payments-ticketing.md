# Milestone 5: Payment Processing, Reconciliation & Simulated Ticketing Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement simulated payment processing with configurable test scenarios (`SUCCESS`, `DECLINE`, `TIMEOUT`, `INSUFFICIENT_FUNDS`), idempotent payment attempts, automatic mock 13-digit ticket generation (`001-DEMO-XXXXXXXXXX`), administrative payment reconciliation, and manual ticket fulfillment queues.

**Architecture:** Extend Hono API with `payment` domain module in `apps/api/src/modules/payment/service.ts`; mount `/api/v1/payments` and admin fulfillment routes; generate immutable 13-digit mock tickets linked to passengers; build interactive payment modal with scenario selector, e-ticket view, and admin reconciliation UI in `apps/web`.

**Tech Stack:** TypeScript, Hono, Drizzle ORM schema, Zod, React 19, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

---

## Global Constraints

- **Financial Safety:** Purely simulated payments; no live banking/payment gateway calls. No real credit card information collected.
- **Strict Idempotency:** Every payment attempt requires a client-generated UUID `Idempotency-Key` header; duplicate payment submissions with the same key must return the existing payment attempt without double-charging or re-processing.
- **Price Consistency:** Charged payment amount must match the booking's immutable `totalAmount`.
- **Ticket Format:** 13-digit mock ticket numbers prefixed with `001-DEMO-` (e.g. `001-DEMO-5938201948`) accompanied by an unmissable `[DEMO / MOCK - NOT A VALID AIRLINE TICKET]` disclaimer.
- **Reconciliation & Auditing:** `TIMEOUT` transactions transition to `UNKNOWN` payment status. Only an administrator can reconcile them (`RECONCILED` with `FORCE_SUCCESS` or `FORCE_FAIL`), and every reconciliation action is logged.

---

### Task 1: Shared Payment & Ticketing Types & Schemas

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/src/schemas/payment.schema.ts`
- Test: `packages/shared/tests/payment-schemas.test.ts`

- [x] **Step 1: Write failing test for payment schemas & types**
  - Verify validation of `ProcessPaymentSchema` with scenarios.
  - Verify validation of `ReconcilePaymentSchema`.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run packages/shared/tests/payment-schemas.test.ts`
  - Expected: FAIL

- [x] **Step 3: Update schemas and types**
  - Export `PaymentAttemptEntity`, `TicketEntity`, `ProcessPaymentSchema`, `ReconcilePaymentSchema`.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run packages/shared/tests/payment-schemas.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add packages/shared
  git commit -m "feat(shared): add payment attempt, ticket entities, and payment validation schemas"
  ```

---

### Task 2: Payment Simulation & Ticketing Domain Service (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/payment/service.ts`
- Test: `apps/api/tests/payment-engine.test.ts`

**Interfaces:**
- Consumes: `bookingService`, `defaultFlightSupplier`, `@travel-platform/shared`
- Produces:
  - `paymentService.processPayment(...)`
  - `paymentService.reconcilePayment(...)`
  - `paymentService.issueTicketsManually(...)`
  - `paymentService.getPaymentsForBooking(...)`
  - `paymentService.getAdminTicketingQueue(...)`

- [x] **Step 1: Write failing test for payment domain service**
  - Test successful payment issues 13-digit mock tickets (`001-DEMO-XXXXXXXXXX`) and transitions booking to `TICKETED`.
  - Test duplicate payment request with identical idempotency key returns cached attempt without re-executing.
  - Test payment failure scenarios (`DECLINE`, `INSUFFICIENT_FUNDS`) transitions attempt to `FAILED` and preserves booking in unpaid state.
  - Test payment timeout scenario transitions attempt to `UNKNOWN`.
  - Test administrator reconciles `UNKNOWN` payment to `SUCCEEDED` and issues tickets.
  - Test administrator manually fulfills tickets for a booking in the ticketing queue.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/payment-engine.test.ts`
  - Expected: FAIL

- [x] **Step 3: Implement paymentService with state machine and mock ticket issuance**
  - Implement simulation handlers, ticket generation, and audit logging.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/payment-engine.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(payment): implement simulated payment engine, idempotency, and ticketing service"
  ```

---

### Task 3: Payment & Reconciliation REST API Endpoints (`apps/api`)

**Files:**
- Create: `apps/api/src/routes/payments.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/payments-api.test.ts`

**Interfaces:**
- Consumes: `paymentService`, `ProcessPaymentSchema`, `ReconcilePaymentSchema`
- Produces:
  - `POST /api/v1/bookings/:bookingId/payment`
  - `GET /api/v1/bookings/:bookingId/payments`
  - `POST /api/v1/payments/:paymentId/reconcile`
  - `GET /api/v1/admin/ticketing-queue`
  - `POST /api/v1/admin/bookings/:bookingId/issue-tickets`

- [x] **Step 1: Write failing test for payment API routes**
  - Test `POST /api/v1/bookings/:bookingId/payment` without `Idempotency-Key` returns 400.
  - Test `POST /api/v1/bookings/:bookingId/payment` processes payment and returns 201 with tickets.
  - Test non-admin user attempting to reconcile payment receives 403.
  - Test admin reconciles `UNKNOWN` payment with 200.
  - Test admin accesses ticketing queue and issues tickets.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/payments-api.test.ts`
  - Expected: FAIL

- [x] **Step 3: Implement payment and admin ticketing routes**
  - Mount `/payments` in `v1Router` and enforce RBAC and idempotency.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/payments-api.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement payment processing, reconciliation, and ticketing endpoints"
  ```

---

### Task 4: Frontend Payment Simulation & Ticket Display Components (`apps/web`)

**Files:**
- Create: `apps/web/src/components/PaymentModal.tsx`
- Create: `apps/web/src/components/TicketView.tsx`
- Test: `apps/web/tests/PaymentAndTickets.test.tsx`

**Interfaces:**
- Consumes: `BookingEntity`, `PaymentAttemptEntity`, `TicketEntity`, `SimulationScenario`
- Produces:
  - `PaymentModal` with scenario selector (`SUCCESS`, `DECLINE`, `TIMEOUT`), price snapshot summary, and safe retry.
  - `TicketView` displaying 13-digit ticket numbers (`001-DEMO-XXXXXXXXXX`), passenger names, PNR, and DEMO banner.

- [x] **Step 1: Write failing test for PaymentModal and TicketView**
  - Test PaymentModal renders scenario selector and triggers payment with chosen scenario.
  - Test TicketView renders 13-digit ticket numbers and prominent DEMO badge.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/PaymentAndTickets.test.tsx --environment jsdom`
  - Expected: FAIL

- [x] **Step 3: Implement PaymentModal and TicketView components**
  - Build responsive UI with Tailwind CSS and Lucide icons.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/PaymentAndTickets.test.tsx --environment jsdom`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement payment simulation modal and mock ticket display view"
  ```

---

### Task 5: Frontend Admin Ticketing Queue & Payment Reconciliation Integration (`apps/web`)

**Files:**
- Modify: `apps/web/src/components/BookingConfirmation.tsx`
- Modify: `apps/web/src/components/BookingsList.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/AdminFulfillment.test.tsx`

- [x] **Step 1: Write failing test for Admin fulfillment & booking integration**
  - Test payment button appears on confirmed booking and triggers payment modal.
  - Test admin dashboard renders ticketing queue and payment reconciliation panel.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/AdminFulfillment.test.tsx --environment jsdom`
  - Expected: FAIL

- [x] **Step 3: Integrate payment flow and admin operations in App.tsx**
  - Wire payment processing, ticketing display, and admin queue actions into App.tsx.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/AdminFulfillment.test.tsx --environment jsdom`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): integrate payment checkout flow, ticket issuance, and admin fulfillment"
  ```

---

### Task 6: Full Milestone 5 Verification

**Files:**
- Verification: Full monorepo test suite and build

- [x] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites pass cleanly.

- [x] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 build errors.

- [x] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Milestone 5 implementation"
  ```

