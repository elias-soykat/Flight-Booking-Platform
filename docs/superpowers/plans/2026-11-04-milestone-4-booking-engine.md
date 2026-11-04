# Milestone 4: Booking Engine & Pricing Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the centralized booking engine, idempotent booking creation, immutable price snapshots, mock PNR generation, direct B2C and agency-assisted booking ownership separation, and booking management views.

**Architecture:** Extend Hono API with `booking` domain module in `apps/api/src/modules/booking`; enforce client-generated UUID `Idempotency-Key` headers; integrate `MockFlightSupplier.createReservation` for PNR generation; record lifecycle events in `bookingEvents`; build passenger information checkout and booking management views in `apps/web`.

**Tech Stack:** TypeScript, Hono, Drizzle ORM schema, Zod, React 19, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

## Global Constraints

- Every booking creation request must require an `Idempotency-Key` header; repeated requests with the same key must return the existing booking without creating duplicate reservations.
- Every booking must store an immutable price snapshot (`baseFare`, `markupAmount`, `totalAmount`, `currency`). Future markup configuration changes must never alter existing booking snapshots.
- Agency-created bookings must record the customer as travel beneficiary/owner and the agency owner as creator; agencies must never access bookings of unrelated customers.
- When an agency owner books on behalf of a customer, the customer must be an actively associated member of that agency.
- Unique human-readable booking reference (e.g. `BK-XXXXXX`) and 6-character alphanumeric mock PNR (e.g. `7X9K2P`) must be generated upon confirmation.

## Review Focus

- Duplicate booking request with identical `Idempotency-Key` must return the existing booking with HTTP 200/201 without creating a new record.
- Agency owner attempting to book for an unassociated customer must receive `403 Forbidden` (`CUSTOMER_NOT_ASSOCIATED`).
- Booking requests missing passenger details or having empty names must be rejected by Zod validation with 400 Bad Request.
- Customer requesting `/api/v1/bookings` must only receive their own bookings; agency owner receives bookings created through their agency; admin receives all.
- Unauthenticated requests to booking endpoints must be rejected with 401 Unauthorized.

---

### Task 1: Booking Engine Domain Service & Idempotency Store

**Files:**
- Create: `apps/api/src/modules/booking/service.ts`
- Test: `apps/api/tests/booking-engine.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`, `MockFlightSupplier`, `agencyService`
- Produces:
  - `bookingService.createBooking(...)`
  - `bookingService.getBookingById(...)`
  - `bookingService.listBookings(...)`

- [x] **Step 1: Write failing test for booking service**
  - Test direct customer creates a booking: receives `bookingReference` (`BK-XXXXXX`), mock PNR, and immutable price snapshot.
  - Test repeated creation with same `idempotencyKey` returns existing booking.
  - Test agency owner books for associated customer: customer is owner, agency owner is creator.
  - Test agency owner cannot book for unassociated customer (throws error).

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/booking-engine.test.ts`
  - Expected: FAIL

- [x] **Step 3: Implement bookingService with idempotency and tenancy checks**
  - Implement price snapshot persistence, PNR generation, and audit event recording.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/booking-engine.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(booking): implement booking engine service, idempotency, and price snapshots"
  ```

---

### Task 2: Booking REST API Endpoints

**Files:**
- Create: `apps/api/src/routes/bookings.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/bookings-api.test.ts`

**Interfaces:**
- Consumes: `bookingService`, `CreateBookingSchema`
- Produces:
  - `POST /api/v1/bookings`
  - `GET /api/v1/bookings`
  - `GET /api/v1/bookings/:bookingId`

- [x] **Step 1: Write failing test for booking API routes**
  - Test `POST /api/v1/bookings` without `Idempotency-Key` returns 400.
  - Test `POST /api/v1/bookings` creates booking.
  - Test `GET /api/v1/bookings` returns authorized bookings.
  - Test `GET /api/v1/bookings/:bookingId` returns booking details with passengers and events.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/bookings-api.test.ts`
  - Expected: FAIL

- [x] **Step 3: Implement booking routes and mount in v1Router**
  - Enforce `Idempotency-Key` validation and RBAC in `apps/api/src/routes/bookings.ts`.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/bookings-api.test.ts`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement booking creation, listing, and detail endpoints"
  ```

---

### Task 3: Frontend Passenger Checkout Form Component

**Files:**
- Create: `apps/web/src/components/PassengerForm.tsx`
- Test: `apps/web/tests/PassengerForm.test.tsx`

**Interfaces:**
- Consumes: `FlightOffer`, `PassengerInput`
- Produces: `PassengerForm` modal/form capturing passenger details, agency customer selection, and price breakdown

- [x] **Step 1: Write failing test for PassengerForm**
  - Test form renders inputs for each passenger (First Name, Last Name, DOB, Passenger Type).
  - Test displays agency customer dropdown when user is Agency Owner.
  - Test submits valid passenger details and triggers onComplete.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/PassengerForm.test.tsx --environment jsdom`
  - Expected: FAIL

- [x] **Step 3: Implement PassengerForm component**
  - Implement form with validation, price snapshot display, and agency customer selection.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/PassengerForm.test.tsx --environment jsdom`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement passenger information form with agency customer selector"
  ```

---

### Task 4: Frontend Booking Confirmation & Bookings List

**Files:**
- Create: `apps/web/src/components/BookingConfirmation.tsx`
- Create: `apps/web/src/components/BookingsList.tsx`
- Modify: `apps/web/src/components/Navbar.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/BookingsView.test.tsx`

**Interfaces:**
- Consumes: `BookingConfirmation`, `BookingsList`
- Produces: Booking confirmation view with PNR, booking reference, and historical bookings management view

- [x] **Step 1: Write failing test for BookingConfirmation and BookingsList**
  - Test confirmation card renders booking reference (`BK-XXXXXX`) and mock PNR.
  - Test BookingsList displays bookings with status badges and flight details.

- [x] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/BookingsView.test.tsx --environment jsdom`
  - Expected: FAIL

- [x] **Step 3: Implement BookingConfirmation, BookingsList, and integrate into App.tsx**
  - Add "My Bookings" tab and connect booking flow.

- [x] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/BookingsView.test.tsx --environment jsdom`
  - Expected: PASS

- [x] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement booking confirmation, PNR display, and bookings list view"
  ```

---

### Task 5: Full Milestone 4 Verification

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
  git commit -m "chore: complete and verify Milestone 4 implementation"
  ```

