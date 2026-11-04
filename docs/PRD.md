# PRD: Travel Booking Platform — MVP

**Document status:** Development-ready MVP specification  
**Version:** 1.0  
**Product stage:** Initial MVP  
**Initial development budget:** $0  
**Primary objective:** Build a functional, demonstrable flight booking platform that establishes the technical foundation for a future multi-supplier travel technology business.

---

## 1. Product Overview

### 1.1 Product Vision

Build a flight-first travel booking platform that allows customers to search flights, select fares, provide passenger information, complete a simulated payment, and manage their bookings.

The platform also supports travel agencies. Agency owners can invite customers, associate customers with their agency, and create bookings on behalf of those customers.

The backend provides a supplier-independent booking architecture, pricing calculations, booking lifecycle management, payment reconciliation, and administrative ticket fulfillment.

The initial implementation uses a deterministic mock flight supplier and simulated payment processing. The architecture must allow real suppliers and payment providers to be introduced later without redesigning the entire application.

### 1.2 Product Objectives

1. Deliver a complete flight search-to-booking experience.
2. Support direct customers and agency-assisted customer bookings.
3. Demonstrate a reliable booking lifecycle.
4. Establish supplier-independent integration boundaries.
5. Demonstrate pricing and markup calculations.
6. Handle payment failures and reconciliation safely.
7. Provide administrative control over booking fulfillment.
8. Build a deployable application with zero initial infrastructure expenditure.

### 1.3 Success Criteria

The MVP is successful when:

- A customer can register and search available flights.
- A customer can select a flight and complete the booking workflow.
- An agency owner can invite a customer and book on their behalf.
- The same customer cannot accidentally become associated with multiple agencies.
- The system can calculate and persist the correct customer-facing price.
- Duplicate booking requests do not create duplicate reservations.
- Payment failures can be retried and reconciled.
- Booking confirmation generates a unique internal booking reference and mock PNR.
- An administrator can complete ticket issuance.
- Administrators can investigate uncertain supplier outcomes.
- Users can request cancellation according to their permissions.
- Mock inventory is visibly distinguished from any future real inventory.
- The application can be deployed using free-tier services.

---

## 2. Scope and Product Boundaries

### 2.1 Included in MVP

| Area | Included functionality |
|---|---|
| Authentication | Registration, login, logout, session management |
| Customer | Customer profile and traveler information |
| Agency | Agency owner account and customer invitations |
| Agency association | One agency relationship per customer |
| Flight search | One-way and round-trip |
| Flight inventory | Deterministic mock flight supplier |
| Flight results | Search results, itinerary, fare and baggage information |
| Pricing | Base fare, markup and final customer price |
| Booking | Passenger details and booking creation |
| Payment | Simulated payment processing |
| Reconciliation | Retry and reconciliation of uncertain payment/booking outcomes |
| Reservation | Internal reservation and mock PNR |
| Ticketing | Supplier-style simulated fulfillment with admin exception handling |
| Cancellation | Customer/authorized agency agent cancellation requests |
| Administration | Booking, user, agency and ticketing operations |
| Audit | Booking and administrative action history |

### 2.2 Explicitly Excluded

The following features must not be developed in the initial MVP:

- Real airline ticket purchases.
- Live Amadeus, Sabre or Travelport bookings.
- Live airline inventory.
- Live hotel inventory or accommodation bookings.
- Real payment capture.
- Real refunds or financial settlement.
- Agency wallets and credit limits.
- Commission settlement and agent payouts.
- Multi-supplier live search aggregation.
- Automated airline reissues or itinerary changes.
- Mobile applications.
- White-label agency websites.
- Loyalty and reward programs.
- Travel insurance.
- Visa processing.
- Tours, activities and car rentals.
- AI chatbot or autonomous AI booking.
- Advanced analytics and business intelligence.

These features may be evaluated after the MVP has been demonstrated and the business requirements are confirmed.

---

## 3. User Roles and Permissions

The MVP contains three application roles.

### 3.1 Customer

A customer can:

- Register and log in.
- Manage their profile.
- Search flights.
- View flight details and prices.
- Select flights.
- Enter passenger details.
- Complete simulated checkout.
- View their bookings.
- View booking details and PNR.
- Request cancellation.
- View booking status and relevant notifications.
- Accept or reject an agency invitation.

A customer can be associated with no more than one agency at a time.

### 3.2 Agency Owner

An agency owner can:

- Register an agency account.
- Manage basic agency information.
- Invite existing or prospective customers.
- View associated customers.
- Book flights on behalf of associated customers.
- View bookings created through their agency.
- View booking status.
- Request cancellation for bookings they are authorized to manage.

The agency owner can make bookings on behalf of associated customers.

An agency owner cannot access unrelated customers or another agency's records.

### 3.3 Administrator

An administrator can:

- View platform users.
- View agencies.
- View customer-agency associations.
- View all bookings.
- Inspect booking lifecycle events.
- Inspect payment attempts.
- Retry or reconcile eligible failed transactions.
- Inspect uncertain reservation outcomes.
- Complete administrative ticket issuance.
- Review cancellation requests.
- Update operational booking statuses through authorized actions.
- View audit logs.

Administrator access must be protected by server-side role checks.

### 3.4 Permission Matrix

| Functionality | Customer | Agency owner | Admin |
|---|---:|---:|---:|
| Search flights | Yes | Yes | Yes |
| Book for self | Yes | Yes | Yes |
| Book for associated customer | No | Yes | Yes |
| View own bookings | Yes | Yes | Yes |
| View agency bookings | No | Yes | Yes |
| View all bookings | No | No | Yes |
| Invite customers | No | Yes | No |
| Accept agency invitation | Yes | No | No |
| Request cancellation | Yes | Yes, authorized bookings | Yes |
| Issue tickets | No | No | Yes |
| Reconcile payment | No | No | Yes |
| Manage users | No | Limited agency customers | Yes |

All permissions must be enforced by the backend, not merely hidden in the frontend.

---

## 4. Customer and Agency Relationship

### 4.1 Relationship Rules

1. A customer may have one active agency association.
2. An agency can have multiple associated customers.
3. Association requires an invitation and customer acceptance.
4. A customer must explicitly consent before transitioning from an independent B2C customer to an agency-associated customer.
5. An agency owner may create bookings for an associated customer.
6. An agency must not gain access to bookings belonging to customers outside its association.
7. Agency association must not automatically transfer ownership of a customer's existing bookings.
8. A customer's own bookings and agency-created bookings must remain distinguishable.

### 4.2 Invitation Workflow

1. Agency owner enters a customer's email address.
2. Platform creates an invitation with a unique secure token.
3. Platform stores the invitation against the agency and intended customer.
4. Customer receives or accesses the invitation.
5. Customer authenticates or registers.
6. Customer reviews the agency association.
7. Customer accepts or rejects the invitation.
8. Upon acceptance, the platform establishes the association.
9. The invitation becomes consumed and cannot be reused.

An invitation must expire after a configurable period. The initial default can be seven days.

### 4.3 Existing B2C Customer Transition

When an existing independent customer receives an agency invitation:

- The customer remains independent until accepting.
- Acceptance requires explicit consent.
- The existing customer account is reused.
- No duplicate customer account is created.
- Existing bookings remain under their original ownership.
- A customer cannot accept an invitation if already associated with another agency.

The customer must leave or terminate an existing association through an authorized workflow before joining another agency. If this workflow is not included in the MVP, the application must prevent the second association and direct the user to contact an administrator.

---

## 5. Flight Search and Inventory

### 5.1 Search Types

The MVP supports:

**One-way search**
- Origin
- Destination
- Departure date
- Passenger count
- Cabin class

**Round-trip search**
- Origin
- Destination
- Departure date
- Return date
- Passenger count
- Cabin class

Multi-city search is excluded.

### 5.2 Search Validation

- Origin and destination must be different.
- Departure date must not be in the past.
- Return date must be later than departure date.
- Passenger count must be within the configured limit.
- Required fields must be validated on both frontend and backend.
- Unsupported routes must return a meaningful empty-results response.

### 5.3 Mock Flight Inventory

The MVP uses a deterministic mock supplier.

It should contain realistic sample data covering:

- Multiple airlines.
- Multiple routes.
- Different departure times.
- Different arrival times.
- Direct and connecting flights.
- Different cabin classes.
- Different fare prices.
- Baggage allowance.
- Flight duration.
- Aircraft information where available in fixtures.

Mock inventory must be predictable and reproducible.

Repeated searches with the same search parameters should return consistent results unless an explicitly configured fixture variation is used.

### 5.4 Flight Result Display

Each result should show:

- Airline name and logo or text identifier.
- Flight number.
- Origin and destination.
- Departure and arrival times.
- Departure and arrival airports.
- Flight duration.
- Stop count.
- Layover information where applicable.
- Cabin class.
- Baggage allowance.
- Base fare.
- Customer-facing fare.
- Inventory source.

### 5.5 Inventory Separation

The platform must distinguish mock inventory from real supplier inventory.

For the MVP:

- Only mock inventory is enabled.
- Every mock result must display a clear demo/mock indicator.
- Mock and real inventory must never be silently merged.
- Future real inventory must be presented as a separate source or explicitly identified section.
- A booking must retain its inventory source permanently.

No production availability claims may be made using mock data.

---

## 6. Supplier Integration Architecture

### 6.1 Supplier Abstraction

The application must not couple its business logic directly to a particular supplier.

Create a supplier adapter interface responsible for:

- Flight search.
- Flight details.
- Fare validation.
- Reservation creation.
- Reservation status lookup.
- Ticket issuance where supported.
- Cancellation where supported.

The initial implementation provides a mock adapter.

### 6.2 Mock Supplier

The mock supplier must simulate:

- Successful search.
- Empty search results.
- Price changes.
- Availability changes.
- Successful reservation.
- Reservation failure.
- Reservation timeout with uncertain outcome.
- Successful ticket issuance.
- Ticket issuance failure.
- Successful cancellation response.

Failure scenarios must be configurable in development or test environments.

### 6.3 Future Integration Boundary

The architecture should permit future Amadeus or other supplier adapters.

However:

- No production GDS connection is required.
- No live supplier credentials are required.
- No live ticket issuance is implemented.
- No supplier-specific functionality should be falsely presented as operational.

### 6.4 Supplier Inventory Identification

Every inventory item must retain:

- Supplier identifier.
- Supplier inventory reference.
- Inventory source type.
- Supplier fare reference where available.
- Search timestamp.
- Price currency.
- Price snapshot.
- Availability validation timestamp.

---

## 7. Pricing and Markup

### 7.1 Pricing Rule

The platform uses the supplier's base fare as the markup calculation base.

Formula:

`Customer Price = Base Fare + Markup + Applicable Platform Fee`

The MVP only needs base fare and configured markup.

No tax engine or complex market-specific fee engine is required.

### 7.2 Markup Configuration

For the initial MVP:

- A platform administrator can configure the default markup.
- Markup is applied to the supplier base fare.
- Markup is stored separately from the base fare.
- The customer sees the final price.
- The booking stores an immutable price snapshot.

### 7.3 Price Snapshot

Every booking must retain:

- Supplier base fare.
- Supplier currency.
- Markup amount.
- Markup calculation rule.
- Customer-facing amount.
- Customer currency.
- Conversion rate if conversion is implemented.
- Price calculation timestamp.

The system must not recalculate old booking prices using newly configured markup values.

### 7.4 Currency Scope

To keep the MVP within the $0 budget:

- One configured platform currency is used initially.
- All demo flight prices use that currency.
- No live FX integration is required.
- Currency conversion and multiple market pricing are future capabilities.

---

## 8. Booking and Reservation Management

### 8.1 Booking Workflow

1. Customer or authorized agency owner searches flights.
2. User selects a flight.
3. User reviews the selected itinerary and fare.
4. User enters passenger information.
5. Backend validates the selected inventory.
6. Backend creates a booking in an initial pending state.
7. Backend calculates and snapshots the price.
8. Simulated payment processing begins.
9. The supplier adapter receives a reservation request.
10. The reservation result is processed.
11. A successful reservation generates an internal booking reference and mock PNR.
12. Booking moves to `CONFIRMED`.
13. Ticket fulfillment is initiated.
14. Administrative fulfillment or simulated supplier fulfillment moves the booking to `TICKETED`.

The implementation must ensure that payment and reservation operations cannot create duplicate bookings through repeated requests.

### 8.2 Booking Reference

Every booking must have:

- Unique internal booking ID.
- Human-readable booking reference.
- Passenger information.
- Customer owner.
- Booking creator.
- Agency ID when applicable.
- Inventory source.
- Supplier reference.
- PNR when reservation is successful.
- Booking price snapshot.
- Current status.
- Creation and update timestamps.

### 8.3 Booking Ownership

Each booking must distinguish:

- The customer for whom the travel is booked.
- The authenticated user who initiated the booking.
- The associated agency, when applicable.

For an agency-created booking:

- Customer remains the travel beneficiary and booking owner.
- Agency owner is recorded as the booking creator.
- Agency association is captured at booking time.
- The booking must remain linked to the original agency for audit purposes.

### 8.4 Idempotency

Every booking creation and payment operation must support idempotency.

Requirements:

- Repeated requests using the same idempotency key must not create another booking.
- A repeated payment request must not create a duplicate payment attempt or charge.
- A retry must reference the existing operation.
- Booking and payment operations must be independently auditable.

---

## 9. Payment Processing

### 9.1 MVP Payment Scope

The MVP uses simulated payment processing only.

There will be no real money movement.

The interface should demonstrate:

- Payment initiation.
- Successful payment.
- Failed payment.
- Pending payment.
- Payment retry.
- Reconciliation.

### 9.2 Payment States

- `PENDING`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `UNKNOWN`
- `RECONCILED`

### 9.3 Payment Capture Failure

The selected recovery strategy is retry and reconciliation.

When payment capture fails or the result is uncertain:

1. Do not assume the transaction failed permanently.
2. Inspect the existing payment operation.
3. Check whether the payment was successfully processed.
4. Reconcile the transaction.
5. Retry only when it is safe to do so.
6. Avoid duplicate charges or duplicate bookings.
7. Keep unresolved operations in a visible pending/unknown state.
8. Allow administrative investigation.

### 9.4 Financial Integrity

- Payment attempts must be stored independently.
- Payment references must be unique.
- Booking totals must match their immutable price snapshots.
- Payment operations must be idempotent.
- All reconciliation actions must be recorded.

---

## 10. Ticket Fulfillment

### 10.1 Fulfillment Strategy

The intended behavior is automated supplier ticketing where supported, with administrative intervention when necessary.

Since the MVP uses a mock supplier, it must simulate this behavior.

### 10.2 Ticket Issuance Workflow

1. Reservation is confirmed.
2. Ticket fulfillment begins through the supplier adapter.
3. If the adapter reports successful issuance, the booking becomes `TICKETED`.
4. If the adapter reports an exception or unsupported operation, the booking enters an administrative fulfillment queue.
5. An administrator reviews the booking.
6. The administrator performs simulated ticket issuance.
7. The system generates a mock 13-digit ticket number.
8. Ticket issuance is recorded in the booking history.
9. The booking becomes `TICKETED`.

### 10.3 Ticket Record

Store:

- Ticket ID.
- Booking ID.
- Passenger ID.
- Ticket number.
- Issuance method.
- Issuance timestamp.
- Issued by.
- Fulfillment source.

All mock ticket numbers must be clearly identified as demo data and must never be represented as valid airline tickets.

---

## 11. Cancellation Management

### 11.1 MVP Scope

The MVP supports cancellation requests, not actual airline cancellation or financial refunds.

### 11.2 Cancellation Permissions

- A customer may request cancellation of their own booking.
- An agency owner may request cancellation for an authorized booking associated with their agency.
- An administrator may review and manage cancellation requests.

### 11.3 Cancellation Workflow

1. Authorized user opens the booking.
2. User submits a cancellation request.
3. User provides a cancellation reason.
4. Booking enters `CANCELLATION_PENDING`.
5. Request is recorded in the audit history.
6. Administrator reviews the request.
7. Administrator records the simulated cancellation outcome.
8. If approved, booking becomes `CANCELLED`.
9. If rejected, the booking returns to its previous eligible state and the decision is recorded.

No automatic refund or airline cancellation is performed.

---

## 12. Administration Panel

### 12.1 Dashboard

Display:

- Total users.
- Total agencies.
- Total bookings.
- Confirmed bookings.
- Ticketed bookings.
- Pending bookings.
- Failed payment attempts.
- Pending cancellation requests.
- Bookings requiring operational intervention.

All metrics must be derived from actual application records.

### 12.2 Booking Management

Administrators can:

- Search bookings by reference.
- Filter bookings by status.
- Inspect booking details.
- View passenger information.
- View pricing breakdown.
- View reservation information.
- View payment history.
- View ticket information.
- Inspect booking event history.
- Perform authorized operational actions.

### 12.3 Ticketing Operations

Provide an operational queue containing bookings that require administrative fulfillment.

The administrator can:

- Inspect the reservation.
- Review passenger information.
- Issue a mock ticket.
- Record the issuance result.
- View the audit trail.

### 12.4 Payment Operations

Provide a payment operations view showing:

- Payment reference.
- Booking reference.
- Payment amount.
- Payment status.
- Attempt count.
- Failure reason.
- Reconciliation status.

### 12.5 Agency Management

Administrators can:

- View agencies.
- View agency owners.
- View associated customers.
- View agency bookings.
- Inspect invitation status.

---

## 13. Notifications

The MVP should use in-app notifications and booking status messages.

Events include:

- Agency invitation created.
- Agency invitation accepted.
- Booking created.
- Payment succeeded.
- Payment failed.
- Booking confirmed.
- Ticket issued.
- Cancellation requested.
- Cancellation approved or rejected.

External SMS and paid notification providers are excluded.

Email notifications can be added only if an available free service is configured without creating an initial expense. They are not a release blocker.

---

## 14. Data Model

The following are the initial logical entities.

### 14.1 Identity and Organization

**users**
- id
- email
- password/auth provider reference
- role
- account status
- created_at
- updated_at

**customer_profiles**
- id
- user_id
- first_name
- last_name
- phone
- created_at
- updated_at

**agencies**
- id
- name
- owner_user_id
- status
- created_at
- updated_at

**agency_memberships**
- id
- agency_id
- customer_user_id
- status
- accepted_at
- created_at

**agency_invitations**
- id
- agency_id
- email
- invitation_token_hash
- status
- expires_at
- accepted_at
- created_at

### 14.2 Travel and Inventory

**airports**
- id
- iata_code
- name
- city
- country

**airlines**
- id
- code
- name

**flight_offers**
- id
- supplier_id
- supplier_offer_reference
- origin_airport_id
- destination_airport_id
- departure_at
- arrival_at
- base_fare
- currency
- cabin_class
- inventory_source
- expires_at
- created_at

**flight_segments**
- id
- flight_offer_id
- airline_id
- flight_number
- origin_airport_id
- destination_airport_id
- departure_at
- arrival_at
- baggage_allowance

**suppliers**
- id
- name
- supplier_type
- enabled
- configuration

### 14.3 Booking

**bookings**
- id
- booking_reference
- customer_user_id
- created_by_user_id
- agency_id
- supplier_id
- inventory_source
- supplier_booking_reference
- pnr
- booking_status
- currency
- base_fare
- markup_amount
- total_amount
- idempotency_key
- created_at
- updated_at

**booking_passengers**
- id
- booking_id
- passenger_type
- first_name
- last_name
- date_of_birth
- passport_details_reference where applicable

**booking_events**
- id
- booking_id
- event_type
- previous_status
- new_status
- actor_user_id
- metadata
- created_at

### 14.4 Payments and Fulfillment

**payments**
- id
- booking_id
- payment_reference
- amount
- currency
- payment_status
- provider_type
- created_at
- updated_at

**payment_attempts**
- id
- payment_id
- attempt_number
- idempotency_key
- result
- failure_reason
- reconciliation_status
- created_at

**tickets**
- id
- booking_id
- passenger_id
- ticket_number
- issuance_method
- issuance_status
- issued_by
- issued_at

**cancellation_requests**
- id
- booking_id
- requested_by
- reason
- status
- reviewed_by
- reviewed_at
- created_at

**audit_logs**
- id
- actor_user_id
- action
- entity_type
- entity_id
- metadata
- created_at

### 14.5 Data Integrity

- Use foreign keys.
- Use unique constraints for booking references, invitation tokens, and payment references.
- Enforce one active agency association per customer at the database level.
- Store monetary amounts using decimal/numeric types, not floating-point values.
- Use UTC timestamps.
- Store sensitive passenger information with appropriate access restrictions.
- Never store raw payment card information.

The final database schema should be adjusted during implementation, but the domain boundaries must be maintained.

---

## 15. Technical Architecture

### 15.1 Architecture Style

Use a modular monolith structured as an npm workspaces monorepo:
- `apps/web`: Frontend SPA (React + Vite + Tailwind CSS)
- `apps/api`: Backend REST API (Hono on Cloudflare Workers)
- `packages/shared`: Shared TypeScript types, Zod schemas, constants, and mock supplier fixtures
- `packages/db`: Supabase PostgreSQL schema, migrations, Drizzle ORM client, and seed scripts

The MVP does not require microservices.

Recommended backend domain modules:

- Authentication & Identity
- Users & Customer Profiles
- Agencies & Invitations
- Flight Search
- Inventory & Deterministic Mock Supplier
- Pricing Engine & Snapshots
- Bookings & Reservations
- Simulated Payments & Reconciliation
- Ticketing & Operations Queue
- Cancellations & Review
- Administration & Metrics Dashboard
- In-App Notifications
- Audit Logging

Modules should communicate through clear service interfaces.

### 15.2 Recommended Technology Stack

| Layer | Technology |
|---|---|
| Monorepo / Workspaces | npm workspaces |
| Frontend | React + Vite |
| Language | TypeScript |
| UI | Tailwind CSS |
| Backend | Cloudflare Workers |
| API framework | Hono |
| Database | Supabase PostgreSQL (Free Tier) |
| Authentication | Supabase Auth |
| Database access / ORM | Drizzle ORM + Supabase client / connection pooler |
| Validation | Zod (shared across frontend & backend) |
| API documentation | OpenAPI |
| Testing | Vitest |
| Frontend deployment | Cloudflare Pages |
| Backend deployment | Cloudflare Workers |
| Source control | GitHub |
| AI development assistance | Existing free/local tools and available subscriptions |

### 15.3 Deployment Architecture

Frontend:
- Deploy React application to Cloudflare Pages.
- Use the free `pages.dev` subdomain initially.

Backend:
- Deploy TypeScript API to Cloudflare Workers.
- Use the free `workers.dev` subdomain initially.

Database and authentication:
- Use a Supabase free-tier project.
- Configure database migrations and environment variables.

No paid hosting, domain, database, API, or payment service is required for the initial demo.

Free-tier limits and provider policies must be checked before deployment. $0 is the target, not a guarantee of unlimited production capacity.

### 15.4 Backend Design Principles

- REST API.
- Strict input validation.
- Server-side authorization.
- Modular service boundaries.
- Database transactions where appropriate.
- Idempotent booking and payment operations.
- Consistent error responses.
- Structured logging.
- Audit history for critical operations.
- Retry-safe asynchronous processing.

Do not introduce Kafka, Kubernetes, or a distributed microservice infrastructure for this MVP.

---

## 16. API Requirements

Suggested REST endpoints:

### Authentication
- Authentication handled by Supabase Auth.
- `GET /api/v1/me`

### Customer
- `GET /api/v1/customers/me`
- `PATCH /api/v1/customers/me`

### Agency
- `POST /api/v1/agencies`
- `GET /api/v1/agencies/me`
- `POST /api/v1/agencies/invitations`
- `GET /api/v1/agencies/invitations`
- `POST /api/v1/agencies/invitations/:id/accept`
- `POST /api/v1/agencies/invitations/:id/reject`
- `GET /api/v1/agencies/customers`
- `GET /api/v1/agencies/bookings`

### Flight Search
- `GET /api/v1/flights/search`
- `GET /api/v1/flights/:offerId`

### Booking
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/:bookingId`
- `POST /api/v1/bookings/:bookingId/cancellation-requests`

### Payment
- `POST /api/v1/bookings/:bookingId/payment`
- `GET /api/v1/bookings/:bookingId/payments`
- `POST /api/v1/payments/:paymentId/reconcile`

### Administration
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/bookings`
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/ticketing-queue`
- `POST /api/v1/admin/bookings/:bookingId/issue-ticket`
- `GET /api/v1/admin/agencies`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/audit-logs`

All endpoints must enforce authentication, authorization, validation, and appropriate ownership checks.

---

## 17. Security Requirements

- Use Supabase Auth for identity.
- Enforce role-based authorization on the backend.
- Apply database-level Row Level Security where appropriate.
- Do not expose service-role credentials to the frontend.
- Validate every external input.
- Hash invitation tokens before storing them.
- Restrict access to passenger information.
- Avoid logging passwords, tokens, or sensitive passenger information.
- Use secure HTTP-only cookie handling or a correctly configured authentication flow.
- Protect administrative endpoints.
- Use idempotency keys for critical operations.
- Maintain audit logs for privileged actions.

---

## 18. Testing Requirements

### Authentication
- Customer registration.
- Login and logout.
- Unauthorized access.
- Role-based access restrictions.

### Agency
- Create agency.
- Invite customer.
- Accept invitation.
- Reject invitation.
- Prevent duplicate associations.
- Prevent unauthorized customer access.
- Prevent customer transition without consent.

### Flight Search
- One-way search.
- Round-trip search.
- Invalid dates.
- Same origin and destination.
- Empty results.
- Different passenger counts.

### Booking
- Successful booking.
- Invalid passenger data.
- Price change.
- Availability change.
- Duplicate booking request.
- Reservation timeout.
- Uncertain supplier result.

### Payment
- Successful payment.
- Failed payment.
- Pending payment.
- Retry.
- Reconciliation.
- Duplicate payment request.

### Ticketing
- Simulated automatic supplier issuance.
- Supplier issuance exception.
- Administrative issuance.
- Duplicate ticket issuance prevention.

### Cancellation
- Customer cancellation request.
- Authorized agency cancellation request.
- Unauthorized cancellation request.
- Administrator approval.
- Administrator rejection.

### Release Quality
- No cross-agency data leakage.
- No duplicate reservations from retries.
- No duplicate payment processing.
- Correct price snapshots.
- Correct booking event history.
- Responsive frontend.
- Successful production deployment.

---

## 19. Development Milestones

### Milestone 1: Project Foundation
- Initialize repository.
- Configure frontend and backend.
- Configure Supabase.
- Establish database migrations.
- Configure authentication.
- Establish application layouts.
- Establish coding conventions.

### Milestone 2: User and Agency Management
- Customer profiles.
- Agency creation.
- Agency invitation.
- Customer consent and association.
- Role-based authorization.

### Milestone 3: Flight Search
- Airport and airline fixtures.
- Mock supplier adapter.
- One-way and round-trip search.
- Flight results and details.
- Mock inventory indicators.

### Milestone 4: Booking Engine
- Passenger information.
- Price calculation.
- Price snapshots.
- Booking creation.
- Idempotency.
- Mock reservation.
- PNR generation.

### Milestone 5: Payments and Fulfillment
- Simulated payment provider.
- Payment attempts.
- Retry and reconciliation.
- Ticketing workflow.
- Administrative ticket issuance.

### Milestone 6: Admin and Cancellation
- Admin dashboard.
- Booking management.
- Payment operations.
- Ticketing queue.
- Cancellation requests.
- Audit history.

### Milestone 7: Testing and Deployment
- Automated tests.
- Security checks.
- End-to-end user journeys.
- Deployment.
- Seed data.
- Demo preparation.

---

## 20. Definition of Done

The MVP is ready for demonstration when the following end-to-end scenarios work.

### Scenario A: Direct Customer Booking

1. Customer registers.
2. Customer logs in.
3. Customer searches a flight.
4. Customer selects an itinerary.
5. Customer enters passenger details.
6. Customer completes simulated payment.
7. System creates a confirmed reservation.
8. System generates a PNR.
9. Admin issues a mock ticket.
10. Customer views the ticket and booking details.

### Scenario B: Agency-Assisted Booking

1. Agency owner registers.
2. Agency owner creates an agency.
3. Agency owner invites a customer.
4. Customer accepts the invitation.
5. Customer becomes associated with the agency.
6. Agency owner searches flights.
7. Agency owner books for the associated customer.
8. System records the customer as booking owner and agency owner as creator.
9. Booking completes through the same reservation and payment lifecycle.
10. Both authorized parties can view the booking.

### Scenario C: Payment Failure and Recovery

1. Customer starts booking.
2. Simulated payment enters a failure or uncertain state.
3. System does not create a duplicate reservation.
4. Reconciliation checks the existing transaction.
5. Retry is allowed only when safe.
6. Final state is persisted and audited.
7. Administrator can investigate unresolved outcomes.

### Scenario D: Supplier Exception and Ticketing

1. Reservation succeeds.
2. Mock supplier reports a ticketing exception.
3. Booking enters the administrative fulfillment queue.
4. Admin reviews the booking.
5. Admin issues the mock ticket.
6. Booking becomes `TICKETED`.
7. Ticket issuance is visible in booking history.

### Scenario E: Cancellation Request

1. Customer or authorized agency owner opens an eligible booking.
2. User submits cancellation request.
3. Booking becomes `CANCELLATION_PENDING`.
4. Admin reviews the request.
5. Admin approves or rejects.
6. The final decision is recorded in the audit history.

---

## 21. $0 Cost Development Policy

The following rules are mandatory for the initial MVP.

1. Use free-tier hosting.
2. Use free-tier database and authentication.
3. Use open-source libraries.
4. Use local development environments.
5. Use deterministic mock supplier data.
6. Use simulated payments.
7. Do not purchase GDS access.
8. Do not purchase commercial API access.
9. Do not purchase an initial domain.
10. Do not purchase an AI API subscription for the MVP.
11. Do not introduce paid monitoring or analytics.
12. Do not introduce infrastructure that is unnecessary for the initial demo.

The application must be designed so that supplier credentials and payment credentials can be added through secure environment configuration later.

---

## 22. Future Product Considerations (Not MVP Requirements)

These are intentionally outside the initial implementation:

- Amadeus integration.
- Sabre integration.
- Travelport integration.
- Real airline inventory.
- Real ticket issuance.
- Hotel and accommodation suppliers.
- Live payment gateways.
- Multi-currency conversion.
- Market-specific pricing.
- Agency commission management.
- Agency wallet and credit facilities.
- Real cancellation and refund integrations.
- AI-powered natural-language travel search.
- AI itinerary planning.
- Advanced analytics.

These should be introduced only after the business requirements, supplier agreements, and technical feasibility are established.

---

## 23. Final Product Definition

The MVP is a flight-first travel booking application with two customer acquisition and booking channels:

1. Direct B2C customer booking.
2. Agency-assisted customer booking.

Both channels use the same centralized booking engine, pricing rules, reservation workflow, payment simulation, and ticket fulfillment system.

The product will initially operate entirely on mock flight inventory and simulated payment processing, while maintaining clear integration boundaries for future GDS, airline, supplier, and payment provider connections.

The objective is not to simulate an entire mature OTA business. It is to demonstrate a reliable and extensible foundation for the core travel booking business.

**Final engineering principle: Build the real application architecture, simulate only the external services that cannot be accessed for free.**