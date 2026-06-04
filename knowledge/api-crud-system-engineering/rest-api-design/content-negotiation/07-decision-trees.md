# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** REST API Design
**Knowledge Unit:** Content Negotiation
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Response Format Negotiation Strategy

---

### Decision Context

Choosing between server-driven content negotiation (Accept header) and agent-driven negotiation (URL extension) for determining response format.

---

### Decision Criteria

* architectural
* maintainability
* performance

---

### Decision Tree

Does the API support multiple response formats (JSON, XML, CSV)?
├── YES → Use server-driven negotiation via Accept header
│   ├── Does the response format affect caching?
│   │   ├── YES → Set `Vary: Accept` to differentiate cache entries
│   │   └── NO → Include `Vary: Accept` anyway for correctness
│   └── Is quality-weighted selection needed?
│       ├── YES → Use `$request->prefers()` for RFC-compliant selection
│       └── NO → Use `$request->expectsJson()` for simple JSON check
└── NO → Is the API JSON-only?
    ├── YES → Simple Accept validation (return 406 for non-JSON) OR skip validation
    │   ├── Public API → Validate Accept header; return 406 for unsupported formats
    │   └── Internal API → Skip Accept validation (all consumers send JSON)
    └── NO → Use URL extension (`.json`, `.xml`) for format selection
        └── Simpler for clients but pollutes URL space

---

### Rationale

Server-driven negotiation via Accept header is more REST-correct and keeps URLs clean. JSON-only APIs may skip negotiation entirely, but public APIs should validate Accept to catch client misconfiguration early.

---

### Recommended Default

**Default:** JSON-only API with Accept header validation in middleware; return 406 for unsupported formats
**Reason:** Most APIs are JSON-only; explicit Accept validation catches client misconfiguration; `Vary: Accept` ensures correct caching.

---

### Risks Of Wrong Choice

No Accept validation silently serves JSON to XML-requesting clients. URL extension negotiation pollutes URL space and complicates routing. Missing `Vary: Accept` causes format mismatch from cache.

---

### Related Rules

* Validate Accept Header In Middleware
* Return JSON Error Responses For API Requests

---

### Related Skills

* Implement Content Negotiation
* CORS Design

---

---

## Content-Type Validation for Write Endpoints

---

### Decision Context

Deciding whether to validate the `Content-Type` header on POST/PUT/PATCH endpoints and how to handle unsupported request body formats.

---

### Decision Criteria

* security
* reliability

---

### Decision Tree

Does the endpoint accept a request body (POST, PUT, PATCH)?
├── YES → Validate `Content-Type` header
│   ├── Is JSON the only accepted format?
│   │   ├── YES → Reject with 415 for non-JSON Content-Type
│   │   │   Check: `$request->isJson()`
│   │   └── NO → Accept multiple formats; validate against allowlist
│   └── Are there security implications of accepting arbitrary Content-Type?
│       ├── YES → Strict validation — alternative formats may bypass validation rules
│       └── NO → Validate for correctness but allow flexibility
└── NO (GET/DELETE) → No Content-Type validation needed

Is the error format for 415 consistent with success format?
├── YES → Return RFC 9457 Problem Details
└── NO → Standardize — clients expect consistent error format

---

### Rationale

Accepting any `Content-Type` allows clients to send XML, form-data, or plain text payloads that bypass JSON validation rules. Malformed or alternative-format payloads may be parsed differently, leading to unexpected behavior or injection vulnerabilities.

---

### Recommended Default

**Default:** Validate `Content-Type` on all write endpoints; return 415 with RFC 9457 error for unsupported types
**Reason:** Content-Type validation prevents validation bypass and ensures consistent request parsing.

---

### Risks Of Wrong Choice

Missing Content-Type validation allows XML/form-data payloads that bypass JSON validation. Inconsistent 415 error format confuses client error handling.

---

### Related Rules

* Validate Content-Type On Write Endpoints
* Use expectsJson() As Primary Format Discriminator

---

### Related Skills

* HTTP Method Semantics
* RFC 9457 Problem Details

---

---

## Vendor Media Type Versioning vs URL Prefix Versioning

---

### Decision Context

Choosing between vendor media types (`Accept: application/vnd.myapp.v2+json`) and URL prefix (`/api/v2/`) for API versioning via content negotiation.

---

### Decision Criteria

* architectural
* maintainability
* security

---

### Decision Tree

Do clients prefer clean URLs without version segments?
├── YES → Use vendor media type versioning via Accept header
│   ├── Is the Accept header parsing robust?
│   │   ├── YES → Parse version from vendor media type in middleware
│   │   └── NO → Implement regex-based parsing with fallback
│   └── Does the response vary by version for caching?
│       ├── YES → Include `Vary: Accept` — each version is a separate cache entry
│       └── NO → Vary still needed for cache correctness
└── NO → Use URL prefix versioning (`/api/v1/`, `/api/v2/`)
    ├── More explicit; easier to test; simpler caching
    └── URL structure changes between versions

Can clients easily configure custom Accept headers?
├── YES → Vendor media types are feasible
└── NO → URL prefix is simpler for most HTTP clients

---

### Rationale

Vendor media types keep URLs clean but require clients to set custom Accept headers. URL prefix versioning is more explicit, testable, and cache-friendly. For most APIs, URL prefix is the simpler choice.

---

### Recommended Default

**Default:** URL prefix versioning (`/api/v1/`) for most APIs; vendor media types for APIs where URL cleanliness is prioritized
**Reason:** URL prefix is explicit, easy to test, and works with all HTTP clients without custom header configuration.

---

### Risks Of Wrong Choice

Vendor media types complicate client setup and cache configuration. URL prefix versioning ties version to URL (harder to change later).

---

### Related Rules

* Set `Vary: Accept` On Content-Negotiated Responses
* Use Prefers() For Quality-Weighted Format Selection

---

### Related Skills

* Response Versioning
* URL Structure Design
