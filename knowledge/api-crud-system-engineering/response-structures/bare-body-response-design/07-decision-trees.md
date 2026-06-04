# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Bare Body Response Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Bare Body vs Envelope Selection

---

### Decision Context

Choosing between bare-body and envelope response formats for a given API endpoint based on consumer type, bandwidth requirements, and extensibility needs.

---

### Decision Criteria

* architectural
* security
* maintainability
* performance

---

### Decision Tree

Are all API consumers known and controlled by the same team?
├── YES → Is bandwidth or payload size a primary concern?
│   ├── YES → Is the endpoint a public-facing API?
│   │   ├── YES → Use Envelope (gateway adds wrapper)
│   │   └── NO → Use Bare Body for internal microservice
│   └── NO → Does the API need to evolve the response shape without breaking clients?
│       ├── YES → Use Envelope
│       └── NO → Use Bare Body
└── NO → Are the consumers internal (BFF/gateway architecture)?
    ├── YES → Use Bare Body internally, transform at gateway
    └── NO → Use Envelope for public/unknown consumers

---

### Rationale

Bare-body optimizes for payload efficiency (15-30% smaller) and serialization speed, but sacrifices extensibility. Envelope provides a stable wrapper key for metadata expansion, pagination, and versioning. The decision hinges on whether the team controls all consumers.

---

### Recommended Default

**Default:** Envelope for public APIs; Bare Body for internal microservices
**Reason:** Public APIs need envelope extensibility for schema evolution; internal APIs benefit from reduced overhead.

---

### Risks Of Wrong Choice

Bare-body on public APIs causes breaking changes on every schema modification. Envelope on internal APIs wastes bandwidth and adds unnecessary nesting.

---

### Related Rules

* Prefer Bare-Body Only for Known Consumers
* Mixing Wrapped and Bare Endpoints Creates Client Confusion

---

### Related Skills

* Implement Bare Body Response Design
* Envelope Response Design

---

---

## Pagination Strategy for Bare-Body Collections

---

### Decision Context

Determining how to transmit pagination metadata on bare-body collection endpoints where envelope wrappers are unavailable.

---

### Decision Criteria

* reliability
* maintainability
* architectural

---

### Decision Tree

Does the endpoint return paginated results?
├── YES → Does the client need total record count?
│   ├── YES → Use `Link` header (RFC 5988) + `X-Total-Count` header
│   └── NO → Use `Link` header only for page navigation
└── NO → No pagination headers needed (non-paginated collections)

Do clients need multiple page relation types (first, prev, next, last)?
├── YES → Include all four `Link` relation types
└── NO → Include only `next` and `prev` for minimal navigation

---

### Rationale

Without envelope metadata, pagination information moves entirely to HTTP headers. The `Link` header is the standard RFC 5988 mechanism for conveying page relations, while `X-Total-Count` provides the total record count that would otherwise appear in envelope metadata.

---

### Recommended Default

**Default:** Always include `Link` header with `first`, `prev`, `next`, `last`; add `X-Total-Count` if client needs totals
**Reason:** Consistent header-based pagination ensures clients can navigate without parsing the response body.

---

### Risks Of Wrong Choice

Omitting pagination headers leaves clients unable to build UI controls or navigate pages. Including `X-Total-Count` on every response adds a potentially expensive COUNT query.

---

### Related Rules

* Always Include Pagination Headers on Bare-Body Collections
* Use `Link` Header for Pagination

---

### Related Skills

* Pagination Link Headers
* Pagination Metadata Design

---

---

## Error Response Shape Standardization

---

### Decision Context

Defining a consistent error response structure for bare-body endpoints that lack a built-in error envelope.

---

### Decision Criteria

* reliability
* maintainability

---

### Decision Tree

Does the API have more than one endpoint?
├── YES → Is there a documented error schema shared across all endpoints?
│   ├── YES → Does every endpoint return the same error structure?
│   │   ├── YES → Enforce via integration tests
│   │   └── NO → Refactor to use a shared error response class
│   └── NO → Define a single `{message, errors}` structure and apply globally
└── NO → Single endpoint — document the error shape in API spec

Are error responses distinguishable from success responses by structure alone?
├── YES → Use status code as the primary signal, structure as secondary
└── NO → Ensure success and error shapes never overlap structurally

---

### Rationale

Bare-body lacks a built-in error envelope, so every error response must follow the same documented schema or clients cannot write generic error handling code. A shared `{message, errors}` structure provides consistency without adding wrapper overhead.

---

### Recommended Default

**Default:** `{ "message": "...", "errors": {...} }` with appropriate HTTP status code
**Reason:** This structure is Laravel's validation error format, familiar to most developers and supported by tooling.

---

### Risks Of Wrong Choice

Inconsistent error shapes force clients to write per-endpoint error parsing, increasing bug surface and reducing API usability.

---

### Related Rules

* Enforce a Consistent Error Schema Across All Endpoints
* Error Strings Instead of Objects Is an Anti-Pattern

---

### Related Skills

* RFC 9457 Problem Details
* Response Format Decision Framework
