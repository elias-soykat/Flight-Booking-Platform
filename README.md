# Commercial Flight Booking & Agency Travel Platform

A production-grade, full-stack flight booking and B2B travel agency management platform built for modern airline retailing, live New Distribution Capability (NDC) & GDS flight inventory, and localized payments.

Developed as a modular monolith monorepo, the platform provides dual distribution workflows: direct-to-consumer (B2C) flight booking and travel-agency-assisted (B2B) booking with transparent markup calculations, cryptographically hashed customer invitations, automated e-ticketing, and an administrative operations console.

---

## Table of Contents

1. [Platform Overview & Capabilities](#platform-overview--capabilities)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Monorepo Workspace Structure](#monorepo-workspace-structure)
5. [How the Platform Works](#how-the-platform-works)
   - [B2C Customer Booking Lifecycle](#1-b2c-customer-booking-lifecycle)
   - [B2B Agency Operations & Management](#2-b2b-agency-operations--management)
   - [Administrator & Operational Console](#3-administrator--operational-console)
6. [Core Domain & Business Rules](#core-domain--business-rules)
7. [External Integrations](#external-integrations)
   - [Flight Suppliers (Duffel & Amadeus)](#flight-suppliers-duffel--amadeus)
   - [Payment Gateways (SSLCommerz & Stripe)](#payment-gateways-sslcommerz--stripe)
8. [Local Development & Setup](#local-development--setup)
9. [Configuration & Environment Variables](#configuration--environment-variables)
10. [Automated Testing & Verification](#automated-testing--verification)

---

## Platform Overview & Capabilities

The platform delivers a commercial-ready airline booking experience, moving beyond simulated mockups to production-ready enterprise workflows:

- **Live Flight Search & Fare Validation:** Search one-way and round-trip flights across global carriers with real-time seat availability, dynamic baggage allowances, and fare-lock revalidation before checkout.
- **Dual Distribution Channels:**
  - **B2C Retail:** Direct bookings by individual travelers with customer dashboard, booking history, and self-service cancellation requests.
  - **B2B Agency Portal:** Agency owners invite customers, apply transparent agency markups on net supplier fares, manage bookings on behalf of associated clients, and maintain complete booking visibility.
- **Automated Electronic Ticketing:** Integrated with airline NDC/GDS ticketing engines (Duffel Travel Agent of Record / Amadeus) to issue genuine e-tickets with official carrier PNRs and e-ticket numbers.
- **Robust Payment Processing:** Secure checkout designed for both domestic Bangladesh operations (BDT currency, local debit/credit cards, and Mobile Financial Services including bKash and Nagad via SSLCommerz) and international operations via Stripe.
- **Administrative Control Center:** Real-time visibility into Gross Booking Value (GBV), conversion metrics, manual ticketing intervention queues, payment reconciliation, and cancellation dispute reviews.
- **Tamper-Evident Audit Logging:** Append-only cryptographic audit logs for every sensitive action (status transitions, administrative overrides, refunds).

---

## System Architecture

The application is structured as a **Modular Monolith** using npm workspaces, designed for ultra-low latency edge deployment on Cloudflare Workers and Cloudflare Pages with zero-cold-start execution.

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Cloudflare Pages)"]
        SPA["React 18 + Vite SPA"]
        AuthCtx["AuthContext & JWT Session"]
        ApiClient["Fetch API Client (Idempotency + Bearer Auth)"]
        SPA --> AuthCtx
        SPA --> ApiClient
    end

    subgraph EdgeAPI["API Gateway & Domain Services (Cloudflare Workers / Hono)"]
        Router["Hono Edge Router (/api/v1)"]
        AuthMW["Auth & RBAC Middleware"]
        IdempotencyMW["Idempotency Filter"]
        
        Router --> AuthMW
        AuthMW --> IdempotencyMW

        subgraph DomainModules["Domain Modules"]
            AuthModule["Auth Service (PBKDF2 & HMAC-SHA256 JWT)"]
            FlightModule["Flight Search & Pricing Engine"]
            BookingModule["Booking & State Machine Service"]
            PaymentModule["Payment & Reconciliation Service"]
            AgencyModule["Agency & Invitation Service"]
            CancelModule["Cancellation Service"]
            AuditModule["Audit Log Service"]
        end

        IdempotencyMW --> DomainModules
    end

    subgraph DataLayer["Persistence & Repository Layer"]
        RepoInterface["IAppRepository Interface"]
        DrizzleRepo["DrizzleRepository (PostgreSQL / Supabase)"]
        MemoryRepo["MemoryRepository (In-Memory CI/CD)"]
        
        RepoInterface --> DrizzleRepo
        RepoInterface --> MemoryRepo
    end

    subgraph ExternalSuppliers["Flight Supplier Adapters"]
        SupplierInterface["FlightSupplierAdapter Interface"]
        DuffelAdapter["Duffel NDC Adapter (Agent of Record)"]
        AmadeusAdapter["Amadeus GDS Adapter"]
        MockAdapter["MockFlightSupplier (Testing Fixture)"]
        
        SupplierInterface --> DuffelAdapter
        SupplierInterface --> AmadeusAdapter
        SupplierInterface --> MockAdapter
    end

    subgraph ExternalPayments["Payment Gateway Adapters"]
        PaymentInterface["PaymentGatewayAdapter Interface"]
        SSLCommerzAdapter["SSLCommerz Adapter (BDT / Cards / bKash)"]
        StripeAdapter["Stripe Adapter (USD / Global Cards)"]
        SimulatedAdapter["SimulatedPaymentAdapter (Test Harness)"]
        
        PaymentInterface --> SSLCommerzAdapter
        PaymentInterface --> StripeAdapter
        PaymentInterface --> SimulatedAdapter
    end

    ApiClient -->|"HTTPS / REST"| Router
    DomainModules --> RepoInterface
    FlightModule --> SupplierInterface
    BookingModule --> SupplierInterface
    PaymentModule --> PaymentInterface
```

### Key Architectural Patterns

1. **Repository Pattern (`IAppRepository`):**
   - Decouples all domain logic from storage mechanisms.
   - `DrizzleRepository`: Maps domain entities to PostgreSQL tables using Drizzle ORM for production.
   - `MemoryRepository`: High-speed, zero-dependency in-memory storage used for isolated unit and integration testing.
2. **Pluggable Supplier Adapter Pattern (`FlightSupplierAdapter`):**
   - Standardizes flight offer searching, fare revalidation, PNR reservation, electronic ticket issuance, and order cancellation across multiple GDS/NDC providers.
3. **Pluggable Payment Gateway Pattern (`PaymentGatewayAdapter`):**
   - Encapsulates payment session creation, server-side callback verification, IPN (Instant Payment Notification) webhooks, and status reconciliation.
4. **Idempotency Guard:**
   - Client sends unique `Idempotency-Key` headers on booking and payment requests. In-flight and duplicate requests are safely returned without double-charging or duplicate PNR creation.
5. **Immutable Booking Price Snapshot:**
   - Once a booking is created, base fare, agency markup, taxes, and passenger details are captured immutably to prevent downstream pricing drift.

---

## Technology Stack

| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** | Declarative, component-driven UI for reactive state and workflows. |
| **Build Tooling** | **Vite 6** | Instant Hot Module Replacement (HMR) and optimized ES bundle production. |
| **Styling & Icons** | **Tailwind CSS + Lucide React** | Utility-first responsive design system with accessible iconography. |
| **API Runtime** | **Cloudflare Workers (workerd)** | Ultra-low latency serverless edge runtime (< 5ms cold starts globally). |
| **Web Framework** | **Hono v4** | Lightweight, high-performance web framework optimized for web standards and Cloudflare Workers. |
| **Database & ORM** | **PostgreSQL (Supabase) + Drizzle ORM** | Type-safe schema definition, SQL migrations, relation queries, and zero-overhead performance. |
| **Cryptography & Auth** | **Web Crypto API (`crypto.subtle`)** | Native PBKDF2 password hashing (100k iterations, SHA-256) and HMAC-SHA256 JWT signing without Node native dependencies. |
| **Flight Supplier** | **Duffel API / Amadeus NDC** | Live airline inventory, NDC direct connects, GDS aggregation, and authorized e-ticketing. |
| **Payment Gateway** | **SSLCommerz / Stripe** | Central-bank compliant acquiring in Bangladesh (BDT, Cards, MFS) and global Stripe checkout. |
| **Validation** | **Zod v3** | Runtime schema parsing and API input sanitization. |
| **Testing** | **Vitest 3 + Testing Library** | High-speed ESM test runner executing 140+ unit, integration, and E2E test suites. |

---

## Monorepo Workspace Structure

The project is structured as an npm workspaces monorepo:

```
travel-platform/
├── apps/
│   ├── api/                     # Edge Backend API Service
│   │   ├── src/
│   │   │   ├── middleware/      # Auth, RBAC, error handling, CORS
│   │   │   ├── modules/         # Domain services (auth, booking, payment, agency, audit)
│   │   │   ├── repositories/    # IAppRepository, Drizzle and Memory implementations
│   │   │   ├── routes/          # REST route controllers (/auth, /flights, /bookings, /payments, /admin)
│   │   │   ├── utils/           # Web crypto helpers (PBKDF2, HMAC, token hashing)
│   │   │   └── index.ts         # Hono application entry point
│   │   ├── tests/               # 20+ Vitest test suites (E2E scenarios, auth, engines)
│   │   ├── tsconfig.json
│   │   └── wrangler.toml        # Cloudflare Workers deployment config
│   │
│   └── web/                     # Frontend Single Page Application (SPA)
│       ├── src/
│       │   ├── components/      # UI components (Navbar, FlightCard, BookingCard, AuthModal, etc.)
│       │   ├── context/         # AuthContext (JWT management, user sessions)
│       │   ├── lib/             # API client with automatic token injection
│       │   ├── views/           # Search, PassengerForm, Checkout, CustomerPortal, AgencyPortal, AdminDashboard
│       │   └── App.tsx          # Main React router shell
│       ├── tests/               # React Testing Library component and integration tests
│       ├── index.html
│       ├── tailwind.config.js
│       └── vite.config.ts
│
├── packages/
│   ├── shared/                  # Universal Domain Types & Utilities
│   │   ├── src/
│   │   │   ├── types/           # Canonical entity definitions (FlightOffer, Booking, Payment, User, Agency)
│   │   │   ├── pricing/         # Transparent markup calculation logic
│   │   │   └── validation/      # Shared Zod validation schemas
│   │   └── package.json
│   │
│   └── db/                      # Database Schema & Migrations
│       ├── src/
│       │   ├── schema/          # Drizzle tables (users, agencies, bookings, payments, tickets, audit)
│       │   ├── seeds/           # Initial fixtures and airport datasets
│       │   └── index.ts         # Drizzle client factory
│       ├── tests/               # Schema integrity tests
│       └── package.json
│
├── docs/                        # Architectural specifications, PRDs, and implementation plans
├── scripts/                     # Local developer orchestration scripts
├── package.json                 # Monorepo root package.json (workspaces & test runners)
├── tsconfig.base.json           # Shared strict TypeScript configuration
└── vitest.config.ts             # Workspace-wide Vitest configuration
```

---

## How the Platform Works

### 1. B2C Customer Booking Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Traveler / Customer
    participant Web as Web SPA
    participant API as Edge API (Hono)
    participant Supplier as Duffel / Flight Supplier
    participant Gateway as SSLCommerz / Payment GW
    participant DB as PostgreSQL DB

    Customer->>Web: Search Flights (DAC -> DXB, Date, Passengers)
    Web->>API: GET /api/v1/flights/search
    API->>Supplier: Request live offers
    Supplier-->>API: Flight offers & fare classes
    API-->>Web: Standardized FlightOffers (with transparent markup)
    
    Customer->>Web: Select Offer & Enter Passenger Information
    Web->>API: POST /api/v1/flights/validate-fare
    API->>Supplier: Revalidate Offer Availability & Price
    Supplier-->>API: Offer confirmed valid
    
    Web->>API: POST /api/v1/bookings (Idempotency-Key)
    API->>DB: Persist Booking (Status: PENDING, Snapshot Fare)
    API-->>Web: Booking Created (ID: book-xxx)

    Customer->>Web: Proceed to Checkout
    Web->>API: POST /api/v1/bookings/:id/payment (Idempotency-Key)
    API->>Gateway: Create Payment Session / Intent
    Gateway-->>API: Payment Session URL / Reference
    API-->>Web: Redirect / Open Checkout Modal
    Customer->>Gateway: Pay via Card / bKash
    Gateway-->>API: Webhook / Server Callback (Payment Succeeded)
    
    API->>Supplier: Create Order & Issue Electronic Tickets
    Supplier-->>API: PNR (e.g. 6QW9ZX) & E-Ticket Numbers (001-xxxx)
    API->>DB: Update Booking (CONFIRMED -> TICKETED)
    API->>DB: Insert Ticket Records & Log Audit Event
    API-->>Web: Booking Confirmation & Official E-Ticket
    Customer->>Web: Download / Print E-Ticket Document
```

### 2. B2B Agency Operations & Management

The platform enforces strict, conflict-free business rules for travel agencies:

1. **Agency Registration:** An agency owner registers with their business name and sets their default markup percentage (e.g. 5.00%).
2. **Customer Invitation:** The agency invites a customer by entering their email address.
   - The platform creates an invitation record with an expiration date and a **SHA-256 cryptographically hashed token**.
   - The customer receives an invitation notice.
3. **Explicit Customer Consent (1:1 Relationship):**
   - A customer can belong to **at most one active agency** at any given time.
   - Moving from B2C to an agency requires the customer to explicitly accept the invitation.
   - The customer can leave the agency or reject the invitation at their discretion.
4. **Agency-Assisted Booking:**
   - Agency owners can search and book flights on behalf of associated customers.
   - Both the customer and the agency have complete visibility of the booking in their respective portals.
   - Markups are calculated strictly on the supplier net base fare and displayed transparently.

### 3. Administrator & Operational Console

For operational reliability, the admin dashboard provides tools to manage exceptions without manual database intervention:

- **Operational Health & Metrics:** Live tracking of total volume, conversion rates, and pending queues.
- **Ticketing Exception Queue:** In the event that an airline NDC order enters manual review, the booking transitions to a recoverable state in the ticketing queue where admins can review supplier notes and trigger ticket issuance.
- **Payment Reconciliation Queue:** Handles payment status ambiguities (e.g., bank timeout where payment was deducted but notification was delayed) with idempotent forced reconciliation.
- **Cancellation Review Workflow:** When a customer requests a cancellation, the booking transitions to `CANCELLATION_PENDING`. Admins review reasons, airline refund penalties, and approve or reject the request (restoring previous status or transitioning to `CANCELLED`).
- **Comprehensive Audit Trail:** Every status change, login, payment attempt, and administrative override is logged with user ID, timestamp, entity type, and metadata.

---

## Core Domain & Business Rules

| Business Domain | Rule / Constraint | Architectural Enforcement |
| :--- | :--- | :--- |
| **Agency Association** | Exactly 1 active agency per customer. | Enforced by PostgreSQL unique index: `idx_agency_memberships_active_customer` where `status = 'ACTIVE'`. |
| **Customer Consent** | Agency association requires explicit consent. | Raw token is never stored in DB; SHA-256 hash verified upon customer acceptance. |
| **Pricing Integrity** | Markup is calculated on supplier net fare. | Formula: `Total = BaseFare * (1 + MarkupPct/100) + Taxes`. Snapshot saved at booking creation. |
| **Double-Charge Prevention** | Idempotency on payments and bookings. | Unique database constraint on `idempotencyKey` and cache deduplication middleware. |
| **PCI-DSS Compliance** | Zero sensitive card data stored. | No raw PANs, CVVs, or cardholder credentials touch platform databases. Hosted checkout or tokenization used exclusively. |
| **Ticketing Reality** | Never report `TICKETED` without confirmation. | Booking status only transitions to `TICKETED` upon receipt of confirmed electronic ticket numbers from the supplier. |
| **State Machine Safety** | Strict state transition rules. | `BookingStatus` transitions are strictly validated; invalid transitions throw HTTP 400 with domain error codes. |

---

## External Integrations

### Flight Suppliers (Duffel & Amadeus)

1. **Duffel API (Primary - IATA Travel Agent of Record):**
   - Duffel acts as the accredited Merchant of Record / Travel Agent of Record under Duffel Managed Content.
   - Enables commercial flight booking and electronic ticket issuance across 300+ global airlines without requiring an independent multi-million dollar IATA accreditation or bank guarantees.
   - Free development sandbox (`duffel_test_...`) with test airline `ZZ` (Duffel Airways) and partner NDC sandboxes.
2. **Amadeus Self-Service (Secondary - Global GDS Search):**
   - High-performance GDS flight search across scheduled carriers.
   - Used for fare discovery and route comparison.
3. **Mock Flight Supplier (Deterministic Test Fixture):**
   - Retained in the repository for offline CI/CD pipelines, reproducible testing, and simulated edge-case verification.

### Payment Gateways (SSLCommerz & Stripe)

1. **SSLCommerz (Primary - Bangladesh Entity Operations):**
   - Bangladesh's leading licensed payment gateway supporting Bangladesh Bank foreign exchange compliance.
   - Supported methods: Visa, Mastercard, American Express, UnionPay, and Mobile Financial Services (**bKash, Nagad, Rocket, Upay**).
   - Multi-currency: Native BDT settlements to local bank accounts with dynamic currency conversion for international travelers.
2. **Stripe (Secondary - International Card Payments):**
   - Integrated via hosted Stripe Checkout sessions and HMAC-SHA256 webhook signatures for international card processing.
3. **Simulated Payment Gateway (Test Mode):**
   - 4-scenario simulation harness (`SUCCESS`, `DECLINE`, `TIMEOUT`, `INSUFFICIENT_FUNDS`) allowing full end-to-end verification of recovery workflows.

---

## Local Development & Setup

### Prerequisites

- **Node.js:** v18.18.0 or newer (v20+ recommended)
- **npm:** v9.0.0 or newer
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/travel-platform.git
   cd travel-platform
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create `.env` in the root (and in `apps/api/` as needed):
   ```bash
   cp apps/api/.dev.vars.example apps/api/.dev.vars
   ```

### Running Locally

To run both the backend API and frontend SPA simultaneously:

```bash
# Start both API and Web servers concurrently
npm run dev
```

Or run each workspace individually:

```bash
# Start Backend API server (Hono on port 8787)
npm run dev:api

# Start Frontend SPA server (Vite on port 5173)
npm run dev:web
```

Open your browser at:
- **Frontend Application:** `http://localhost:5173`
- **Backend API Health Check:** `http://localhost:8787/api/v1/health`

---

## Configuration & Environment Variables

### Backend API (`apps/api/.dev.vars` / Cloudflare Secrets)

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Optional | `development` | Setting to `production` disables test headers and enforces cryptographic JWT signatures. |
| `DATABASE_URL` | Optional | `postgres://user:pass@host:5432/db` | Connection string for Supabase / PostgreSQL. If omitted, uses `MemoryRepository`. |
| `JWT_SECRET` | Required (Prod) | `your-cryptographic-256bit-secret` | HMAC-SHA256 signing key for authentication tokens. |
| `DUFFEL_API_TOKEN` | Optional | `duffel_test_...` | Access token for Duffel live or sandbox flight inventory. |
| `AMADEUS_CLIENT_ID` | Optional | `amadeus_api_key` | Amadeus Self-Service API Client ID. |
| `AMADEUS_CLIENT_SECRET`| Optional | `amadeus_api_secret` | Amadeus Self-Service API Client Secret. |
| `SSLCOMMERZ_STORE_ID` | Optional | `testbox` | SSLCommerz Merchant Store ID. |
| `SSLCOMMERZ_STORE_PASS`| Optional | `testbox@ssl` | SSLCommerz Merchant Secret Key. |
| `SSLCOMMERZ_IS_SANDBOX`| Optional | `true` | Toggles SSLCommerz sandbox endpoint. |
| `STRIPE_SECRET_KEY` | Optional | `sk_test_...` | Stripe secret key for card sessions. |
| `STRIPE_WEBHOOK_SECRET`| Optional | `whsec_...` | Stripe HMAC webhook signature secret. |
| `PLATFORM_CURRENCY` | Optional | `USD` | Base pricing currency (`USD`, `BDT`, `EUR`). |
| `DEFAULT_MARKUP_PERCENTAGE`| Optional | `5.0` | Default global agency markup percentage. |

### Frontend Web (`apps/web/.env`)

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Optional | `http://localhost:8787/api/v1` | URL of the backend API service. |

---

## Automated Testing & Verification

The platform maintains comprehensive test coverage across all domain modules, API routes, React UI components, and end-to-end integration scenarios.

### Running Tests

```bash
# Run all workspace test suites once
npm test

# Run tests in interactive watch mode
npm run test:watch

# Run a specific test suite
npx vitest run apps/api/tests/booking-engine.test.ts
```

### Test Coverage Highlights

- **140+ Automated Tests** across **33 Test Files** (100% passing).
- **Domain Engine Unit Tests:**
  - Flight search, route indexing, and fare revalidation.
  - Transparent mathematical markup calculations on supplier net fares.
  - Cancellation lifecycle, status transitions, and administrative review.
  - Cryptographic token generation and SHA-256 invitation hashing.
- **Production Authentication Tests:**
  - PBKDF2 password hashing verification.
  - JWT generation and HMAC-SHA256 cryptographic signature validation.
  - Production security barrier blocking demo headers.
- **End-to-End (E2E) Scenario Tests:**
  - **Scenario A:** Standard B2C Search &rarr; Validation &rarr; Booking &rarr; Settlement &rarr; Ticket Issuance.
  - **Scenario B:** B2B Agency Creation &rarr; Customer Invitation &rarr; Token Acceptance &rarr; Agency-Assisted Booking.
  - **Scenario C:** Payment Failure, Timeout, Idempotency & Administrative Forced Reconciliation.
  - **Scenario D:** Settlement with Delayed Ticketing &rarr; Administrative Fulfillment Queue.
  - **Scenario E:** Cancellation Request &rarr; Admin Review & Rejection &rarr; Re-submission & Approval.
- **Frontend Component Tests:**
  - Authentication modal (Sign In / Register Customer / Register Agency Owner).
  - Flight search form with validation and airport selector.
  - Passenger information input with adult/child/infant DOB validation.
  - Customer booking history and downloadable ticket views.
  - Administrative fulfillment and reconciliation tables.

---

## License

Private and proprietary. All rights reserved.
