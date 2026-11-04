# Milestone 3: Flight Search & Deterministic Mock Supplier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the supplier-agnostic `FlightSupplierAdapter` interface, a deterministic mock supplier with predictable multi-airline inventory, search and offer detail REST endpoints, and an interactive flight search & results UI with persistent `[DEMO / MOCK]` indicators.

**Architecture:** Define supplier interface in `packages/shared`; implement `MockFlightSupplier` in `apps/api/src/modules/supplier`; mount flight endpoints on `/api/v1/flights`; build responsive search form and flight result cards in `apps/web`.

**Tech Stack:** TypeScript, Hono, Zod, React 19, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

## Global Constraints

- Flight inventory must be strictly deterministic: repeated searches with identical parameters return identical flight offers.
- Every mock flight offer, segment, card, and detail view must visibly display `[DEMO / MOCK]`.
- Supplier integrations must remain swappable via `FlightSupplierAdapter` with no hardcoded vendor coupling in business logic.
- Fare calculation must maintain `totalAmount = baseFare + markupAmount` with decimal precision.
- Meaningful empty results must be returned for unsupported routes without crashing.

## Review Focus

- Searches with identical origin and destination must be rejected with 400 Bad Request by backend validation.
- Round-trip searches where return date is earlier than departure date must be rejected.
- Deterministic mock supplier must generate direct flights for major hub pairs (e.g. JFK <-> LHR) and 1-stop connecting flights for cross-hub journeys.
- Price validation must detect simulated price adjustments when triggered.
- All monetary values must format correctly as currency.

---

### Task 1: Flight Supplier Adapter Interface & Mock Supplier Engine

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Create: `apps/api/src/modules/supplier/adapter.ts`
- Create: `apps/api/src/modules/supplier/mock-supplier.ts`
- Test: `apps/api/tests/mock-supplier.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`
- Produces:
  - `FlightSupplierAdapter` interface
  - `MockFlightSupplier` implementation with deterministic search and offer retrieval

- [ ] **Step 1: Write failing test for MockFlightSupplier**
  - In `apps/api/tests/mock-supplier.test.ts`, test search for JFK to LHR returns consistent offers.
  - Test unsupported route returns empty array.
  - Test `getOfferDetails` retrieves offer by reference.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/mock-supplier.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement FlightSupplierAdapter interface and MockFlightSupplier**
  - Create adapter interface in `apps/api/src/modules/supplier/adapter.ts`.
  - Implement deterministic flight generator generating offers with flight numbers, airlines, schedules, and pricing in `mock-supplier.ts`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/mock-supplier.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add packages/shared apps/api
  git commit -m "feat(supplier): implement FlightSupplierAdapter and deterministic MockFlightSupplier"
  ```

---

### Task 2: Flight Search & Offer Details Backend Routes

**Files:**
- Create: `apps/api/src/routes/flights.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/flights.test.ts`

**Interfaces:**
- Consumes: `MockFlightSupplier`, `FlightSearchQuerySchema`
- Produces:
  - `GET /api/v1/flights/airports`
  - `GET /api/v1/flights/search`
  - `GET /api/v1/flights/:offerId`

- [ ] **Step 1: Write failing test for flight routes**
  - Test `/api/v1/flights/airports` returns airport fixtures.
  - Test `/api/v1/flights/search` validates query parameters and returns offers.
  - Test `/api/v1/flights/:offerId` returns offer details or 404.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/flights.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement flight routes and mount in v1Router**
  - Mount `/flights` routes in `apps/api/src/routes/v1.ts`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/flights.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement flight search, airport lookup, and offer details endpoints"
  ```

---

### Task 3: Frontend Search Form Component

**Files:**
- Create: `apps/web/src/components/FlightSearchForm.tsx`
- Test: `apps/web/tests/FlightSearchForm.test.tsx`

**Interfaces:**
- Consumes: `AIRPORT_FIXTURES`, `FlightSearchQuery`
- Produces: `FlightSearchForm` component with trip type toggle, airport selectors, date pickers, passenger count, and cabin class

- [ ] **Step 1: Write failing test for FlightSearchForm**
  - Test form renders inputs and validates origin != destination before submitting.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/FlightSearchForm.test.tsx --environment jsdom`
  - Expected: FAIL

- [ ] **Step 3: Implement FlightSearchForm component**
  - Implement form with responsive Tailwind styling and airport select options.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/FlightSearchForm.test.tsx --environment jsdom`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement responsive flight search form with validation"
  ```

---

### Task 4: Frontend Flight Results & Itinerary Card

**Files:**
- Create: `apps/web/src/components/FlightCard.tsx`
- Create: `apps/web/src/components/FlightResults.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/FlightResults.test.tsx`

**Interfaces:**
- Consumes: `FlightOffer`, `FlightCard`
- Produces: Flight search results page with filter summary, mock badges, segment timelines, and Select Flight action

- [ ] **Step 1: Write failing test for FlightCard and FlightResults**
  - Test card displays airline, times, duration, price, and `[DEMO / MOCK]` badge.
  - Test clicking "Select Flight" triggers onSelect callback.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/FlightResults.test.tsx --environment jsdom`
  - Expected: FAIL

- [ ] **Step 3: Implement FlightCard, FlightResults, and integrate into App.tsx**
  - Render search results with realistic itinerary details.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/FlightResults.test.tsx --environment jsdom`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement flight cards, results list, and demo indicators"
  ```

---

### Task 5: Full Milestone 3 Verification

**Files:**
- Verification: Monorepo test suites and build

- [ ] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites pass.

- [ ] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 build errors.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Milestone 3 implementation"
  ```
