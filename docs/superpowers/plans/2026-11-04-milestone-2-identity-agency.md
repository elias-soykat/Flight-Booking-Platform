# Milestone 2: User and Agency Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement authentication & RBAC middleware, customer profiles, agency organization creation, secure invitation token generation & hashing, and customer acceptance/rejection enforcing the strictly one-active-agency rule, with accompanying UI components.

**Architecture:** Extend the Hono API modular monolith with `identity`, `customer`, `agency`, and `admin` service modules; implement SHA-256 token hashing; enforce database and service-level constraints preventing multi-agency associations; provide React UI for demo user switching, agency customer management, and invitation review.

**Tech Stack:** TypeScript, Hono, Supabase Auth/JWT & Demo Auth headers, Web Crypto API (SHA-256), Drizzle ORM, Zod, React 19, Tailwind CSS, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md`](file:///home/elias/elias/travel-platform/docs/superpowers/specs/2026-11-04-travel-platform-mvp-design.md) & [`docs/PRD.md`](file:///home/elias/elias/travel-platform/docs/PRD.md)

## Global Constraints

- Enforce strictly one active agency association per customer at both service level and database level.
- Agency invitation tokens must be cryptographically hashed (SHA-256) before storing in the database.
- Agency owners can only access associated customers and their own agency bookings, never unrelated customers.
- Direct B2C customer transition to an agency-associated customer requires explicit consent via invitation acceptance.
- All administrative endpoints must be protected by server-side `ADMIN` role validation.

## Review Focus

- Customer attempting to accept an invitation when already having an active agency must receive a `409 Conflict` error explaining they must terminate the existing association first.
- Expired invitations (> 7 days) must be rejected with `410 Gone` or `400 Bad Request`.
- Non-agency users attempting to create invitations must be blocked with `403 Forbidden`.
- Modifying customer profiles must only be permitted by the authenticated owner.
- The UI demo switcher must smoothly update request authorization headers.

---

### Task 1: Auth & RBAC Middleware and Token Security

**Files:**
- Create: `apps/api/src/utils/crypto.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/middleware/rbac.ts`
- Test: `apps/api/tests/auth-rbac.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`
- Produces:
  - `hashToken(rawToken: string): Promise<string>`
  - `generateSecureToken(): string`
  - `authMiddleware`: Extracts user from Authorization header or `x-demo-user-id` / `x-demo-role`
  - `requireRole(...roles: UserRole[])`: Hono middleware enforcing role permissions

- [ ] **Step 1: Write failing tests for crypto utilities and auth/rbac middleware**
  - Verify token hashing produces consistent hex SHA-256.
  - Verify `authMiddleware` populates context user.
  - Verify `requireRole('AGENCY_OWNER')` rejects unauthorized roles with 403.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/auth-rbac.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement crypto utility, auth middleware, and RBAC guards**
  - Use `crypto.subtle.digest('SHA-256', ...)` for edge-compatible token hashing.
  - Implement `authMiddleware` and `requireRole` in Hono.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/auth-rbac.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement auth middleware, RBAC guards, and token hashing"
  ```

---

### Task 2: Customer Profiles & Identity Routes

**Files:**
- Create: `apps/api/src/modules/identity/service.ts`
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/routes/customers.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/customers.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/db`, `authMiddleware`
- Produces:
  - `GET /api/v1/auth/me`
  - `GET /api/v1/customers/me`
  - `PATCH /api/v1/customers/me`

- [ ] **Step 1: Write failing test for customer profile endpoints**
  - Test profile retrieval returns profile details.
  - Test updating first name/last name/phone updates the profile.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/customers.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement identity service and customer routes**
  - In-memory / mock database store for local testing and Drizzle query binding.
  - Mount routes on `/api/v1/auth` and `/api/v1/customers`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/customers.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement identity service and customer profile routes"
  ```

---

### Task 3: Agency Lifecycle, Invitations & One-Agency Constraint

**Files:**
- Create: `apps/api/src/modules/agency/service.ts`
- Create: `apps/api/src/routes/agencies.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/agencies.test.ts`

**Interfaces:**
- Consumes: `@travel-platform/shared`, `@travel-platform/db`, `crypto.ts`
- Produces:
  - `POST /api/v1/agencies`
  - `GET /api/v1/agencies/me`
  - `POST /api/v1/agencies/invitations`
  - `GET /api/v1/agencies/invitations`
  - `GET /api/v1/agencies/customers`
  - `GET /api/v1/customers/invitations`
  - `POST /api/v1/customers/invitations/:id/accept`
  - `POST /api/v1/customers/invitations/:id/reject`

- [ ] **Step 1: Write failing tests for agency invitation & association lifecycle**
  - Test agency creation and retrieval.
  - Test inviting customer returns raw token, stores hashed token.
  - Test customer accepting invitation establishes active membership.
  - Test customer already associated with an agency cannot accept a second invitation (409 Conflict).
  - Test customer rejecting invitation marks status REJECTED.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/agencies.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement agency service and invitation routes**
  - Implement full business logic enforcing the 1-active-agency rule, token verification, and expiration.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/agencies.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement agency management, invitations, and one-agency constraint"
  ```

---

### Task 4: Administrative Users & Agencies Inspection

**Files:**
- Create: `apps/api/src/modules/admin/service.ts`
- Create: `apps/api/src/routes/admin.ts`
- Modify: `apps/api/src/routes/v1.ts`
- Test: `apps/api/tests/admin-inspection.test.ts`

**Interfaces:**
- Consumes: `requireRole('ADMIN')`
- Produces:
  - `GET /api/v1/admin/users`
  - `GET /api/v1/admin/agencies`

- [ ] **Step 1: Write failing tests for administrative inspection**
  - Test non-admin user receives 403 Forbidden.
  - Test admin receives list of all platform users and agencies.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/api/tests/admin-inspection.test.ts`
  - Expected: FAIL

- [ ] **Step 3: Implement admin service and inspection routes**
  - Mount `/api/v1/admin/users` and `/api/v1/admin/agencies` with admin guard.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/api/tests/admin-inspection.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api
  git commit -m "feat(api): implement admin user and agency inspection endpoints"
  ```

---

### Task 5: Frontend Agency & Invitation Management UI

**Files:**
- Create: `apps/web/src/components/UserSwitcher.tsx`
- Create: `apps/web/src/components/AgencyPortal.tsx`
- Create: `apps/web/src/components/CustomerInvitations.tsx`
- Modify: `apps/web/src/components/Navbar.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/tests/Agency.test.tsx`

**Interfaces:**
- Consumes: `apiClient`, `@travel-platform/shared`
- Produces: Interactive agency management view, invitation sender, and customer invitation accept/reject panel

- [ ] **Step 1: Write failing test for Agency Portal UI and Customer Invitations**
  - Test AgencyPortal renders invitation form and invite button.
  - Test CustomerInvitations renders pending invitations and accept button.

- [ ] **Step 2: Run test to verify it fails**
  - Run: `npx vitest run apps/web/tests/Agency.test.tsx --environment jsdom`
  - Expected: FAIL

- [ ] **Step 3: Implement UserSwitcher, AgencyPortal, and CustomerInvitations**
  - Add demo role switcher (Customer, Agency Owner, Admin).
  - Connect actions to `apiClient`.

- [ ] **Step 4: Run test to verify it passes**
  - Run: `npx vitest run apps/web/tests/Agency.test.tsx --environment jsdom`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web
  git commit -m "feat(web): implement user switcher, agency portal, and invitation UI"
  ```

---

### Task 6: Full Milestone 2 Verification

**Files:**
- Verification: Run all monorepo test suites (`npm test`) and full build (`npm run build`).

- [ ] **Step 1: Run comprehensive tests across all packages**
  - Run: `npm test`
  - Expected: All test suites in `packages/*` and `apps/*` pass cleanly.

- [ ] **Step 2: Run full monorepo build**
  - Run: `npm run build`
  - Expected: 0 TypeScript or Vite build errors.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "chore: complete and verify Milestone 2 implementation"
  ```
