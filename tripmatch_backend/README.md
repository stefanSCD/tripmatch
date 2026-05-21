# Tripmatch Backend

Tripmatch Backend is a Spring Boot REST API for trip planning and travel agency matching.
It lets travelers build trips, publish travel requests, receive agency offers, and manage the
final acceptance flow in a safe way under concurrency.

## What the Application Does

- User registration/login and role-based access (`USER`, `AGENCY`, `ADMIN`)
- Trip planning: trips, destinations, activities, and budget tracking
- Publish/unpublish travel requests from trips
- Agency offer lifecycle: create, edit, send, accept, reject
- Notification center (list, unread count, mark as read)
- Admin moderation: approve agencies, block/unblock accounts
- AI-assisted trip drafting and conversion into real trip data

## Tech Stack

- Java 21
- Spring Boot 4.0.4
- Spring Web MVC
- Spring Security (HTTP Basic)
- Spring Data JPA + Hibernate
- PostgreSQL
- Flyway migrations
- Spring Validation
- SpringDoc OpenAPI (Swagger UI)
- Maven
- OpenAI Responses API (JSON-schema constrained output)

## Beyond Basic CRUD

Some flows are intentionally more domain-driven than simple CRUD:

- Offer status workflow with business states: `DRAFT`, `READY`, `SENT`, `ACCEPTED`,
  `REJECTED`, `EXPIRED`
- Strong role and approval gates (agencies must be approved/active before core actions)
- Cross-entity state transitions:
  - accepting an offer updates all related offers
  - accepted request updates request/trip statuses
  - unpublishing a request expires active offers
- Activity planning rules:
  - overlap detection for activities (with optional override)
  - day-aware reordering via `displayOrder`
  - activity duplication with date/time override
- Budget analytics, not just storage:
  - estimated totals computed from activities
  - per-category allocated/estimated/spent progress
- AI draft workflow:
  - generate itinerary drafts with strict JSON schema
  - regenerate a specific day
  - edit draft and persist it as Trip + Destinations + Activities

## Transactions and Pessimistic Locking

### Transaction approach

- Write operations are grouped in service-layer `@Transactional` methods.
- Read-heavy operations use `@Transactional(readOnly = true)` where needed.
- Multi-step operations keep consistency across multiple entities in one transaction
  (offer + request + trip + notifications, etc.).

### Pessimistic lock strategy (critical concurrency point)

The key race condition is offer acceptance for the same request.

- `OfferRepository.findByRequestIdForUpdate(...)` uses `@Lock(PESSIMISTIC_WRITE)`.
- In `OfferService.acceptOffer(...)`, all offers for that request are locked first.
- Inside the same transaction, the service:
  1. Validates that no other offer was accepted in parallel
  2. Marks the selected offer as `ACCEPTED`
  3. Marks other competing offers as `REJECTED`/`EXPIRED`
  4. Updates request/trip to `ACCEPTED`
  5. Emits notifications

This prevents double-accept and keeps the final state deterministic under concurrent requests.

## Running Locally

### Prerequisites

- JDK 21
- PostgreSQL (local or remote)

### Environment Variables

The app reads `.env` (via `spring.config.import`) and also supports normal env vars:

- `DB_URL` (default: `jdbc:postgresql://localhost:5432/tripmatch`)
- `DB_USERNAME` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `OPENAI_API_KEY` (required for OpenAI client initialization)
- `OPENAI_BASE_URL` (optional, default: `https://api.openai.com/v1`)
- `OPENAI_MODEL` (optional, default: `gpt-5.4-mini`)

### Start the App

```bash
# Windows
mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

Flyway migrations are applied automatically at startup.

### API Docs

- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Local Admin Seed

On startup, if missing, the app seeds one admin account:

- email: `admin@yahoo.com`
- password: `Admin12345`

