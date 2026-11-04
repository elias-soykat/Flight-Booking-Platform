# Milestone 7: End-to-End Verification & Production Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formally verify all 5 end-to-end user scenarios defined in PRD Section 20 ("Definition of Done") with automated tests, create $0-budget Cloudflare Workers & Pages deployment configuration, and deliver the deployment and operations runbook.

**Architecture:** Automated integration and E2E test suites testing the API modular monolith across identity, agencies, flights, bookings, payments, ticketing, cancellations, and audit trails; edge deployment configuration for Cloudflare Workers (Backend) and Cloudflare Pages (Frontend SPA).

**Tech Stack:** TypeScript, Hono, Drizzle ORM, Zod, React 19, Cloudflare Workers/Wrangler, Cloudflare Pages, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

---

## Global Constraints

- **PRD Section 20 Scenarios**:
  - **Scenario A**: Direct Customer Booking, PNR, simulated payment, ticket issuance, ticket view.
  - **Scenario B**: Agency-Assisted Booking, token invitation, strictly one active agency per customer, agency booking for customer, multi-party visibility.
  - **Scenario C**: Payment Failure, idempotency, retry, timeout reconciliation, administrative force resolution.
  - **Scenario D**: Supplier Exception, manual ticketing queue, admin mock ticket issuance (`001-DEMO-XXXXXXXXXX`).
  - **Scenario E**: Cancellation Request, `CANCELLATION_PENDING`, admin review rejection (revert) and approval (`CANCELLED`), audit logging.
- **$0 Cost Policy**: Free-tier Cloudflare Workers and Cloudflare Pages configuration only. No paid add-ons or external dependencies.

---

### Task 1: Scenario A & Scenario B End-to-End Verification (`apps/api`)

**Files:**
- Create: `apps/api/tests/e2e-scenarios-ab.test.ts`

**Interfaces:**
- Consumes: `app.request` targeting `/api/v1/flights/search`, `/api/v1/bookings`, `/api/v1/agencies`, `/api/v1/customers/invitations`

- [ ] **Step 1: Write E2E test for Scenario A (Direct Customer Booking Flow)**
  - Test flight search returns valid offers.
  - Test customer creates booking with immutable price snapshot and mock PNR.
  - Test payment processing succeeds and issues 13-digit ticket numbers.
  - Test customer retrieves booking and tickets with correct details.

- [ ] **Step 2: Write E2E test for Scenario B (Agency-Assisted Booking Flow)**
  - Test agency owner creates agency and generates token invitation.
  - Test customer accepts invitation; verify active association.
  - Test customer cannot accept a second agency invitation (enforce strictly one active agency constraint).
  - Test agency owner books on behalf of associated customer with `customerUserId` and `createdByUserId` recorded.
  - Test both agency and customer can fetch and view the booking.
  - Test agency booking on behalf of an unassociated customer is rejected with 403.

- [ ] **Step 3: Run tests to verify**
  - Run: `npx vitest run apps/api/tests/e2e-scenarios-ab.test.ts`
  - Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add apps/api/tests/e2e-scenarios-ab.test.ts
  git commit -m "test(e2e): implement PRD Scenario A and Scenario B verification tests"
  ```

---

### Task 2: Scenario C, D, & E End-to-End Verification (`apps/api`)

**Files:**
- Create: `apps/api/tests/e2e-scenarios-cde.test.ts`

**Interfaces:**
- Consumes: `app.request` targeting `/api/v1/bookings`, `/api/v1/payments`, `/api/v1/admin`

- [ ] **Step 1: Write E2E test for Scenario C (Payment Failure, Idempotency & Reconciliation)**
  - Test payment attempt with `TIMEOUT` simulation enters `UNKNOWN` state.
  - Test idempotency prevents duplicate execution when retried with same idempotency key.
  - Test admin forces success via reconciliation endpoint; verifies state transition to `RECONCILED` and audit logging.

- [ ] **Step 2: Write E2E test for Scenario D (Ticketing Queue & Manual Fulfillment)**
  - Test booking with pending ticket issuance appears in admin ticketing queue.
  - Test admin manually issues tickets via `POST /api/v1/admin/bookings/:id/issue-tickets`.
  - Test booking transitions to `TICKETED` and passenger ticket numbers are assigned.

- [ ] **Step 3: Write E2E test for Scenario E (Cancellation Request & Decision Cycle)**
  - Test customer submits cancellation request with reason.
  - Test booking status becomes `CANCELLATION_PENDING`.
  - Test admin rejects cancellation request; booking reverts to previous status.
  - Test customer re-submits cancellation; admin approves; booking transitions to `CANCELLED` and audit entry is recorded.

- [ ] **Step 4: Run tests to verify**
  - Run: `npx vitest run apps/api/tests/e2e-scenarios-cde.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/tests/e2e-scenarios-cde.test.ts
  git commit -m "test(e2e): implement PRD Scenarios C, D, and E verification tests"
  ```

---

### Task 3: Production Edge Deployment Configuration ($0 Budget)

**Files:**
- Create: `apps/api/wrangler.toml`
- Create: `apps/web/public/_routes.json`
- Modify: `package.json`
- Create: `apps/api/tests/deployment-config.test.ts`

- [ ] **Step 1: Create Wrangler configuration for Cloudflare Workers API**
  - Set name: `travel-platform-api`
  - Set compatibility date and nodejs compatibility flag.
  - Configure environment variables and secrets placeholders.

- [ ] **Step 2: Create Cloudflare Pages configuration for React Web SPA**
  - Create `_routes.json` specifying API proxy rules and SPA fallback.

- [ ] **Step 3: Write deployment configuration validation test**
  - Test configuration files exist and contain valid properties.

- [ ] **Step 4: Run test to verify**
  - Run: `npx vitest run apps/api/tests/deployment-config.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/wrangler.toml apps/web/public/_routes.json package.json apps/api/tests/deployment-config.test.ts
  git commit -m "feat(deploy): configure Cloudflare Workers and Pages edge deployment"
  ```

---

### Task 4: Complete Deployment & Operations Runbook

**Files:**
- Create: `docs/DEPLOYMENT_AND_OPERATIONS_GUIDE.md`

- [ ] **Step 1: Write comprehensive deployment & operations guide**
  - Document $0 prerequisite setup (Supabase Free Tier, Cloudflare Account).
  - Document database migration execution with Drizzle.
  - Document Workers API deployment via Wrangler.
  - Document Pages SPA deployment.
  - Document PRD Scenario verification matrix and post-MVP extension points.

- [ ] **Step 2: Commit**
  ```bash
  git add docs/DEPLOYMENT_AND_OPERATIONS_GUIDE.md
  git commit -m "docs: add deployment and operations runbook for free-tier hosting"
  ```

---

### Task 5: Full Milestone 7 Verification & Final Monorepo Pass

**Files:**
- Verification across whole monorepo

- [ ] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites pass cleanly.

- [ ] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 build errors across all workspaces.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Milestone 7 implementation"
  ```
