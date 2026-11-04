# Product Requirements Document (PRD)
## AI-Powered Travel Booking & Distribution Platform

**Version:** 1.0 — MVP  
**Product type:** API-first travel booking platform with AI assistance  
**Stage:** Initial MVP / Sandbox launch  
**Primary objective:** Build a working, deployable travel platform with zero initial infrastructure expenditure.

---

# 1. Product Overview

## 1.1 Product vision

Build an AI-enabled travel booking platform that allows users to search, compare, and book flights, discover hotels, manage reservations, and receive personalized travel assistance.

The platform should be built around a flexible supplier integration architecture, allowing multiple airline, hotel, GDS, and travel API providers to be connected through a unified interface.

The product should eventually support:

- B2C travel booking.
- B2B travel agency and reseller operations.
- White-label travel booking experiences.
- Multi-supplier inventory.
- Multi-currency pricing.
- AI-assisted travel planning and booking.

**MVP assumption:** Start with a single customer-facing booking experience and an internal admin dashboard. Build the underlying architecture to support B2B and white-label expansion, but do not build every business model in the first release.

## 1.2 Product objectives

1. Provide a complete flight search and booking journey using a sandbox supplier.
2. Create a supplier-independent integration architecture.
3. Support flight availability, fare pricing, revalidation, reservations, and booking status.
4. Build a foundation for hotel booking.
5. Support multiple currencies and configurable pricing rules.
6. Provide an AI travel assistant that can search and explain travel options.
7. Give administrators control over suppliers, bookings, users, and pricing.
8. Deploy the complete application using free infrastructure.
9. Make it possible to add commercial travel suppliers and payment gateways later.

## 1.3 Target users

| User | Main needs |
|---|---|
| Travelers | Search, compare, and book flights and hotels |
| Travel agents | Find travel options and manage customer bookings |
| Administrators | Manage suppliers, bookings, users, and pricing |
| Platform operators | Monitor integrations, failures, and transactions |

---

# 2. MVP Scope

## Included in the MVP

- User registration and authentication.
- User profile and passenger information.
- Flight search.
- Flight results and filters.
- Flight details and fare rules.
- Fare price verification.
- Booking workflow.
- Reservation and booking management.
- Sandbox supplier integration.
- Supplier abstraction layer.
- Multi-currency display.
- Configurable markup and pricing.
- AI travel assistant.
- Admin dashboard.
- Booking notifications.
- Basic reporting and analytics.
- API documentation.
- Deployment and monitoring.

## Not included in the first release

- Production airline ticket issuance without an authorized supplier.
- Real-money payment processing.
- Automated ticket reissuance and refunds across multiple airlines.
- Full hotel booking and supplier connectivity.
- Corporate expense management.
- Loyalty and rewards programs.
- Complex travel agency commissions.
- Mobile applications.
- Multiple independently deployed microservices.

These should be designed for future expansion without delaying the MVP.

---

# 3. Functional Requirements

## 3.1 Authentication and user management

**Features:**

- Email and password registration.
- Email verification.
- Login and logout.
- Password reset.
- Google OAuth (optional).
- User profile management.
- Role-based access control.
- Account status management.

**User roles:**

- CUSTOMER
- AGENT
- ADMIN
- SUPER_ADMIN

**Acceptance criteria:**

- Users can register and authenticate.
- Protected pages require authentication.
- Admin routes cannot be accessed by customers.
- Backend endpoints enforce permissions independently of frontend visibility.

**Technology:** Supabase Auth.

## 3.2 Customer dashboard

The customer dashboard should provide:

- Upcoming trips.
- Previous trips.
- Pending reservations.
- Cancelled bookings.
- Passenger profiles.
- Saved destinations.
- Recent searches.
- Account settings.

A customer should be able to open a booking and view its complete lifecycle.

## 3.3 Flight search and discovery

This is the primary MVP functionality.

**Search options:**

- One-way flights.
- Round-trip flights.
- Origin airport.
- Destination airport.
- Departure date.
- Return date.
- Number of adults.
- Number of children.
- Number of infants.
- Cabin class.
- Currency.

**Search results should display:**

- Airline name and logo.
- Flight number.
- Departure and arrival airports.
- Departure and arrival times.
- Flight duration.
- Stop count.
- Layover details.
- Baggage allowance, when available.
- Fare family.
- Refundability.
- Change conditions.
- Total price.
- Currency.
- Supplier reference.

**Filters:**

- Price range.
- Airlines.
- Departure time.
- Arrival time.
- Non-stop flights.
- One-stop flights.
- Total duration.
- Cabin class.

**Sorting:**

- Cheapest.
- Fastest.
- Recommended.
- Earliest departure.

**Acceptance criteria:**

- Search results come from a real sandbox API when configured.
- The interface supports loading, empty, and error states.
- Search results are normalized into a consistent internal format.
- Search requests are validated on the backend.
- Search results are never presented as confirmed bookings.

## 3.4 Supplier integration engine

This is the most important architectural component.

Build a supplier abstraction layer so the core application never depends directly on one travel provider's API format.

**Initial integration:**

Use Amadeus Self-Service test APIs, subject to account eligibility and available test functionality.

**Future integration candidates:**

- Amadeus.
- Duffel.
- Sabre.
- Travelport.
- PKFARE.
- Mystifly.
- Hotelbeds.
- Expedia Rapid.

**Supplier adapter responsibilities:**

- Authentication.
- Token management.
- Request transformation.
- Response transformation.
- Error normalization.
- Timeout handling.
- Retry handling where safe.
- Rate-limit handling.
- Supplier health status.
- Logging and tracing.

**Suggested interface:**

```ts
interface FlightSupplier {
  searchFlights(
    request: FlightSearchRequest
  ): Promise<FlightOffer[]>;

  getOfferPrice(
    offerId: string
  ): Promise<PricedOffer>;

  createBooking(
    request: CreateBookingRequest
  ): Promise<SupplierBooking>;

  getBooking(
    supplierBookingId: string
  ): Promise<SupplierBooking>;

  cancelBooking?(
    supplierBookingId: string
  ): Promise<CancelResult>;
}
```

Not every provider supports every operation. Unsupported operations must be explicitly represented rather than silently simulated.

**Important:** Store supplier-specific references alongside internal IDs. Never use a supplier's booking ID as the platform's primary booking identifier.

## 3.5 Flight pricing and fare verification

Before a customer proceeds with booking, the platform must verify the latest available fare.

**Requirements:**

- Revalidate the selected offer with the supplier.
- Compare the previous and updated prices.
- Display price changes.
- Display taxes and fees when supplied.
- Apply configured markup.
- Calculate final customer price.
- Record supplier currency and customer display currency.
- Reject expired offers.

**Example pricing calculation:**

```text
Supplier base price       $300
Supplier taxes             $45
Platform markup            $15
------------------------------
Customer total            $360
```

The example is illustrative, not a live fare.

**Acceptance criteria:**

- A customer cannot book an expired offer.
- Price changes require customer confirmation.
- Pricing calculations happen on the backend.
- The original supplier price is retained for auditing.

## 3.6 Booking and reservation management

**Booking journey:**

1. Customer searches flights.
2. Customer selects an offer.
3. Backend retrieves current pricing.
4. Customer confirms passenger information.
5. Backend creates an internal booking.
6. Backend initiates the supplier booking operation.
7. Supplier response is saved.
8. Booking status is updated.
9. Customer receives confirmation or an appropriate failure message.

**Passenger information:**

- First name.
- Last name.
- Date of birth, where required.
- Gender, where required by supplier.
- Nationality, where required.
- Passport information, where required.
- Contact email.
- Contact phone.

Collect sensitive passenger information only when needed for the booking and protect it appropriately.

**Booking statuses:**

- DRAFT
- PRICE_PENDING
- PRICE_CONFIRMED
- BOOKING_PENDING
- CONFIRMED
- TICKETING_PENDING
- TICKETED
- FAILED
- CANCEL_PENDING
- CANCELLED
- REFUND_PENDING
- REFUNDED

A reservation, a confirmed booking, and an issued ticket are different states. Do not mark a booking as ticketed unless the supplier explicitly confirms ticket issuance.

**Booking details should contain:**

- Internal booking reference.
- Supplier booking reference.
- Passenger details.
- Flight itinerary.
- Price breakdown.
- Currency.
- Booking status.
- Supplier response summary.
- Created and updated timestamps.

**Reliability requirements:**

- Prevent duplicate booking submissions.
- Use idempotency keys.
- Persist the booking attempt before making external calls.
- Handle supplier timeouts and uncertain outcomes.
- Provide a way for administrators to reconcile uncertain booking states.

## 3.7 Hotel search — foundation only

Design the domain and supplier interfaces for future hotel booking.

Potential future functionality:

- Destination search.
- Check-in and check-out.
- Number of rooms.
- Adults and children.
- Room availability.
- Hotel images and descriptions.
- Amenities.
- Room types.
- Cancellation policies.
- Hotel pricing.
- Reservation management.

For MVP, the hotel section can be marked as coming soon unless an accessible sandbox hotel API is available.

Do not show fake hotel availability as real inventory.

## 3.8 Multi-currency support

Support:

- USD.
- EUR.
- GBP.
- BDT.
- Other currencies through a configurable currency table.

**Requirements:**

- Store the supplier's original amount and currency.
- Store the customer-facing amount and currency.
- Store the exchange rate used.
- Store the exchange rate timestamp and source.
- Use decimal arithmetic, not JavaScript floating-point calculations, for money.
- Allow administrators to configure supported currencies.

Currency conversion should initially use a free exchange-rate source if its terms and limits permit. Alternatively, allow administrators to configure exchange rates manually.

Displaying a converted price does not mean the platform can settle or charge that currency.

## 3.9 Pricing and markup management

Admin users should be able to configure:

- Default markup.
- Percentage markup.
- Fixed markup.
- Supplier-specific markup.
- Route-specific markup.
- Currency-specific rules.
- Minimum selling price.
- Promotional discount.

Pricing rule priority should be deterministic and documented.

All price calculations should be performed server-side and saved as a snapshot with the booking.

## 3.10 Payment architecture

The MVP should be payment-ready, but real payments should be disabled initially.

**Architecture requirements:**

- Payment provider abstraction.
- Payment intent model.
- Payment status tracking.
- Payment transaction records.
- Refund status model.
- Webhook endpoint structure.
- Reconciliation support.

**Payment statuses:**

- CREATED
- PENDING
- AUTHORIZED
- CAPTURED
- FAILED
- REFUND_PENDING
- REFUNDED

**Future payment integrations:**

- Stripe.
- Adyen.
- Checkout.com.
- Local payment providers where commercially available.

Never store card numbers or CVV in the application database.

For the initial sandbox, provide a clearly labelled simulated payment flow. It must not imply that money was charged.

## 3.11 AI travel assistant

The AI assistant should help customers discover and understand travel options.

**MVP capabilities:**

- Natural-language travel requests.
- Convert requests into structured flight searches.
- Ask for missing information.
- Explain flight options.
- Compare available offers.
- Summarize fare conditions.
- Explain baggage and cancellation policies when supplier data exists.
- Suggest suitable alternatives.
- Answer general travel questions.

**Example:**

Customer:

"I need to fly from Dhaka to London next month, preferably with one stop and a reasonable price."

Assistant:

- Extracts origin and destination.
- Asks for missing dates and passenger count.
- Calls the flight search tool.
- Receives actual supplier results.
- Compares available offers.
- Explains the best options.

**AI tool architecture:**

```text
Customer
   |
AI Assistant
   |
Intent Extraction
   |
Tool Selection
   |
Backend Tools
   |-- searchFlights()
   |-- getOfferPrice()
   |-- compareOffers()
   |-- getBookingStatus()
   |
Normalized Results
   |
AI Response
```

**Important AI safety rules:**

- AI cannot invent flights, prices, or availability.
- AI cannot directly write booking records.
- AI cannot confirm a reservation without the booking service confirming it.
- AI cannot charge a payment method.
- Booking operations require explicit customer confirmation.
- Tool calls must validate user permissions and input.
- AI responses must distinguish live supplier data from general recommendations.

Use a model-provider abstraction so the platform can switch between Gemini, OpenAI, or other compatible providers.

The AI feature should be optional and gracefully degrade when no API key or free quota is available.

## 3.12 Admin dashboard

The admin dashboard should provide centralized operational control.

**Overview:**

- Total users.
- Total searches.
- Total bookings.
- Confirmed bookings.
- Failed bookings.
- Pending bookings.
- Booking revenue estimates.
- Supplier health.

**User management:**

- List users.
- View profiles.
- Change user roles.
- Suspend accounts.

**Booking management:**

- Search bookings.
- Filter by status.
- View booking details.
- View supplier references.
- View price breakdown.
- Inspect booking errors.
- Add internal notes.
- Trigger safe reconciliation actions.

**Supplier management:**

- Add supplier configuration.
- Enable or disable suppliers.
- Configure sandbox or production environment.
- Check supplier connectivity.
- View supplier error logs.

Never expose supplier API secrets in the frontend or ordinary admin API responses.

**Pricing management:**

- Configure markups.
- Configure currency rules.
- View pricing history.

**System monitoring:**

- Recent errors.
- Failed API requests.
- Supplier response times.
- Booking failures.
- AI tool failures.

## 3.13 Notifications

Initial notifications:

- Account registration.
- Booking request received.
- Booking confirmed.
- Booking failed.
- Booking status changed.

Use email templates and a provider abstraction.

For the first deployment, in-app notifications can work without any email provider. Email should be optional.

## 3.14 Search history and saved trips

Customers should be able to:

- View recent searches.
- Save flight offers.
- Remove saved offers.
- View previous booking attempts.

Saved offers should be labelled with their expiry or freshness status. They must not be represented as guaranteed availability.

---

# 4. User Experience and Main Screens

## Customer application

1. Landing page.
2. Flight search page.
3. Search results page.
4. Flight details page.
5. Passenger information page.
6. Price confirmation page.
7. Payment/sandbox checkout page.
8. Booking confirmation page.
9. My bookings page.
10. Booking details page.
11. AI travel assistant page.
12. Profile and settings page.
13. Login and registration pages.

## Admin application

1. Admin overview.
2. User management.
3. Booking management.
4. Booking details and reconciliation.
5. Supplier management.
6. Pricing configuration.
7. Currency management.
8. System logs.
9. AI configuration.
10. Admin settings.

**Design direction:**

- Modern, clean travel-tech interface.
- Responsive desktop and mobile layouts.
- Clear flight cards.
- Simple booking progression.
- Accessible forms.
- Loading skeletons.
- Meaningful error states.
- No unnecessary animations.
- Consistent design system.

Suggested UI inspiration: Duffel's developer-first simplicity, Spotnana's travel workflow clarity, and modern OTA search experiences.

---

# 5. Technical Architecture

## 5.1 Architecture decision

Use a **modular monolith** for the MVP.

Do not begin with microservices.

Reasons:

- Lower infrastructure cost.
- Faster development.
- Easier debugging.
- Simpler deployment.
- Fewer operational dependencies.
- Easier transactions across booking-related modules.

Modules should have clear boundaries so they can be extracted later if needed.

## 5.2 High-level architecture

```text
                 CUSTOMER / ADMIN
                        |
                        v
                React + Vite Frontend
                        |
                        v
                Cloudflare API Worker
                        |
       +----------------+----------------+
       |                |                |
       v                v                v
    Auth/User        Travel Core       AI Assistant
       |                |                |
       |          +-----+------+         |
       |          |            |         |
       |          v            v         |
       |       Search       Booking      |
       |          |            |         |
       |          v            v         |
       |      Supplier     Pricing       |
       |      Adapters       Engine      |
       |          |            |         |
       +----------+------------+---------+
                        |
                        v
                 Supabase PostgreSQL
                        |
                        v
               External Travel APIs
                        |
              +---------+----------+
              |                    |
              v                    v
          Amadeus API         Future Suppliers
```

## 5.3 Recommended technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Customer and admin UI |
| Language | TypeScript | Shared type safety |
| Styling | Tailwind CSS | UI styling |
| Components | shadcn/ui + Radix UI | Accessible components |
| Routing | React Router | Application routing |
| Server state | TanStack Query | API data and caching |
| Forms | React Hook Form | Form management |
| Validation | Zod | Shared schemas |
| Backend | Node.js-compatible TypeScript with Hono | API |
| Runtime | Cloudflare Workers | Serverless deployment |
| Database | PostgreSQL | Application data |
| Database hosting | Supabase Free | Managed database |
| Authentication | Supabase Auth | Authentication |
| Database access | Drizzle ORM | Typed queries and migrations |
| API documentation | OpenAPI + Scalar | API documentation |
| AI | Provider abstraction + Gemini API | AI assistant |
| Testing | Vitest | Unit and integration tests |
| Browser testing | Playwright | End-to-end testing |
| Logging | Structured application logs | Error investigation |
| Source control | GitHub | Repository |
| CI/CD | GitHub Actions | Automated testing |
| Frontend hosting | Cloudflare Pages | Static frontend |
| Backend hosting | Cloudflare Workers | API deployment |

## 5.4 Why this stack?

**React + Vite:** Fast development, lightweight frontend, straightforward deployment.

**TypeScript:** Shared types, predictable APIs, easier refactoring.

**Hono:** Lightweight API framework with TypeScript support and Cloudflare Workers compatibility.

**PostgreSQL:** Relational integrity is essential for passengers, bookings, payments, supplier records, and audit history.

**Supabase:** Database and authentication without managing a server.

**Drizzle ORM:** Type-safe SQL and explicit migrations.

**Cloudflare:** Frontend and API can be deployed without managing a VPS.

**No Docker required:** Develop and run locally using Node.js and package scripts.

## 5.5 Avoid initially

Do not introduce these unless a concrete requirement justifies them:

- Kubernetes.
- Docker.
- Kafka.
- Redis.
- Elasticsearch.
- Separate microservices.
- Dedicated message brokers.
- Complex event-driven infrastructure.
- Paid observability platforms.
- Paid AI APIs.
- Paid database hosting.

The architecture should not be unnecessarily complicated for the initial traffic level.

---

# 6. Database Design

Use PostgreSQL.

Recommended initial tables:

## Identity and users

- profiles
- user_roles
- passenger_profiles

## Travel search

- flight_searches
- flight_offers
- saved_offers

## Suppliers

- suppliers
- supplier_credentials
- supplier_requests
- supplier_logs

## Booking

- bookings
- booking_passengers
- booking_segments
- booking_status_history
- booking_attempts

## Pricing

- currencies
- exchange_rates
- pricing_rules
- booking_price_snapshots

## Payment

- payment_intents
- payment_transactions
- payment_refunds

## AI

- ai_conversations
- ai_messages
- ai_tool_calls

## Administration

- audit_logs
- notifications
- system_settings

## 6.1 Important database design rules

- Use UUID primary keys.
- Store timestamps in UTC.
- Store currency codes using ISO 4217.
- Store monetary values using PostgreSQL `numeric`.
- Preserve the original supplier response where operationally necessary, with appropriate redaction.
- Keep booking status history instead of overwriting all history.
- Add indexes to frequently queried fields.
- Apply row-level security where appropriate.
- Never store raw supplier credentials in public tables.
- Encrypt sensitive passenger data and restrict access.
- Maintain audit logs for privileged actions.

---

# 7. API Design

Use REST APIs with versioning.

Base URL:

```text
/api/v1
```

## Authentication

```text
GET    /auth/me
POST   /auth/logout
```

Registration, login, and password reset can initially use Supabase Auth directly through its supported client flows.

## Flights

```text
POST   /flights/search
GET    /flights/search/:searchId
GET    /flights/offers/:offerId
POST   /flights/offers/:offerId/price
```

## Bookings

```text
POST   /bookings
GET    /bookings
GET    /bookings/:bookingId
POST   /bookings/:bookingId/cancel
```

Cancellation must only be enabled when the supplier supports it and the booking is eligible.

## Passengers

```text
GET    /passengers
POST   /passengers
PUT    /passengers/:passengerId
DELETE /passengers/:passengerId
```

## Payments

```text
POST   /payments/intents
GET    /payments/:paymentId
POST   /payments/webhooks/:provider
```

Payment endpoints remain disabled until a real provider is configured.

## AI

```text
POST   /ai/chat
GET    /ai/conversations
GET    /ai/conversations/:conversationId
```

## Admin

```text
GET    /admin/overview
GET    /admin/users
GET    /admin/bookings
GET    /admin/suppliers
POST   /admin/suppliers
PUT    /admin/suppliers/:supplierId
GET    /admin/system-logs
GET    /admin/pricing-rules
POST   /admin/pricing-rules
```

Every endpoint must have request validation, authorization, consistent response formats, and appropriate error handling.

---

# 8. Repository Structure

Use a single repository.

```text
travel-platform/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── flights/
│   │   │   │   ├── bookings/
│   │   │   │   ├── passengers/
│   │   │   │   ├── payments/
│   │   │   │   ├── assistant/
│   │   │   │   └── admin/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── routes/
│   │   └── package.json
│   │
│   └── api/
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── flights/
│       │   │   ├── suppliers/
│       │   │   ├── bookings/
│       │   │   ├── pricing/
│       │   │   ├── payments/
│       │   │   ├── assistant/
│       │   │   └── admin/
│       │   ├── integrations/
│       │   │   ├── flight-suppliers/
│       │   │   │   ├── amadeus/
│       │   │   │   └── mock/
│       │   │   └── payment-providers/
│       │   ├── middleware/
│       │   ├── database/
│       │   ├── lib/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   ├── schemas/
│   │   └── constants/
│   └── config/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   └── SUPPLIERS.md
│
├── package.json
└── README.md
```

Use npm workspaces initially. Avoid adding a complex monorepo tool unless the project grows enough to justify it.

---

# 9. $0 Infrastructure and Deployment Plan

## 9.1 Initial hosting

| Service | Choice | Initial cost |
|---|---|---:|
| Frontend | Cloudflare Pages | $0 |
| Backend API | Cloudflare Workers Free | $0 |
| Database | Supabase Free | $0 |
| Authentication | Supabase Auth Free | $0 |
| Source code | GitHub Free | $0 |
| CI/CD | GitHub Actions Free allowance | $0 |
| API documentation | Scalar / OpenAPI | $0 |
| AI | Optional free-tier provider | $0 within available quota |
| Email | In-app notifications initially | $0 |
| Domain | Cloudflare-provided subdomain | $0 |

**Estimated initial infrastructure cost: $0/month**, provided the project stays within free-tier quotas and provider terms.

A custom domain is optional and generally costs money. Do not purchase one for the initial prototype.

## 9.2 Deployment process

**Frontend:**

1. Push the repository to GitHub.
2. Connect the repository to Cloudflare Pages.
3. Configure the frontend root directory.
4. Configure the build command.
5. Add the API base URL.
6. Deploy.

**Backend:**

1. Install Wrangler.
2. Configure the Cloudflare Worker.
3. Add environment variables and secrets.
4. Configure Supabase database connection.
5. Deploy using Wrangler.

**Database:**

1. Create a Supabase project.
2. Create the PostgreSQL schema.
3. Run Drizzle migrations.
4. Configure authentication.
5. Configure database access policies.
6. Add production environment variables.

## 9.3 Environment variables

Example:

```env
# Frontend
VITE_API_BASE_URL=

# Backend
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
AMADEUS_BASE_URL=

AI_PROVIDER=
AI_API_KEY=

APP_ENV=development
```

Never expose service-role keys, supplier secrets, or AI provider secrets through frontend environment variables.

Use Cloudflare Worker secrets for private credentials.

## 9.4 Cost and usage safeguards

- Configure usage alerts where available.
- Avoid unnecessary API calls.
- Cache safe search results briefly.
- Limit search request frequency per user.
- Avoid storing unnecessary large supplier payloads.
- Add pagination.
- Restrict AI usage per user.
- Do not run expensive scheduled jobs.
- Avoid unbounded retries.
- Keep a database backup/export procedure.

Free plans can change and may have inactivity, retention, or usage restrictions. Review the provider's current terms before launch.

---

# 10. Testing Strategy

## Unit tests

Test:

- Currency conversion.
- Markup calculations.
- Flight normalization.
- Supplier response mapping.
- Booking status transitions.
- Request validation.
- Role permissions.

## Integration tests

Test:

- Supabase database operations.
- Supplier authentication.
- Flight search.
- Fare revalidation.
- Booking creation.
- Supplier timeout handling.
- Booking reconciliation.

## End-to-end tests

Test:

1. Register a customer.
2. Log in.
3. Search for a flight.
4. Select a result.
5. Verify its price.
6. Enter passenger details.
7. Submit a sandbox booking.
8. View booking status.
9. Open the booking in the admin dashboard.

## Failure scenarios

- Supplier returns an error.
- Supplier times out.
- Offer expires.
- Price changes.
- Booking submission is duplicated.
- Database connection fails.
- AI provider is unavailable.
- User attempts unauthorized access.

---

# 11. Security Requirements

- HTTPS everywhere.
- Secure authentication.
- Server-side role checks.
- Input validation using Zod.
- Rate limiting.
- Secure secret management.
- Protection against SQL injection.
- Protection against XSS.
- CSRF protection where applicable.
- Strict CORS configuration.
- Sensitive-data redaction in logs.
- Audit logging.
- Database access policies.
- Idempotent booking endpoints.
- No storage of card details.
- Restricted access to passport information.

The MVP must not claim PCI compliance, IATA accreditation, or production-grade travel distribution certification unless those have actually been obtained.

---

# 12. Development Roadmap

Suggested schedule for one experienced full-stack engineer.

| Phase | Scope | Estimate |
|---|---|---:|
| 1 | Project setup, architecture, database, authentication | 2–3 days |
| 2 | UI foundation, customer dashboard, admin layout | 2–3 days |
| 3 | Supplier adapter and flight search | 3–4 days |
| 4 | Flight results, filtering, offer details | 2–3 days |
| 5 | Fare verification and pricing | 2–3 days |
| 6 | Booking workflow and passenger management | 3–4 days |
| 7 | Booking dashboard and admin operations | 2–3 days |
| 8 | AI travel assistant | 2–3 days |
| 9 | Testing, security, deployment, documentation | 3–4 days |

**Estimated total: 21–30 working days.**

This is a development estimate, not a guaranteed delivery date. Supplier API access, sandbox restrictions, and booking workflow complexity can change the timeline.

---

# 13. MVP Acceptance Criteria

The MVP is ready for demonstration when:

- [ ] A customer can register and log in.
- [ ] A customer can search for flights.
- [ ] Flight results come from a configured sandbox supplier.
- [ ] Search results are normalized.
- [ ] A customer can inspect flight details.
- [ ] A customer can revalidate a fare.
- [ ] Price changes are displayed correctly.
- [ ] Passenger details can be submitted.
- [ ] A sandbox booking can be created where the provider supports it.
- [ ] Booking status is persisted.
- [ ] Duplicate submissions are prevented.
- [ ] Customers can view their bookings.
- [ ] Administrators can view and investigate bookings.
- [ ] Pricing rules can be configured.
- [ ] Multi-currency amounts are stored correctly.
- [ ] The AI assistant can search actual available offers through backend tools.
- [ ] AI cannot falsely confirm bookings.
- [ ] Payment is clearly identified as simulated or disabled.
- [ ] The application is deployed and publicly accessible.
- [ ] Automated tests cover the critical booking flow.
- [ ] API documentation is available.

---

# 14. Future Roadmap

## Phase 2 — Commercial travel platform

- Production supplier credentials.
- Multiple flight suppliers.
- Hotel supplier integration.
- Real payment gateway.
- Ticket issuance.
- Cancellation and refund workflows.
- Booking changes and reissuance.
- Supplier reconciliation.
- Email and SMS notifications.

## Phase 3 — B2B travel distribution

- Agency registration.
- Agency accounts.
- Agent dashboard.
- Agency-specific markups.
- Commission management.
- Credit limits.
- Sub-agents.
- Corporate accounts.
- White-label booking websites.
- Agency API access.

## Phase 4 — Advanced AI travel platform

- Conversational itinerary planning.
- Multi-city trip planning.
- Hotel and flight combinations.
- Personalized recommendations.
- Booking support agent.
- Travel disruption assistance.
- Rebooking suggestions.
- AI-powered customer support.
- Agentic workflows with explicit booking authorization.

## Phase 5 — Scale and infrastructure

Only when justified by usage:

- Redis caching.
- Background job processing.
- Message queues.
- Kafka or another event streaming platform.
- Dedicated search infrastructure.
- Service extraction.
- Advanced monitoring.
- Multi-region infrastructure.

---

# 15. Key Product and Technical Decisions

| Decision | MVP choice |
|---|---|
| Business model | Start with a customer-facing booking experience |
| Product architecture | Modular monolith |
| Primary travel product | Flights |
| Initial supplier | Amadeus sandbox, if eligible |
| Hotel functionality | Domain foundation, later integration |
| Payments | Simulated/disabled |
| AI | Optional assistant with backend tools |
| Database | PostgreSQL |
| Backend | Hono + TypeScript |
| Frontend | React + Vite |
| Hosting | Cloudflare |
| Authentication | Supabase Auth |
| ORM | Drizzle |
| Infrastructure budget | $0 initial |
| Deployment | GitHub-connected CI/CD |
| Docker | Not required |
| Microservices | Not required |

---

# 16. Product Success Metrics

Track the following from the beginning:

**Acquisition**
- Registered users.
- Active users.
- Search sessions.

**Search**
- Search success rate.
- Supplier response time.
- Search-to-offer conversion.

**Booking**
- Offer-to-booking conversion.
- Booking confirmation rate.
- Booking failure rate.
- Duplicate booking attempts.
- Price-change frequency.

**AI**
- Assistant usage.
- Successful search tool calls.
- AI-assisted search conversion.
- Incorrect or unsupported response rate.

**Operations**
- Supplier uptime.
- API error rate.
- Average booking processing time.
- Reconciliation backlog.

Do not treat simulated bookings or estimated revenue as real commercial transactions.

---

# 17. Final MVP Recommendation

Build the first release as a **flight-first, AI-assisted travel booking platform with a supplier-independent booking engine**.

The most important engineering priorities are:

1. Supplier integration and normalization.
2. Flight search and offer management.
3. Fare revalidation.
4. Reliable booking state management.
5. Passenger information handling.
6. Pricing and currency calculations.
7. Admin visibility and reconciliation.
8. AI assistance on top of real backend capabilities.

Avoid spending the first month building a complex microservices architecture, a large hotel catalog, or a sophisticated AI agent before the core booking lifecycle works.

**The first successful milestone should be simple: a user searches for a real sandbox flight, selects an offer, verifies its price, submits passenger information, creates a supplier-backed sandbox booking, and sees the correct booking status in both the customer and admin dashboards.**

That is the foundation on which the larger travel platform can be built.