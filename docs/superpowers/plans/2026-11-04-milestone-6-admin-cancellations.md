# Milestone 6: Administrative Operations, Metrics Dashboard & Cancellation Requests Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the cancellation request workflow (customer/agency submission with reason, administrative approval/rejection with simulated supplier cancellation), operational dashboard metrics derived from actual application records, and a persistent administrative audit logging trail.

**Architecture:** Extend Hono API with `cancellation` and `audit` domain modules; implement RBAC enforcement and state reversion on rejection; calculate real-time platform metrics in `GET /api/v1/admin/dashboard`; build cancellation request modal and admin review queue with audit inspector in `apps/web`.

**Tech Stack:** TypeScript, Hono, Drizzle ORM schema, Zod, React 19, Tailwind CSS, Lucide icons, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

---

## Global Constraints

- **Scope:** Simulated cancellation requests only. No automated banking refunds or live airline GDS cancel messages.
- **Tenancy & Access Control:** Customers may only request cancellation for their own bookings; Agency owners may only request cancellation for their agency-associated bookings; Administrators can review all cancellation requests.
- **State Integrity:** Submitting a cancellation transitions a booking from `CONFIRMED` or `TICKETED` to `CANCELLATION_PENDING` while recording the `previousStatus`. Rejection cleanly restores the booking to its `previousStatus`. Approval transitions the booking to `CANCELLED`.
- **Derived Metrics:** All dashboard metrics in `GET /api/v1/admin/dashboard` must be derived directly from actual in-memory/DB records (no hardcoded counts).
- **Audit Trace:** Every cancellation request, review decision, manual ticket fulfillment, and payment reconciliation must record a structured audit log entry.

---

### Task 1: Cancellation & Audit Shared Types, Schemas, and Audit Service

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/schemas/cancellation.schema.ts`
- Create: `apps/api/src/modules/audit/service.ts`
- Test: `apps/api/tests/audit-service.test.ts`

- [ ] **Step 1: Write failing test for audit service and cancellation schemas**
  - Test recording and querying audit logs.
  - Test validation of cancellation request and review schemas.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/audit-service.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement shared types, schemas, and auditService**
  - Implement audit logging and retrieval with filtering.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/audit-service.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add packages/shared apps/api
  git commit -m "feat(audit): implement shared cancellation schemas and audit logging service"
  ```

---

### Task 2: Cancellation Management Domain Service (`apps/api`)

**Files:**
- Create: `apps/api/src/modules/cancellation/service.ts`
- Test: `apps/api/tests/cancellation-engine.test.ts`

**Interfaces:**
- Consumes: `bookingService`, `auditService`, `defaultFlightSupplier`
- Produces:
  - `cancellationService.requestCancellation(...)`
  - `cancellationService.reviewCancellation(...)`
  - `cancellationService.getPendingCancellations(...)`
  - `cancellationService.getDashboardMetrics(...)`

- [ ] **Step 1: Write failing test for cancellation domain service**
  - Test customer requests cancellation: transitions booking to `CANCELLATION_PENDING` and preserves previous status.
  - Test unauthorized customer cannot cancel another user's booking (throws 403).
  - Test admin approves cancellation: transitions booking to `CANCELLED` and calls `supplier.cancelReservation`.
  - Test admin rejects cancellation: restores booking to `previousStatus` (`TICKETED` or `CONFIRMED`).
  - Test real-time dashboard metrics calculate accurate counts across all statuses.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/cancellation-engine.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement cancellationService**
  - Implement request validation, review state machine, and metrics calculation.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/cancellation-engine.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(cancellation): implement cancellation service, review state machine, and dashboard metrics"
  ```

---

### Task 3: Cancellation & Admin Operations REST Endpoints (`apps/api`)

**Files:**
- Modify: `apps/api/src/routes/bookings.ts`
- Modify: `apps/api/src/routes/admin.ts`
- Test: `apps/api/tests/cancellations-api.test.ts`

**Interfaces:**
- Consumes: `cancellationService`, `auditService`
- Produces:
  - `POST /api/v1/bookings/:bookingId/cancellation-requests`
  - `GET /api/v1/bookings/:bookingId/cancellation-requests`
  - `GET /api/v1/admin/dashboard`
  - `GET /api/v1/admin/cancellations`
  - `POST /api/v1/admin/cancellations/:id/review`
  - `GET /api/v1/admin/audit-logs`

- [ ] **Step 1: Write failing test for cancellation and admin API routes**
  - Test `POST /api/v1/bookings/:bookingId/cancellation-requests` creates pending request.
  - Test non-admin accessing `/admin/dashboard` or `/admin/cancellations` receives 403.
  - Test admin reviews cancellation request via `POST /admin/cancellations/:id/review`.
  - Test admin retrieves metrics dashboard with live counts.
  - Test admin retrieves audit logs trail.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/cancellations-api.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement endpoints and RBAC protection**
  - Implement routes in `bookings.ts` and `admin.ts`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/cancellations-api.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement cancellation requests, admin review, and metrics dashboard endpoints"
  ```

---

### Task 4: Frontend Cancellation Request Modal & Action Buttons (`apps/web`)

**Files:**
- Create: `apps/web/src/components/CancellationModal.tsx`
- Modify: `apps/web/src/components/BookingConfirmation.tsx`
- Modify: `apps/web/src/components/BookingsList.tsx`
- Test: `apps/web/tests/CancellationModal.test.tsx`

**Interfaces:**
- Consumes: `BookingEntity`
- Produces:
  - `CancellationModal` capturing cancellation reason with validation and demo warning.
  - Cancellation trigger buttons and `CANCELLATION_PENDING` status indicators.

- [ ] **Step 1: Write failing test for CancellationModal and status triggers**
  - Test modal renders reason textarea and submits valid cancellation reason.
  - Test prevents submission when reason is less than 5 characters.
  - Test displays `CANCELLATION_PENDING` badge and prevents duplicate cancellation requests.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/CancellationModal.test.tsx --environment jsdom`
  - Expected: FAIL

- [ ] **Step 3: Implement CancellationModal and wire buttons**
  - Implement component and update booking card views.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/CancellationModal.test.tsx --environment jsdom`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement cancellation request modal and pending status badges"
  ```

---

### Task 5: Frontend Admin Operations Dashboard & Cancellation Review Queue (`apps/web`)

**Files:**
- Create: `apps/web/src/components/CancellationReviewQueue.tsx`
- Create: `apps/web/src/components/AuditLogView.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/AdminDashboardView.test.tsx`

**Interfaces:**
- Consumes: `AdminDashboardMetrics`, `CancellationRequestEntity`, `AuditLogEntity`
- Produces:
  - Enhanced Admin Dashboard with live metrics grid.
  - Cancellation Review Queue with Approve / Reject modal/action.
  - System Audit Log trail.

- [ ] **Step 1: Write failing test for AdminDashboardView**
  - Test metrics cards render live counts.
  - Test cancellation review queue displays pending requests and triggers approval/rejection.
  - Test audit log table renders recent administrative actions.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/AdminDashboardView.test.tsx --environment jsdom`
  - Expected: FAIL

- [ ] **Step 3: Implement CancellationReviewQueue, AuditLogView, and integrate in App.tsx**
  - Wire live API calls and state management into Admin Console.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/AdminDashboardView.test.tsx --environment jsdom`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement admin cancellation review queue, audit logs, and metrics dashboard"
  ```

---

### Task 6: Full Milestone 6 Verification

**Files:**
- Verification: Full monorepo test suite and build

- [ ] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites pass cleanly.

- [ ] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 build errors.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Milestone 6 implementation"
  ```

