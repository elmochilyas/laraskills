# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** RFC 9457 Problem Details
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Error Format Selection: RFC 9457 vs Custom Error Format

---

### Decision Context

Choosing between RFC 9457 Problem Details and a custom error format for 4xx/5xx responses based on client requirements and error taxonomy needs.

---

### Decision Criteria

* architectural
* maintainability
* security

---

### Decision Tree

Do clients or API gateways need to parse errors programmatically by type?
├── YES → Use RFC 9457 Problem Details
│   ├── Are there multiple distinct error categories (validation, auth, not-found, rate-limit)?
│   │   ├── YES → Register distinct `type` URIs per error category
│   │   └── NO → Use `about:blank` as generic type
│   └── Is error correlation between client and server logs important?
│       ├── YES → Include `instance` as a request UUID for log correlation
│       └── NO → Include `instance` as the request path only
└── NO → Are clients bandwidth-constrained (IoT, mobile metered)?
    ├── YES → Minimal custom error format (status code + short message)
    └── NO → Use RFC 9457 — the standard is worth the few extra bytes

What content type should error responses use?
├── `Content-Type: application/problem+json` for all RFC 9457 errors
└── Custom content type for custom error format

---

### Rationale

RFC 9457 provides a standardized, machine-readable error taxonomy that HTTP libraries, API gateways, and monitoring tools can parse generically. The `type` URI enables deterministic error classification, replacing brittle string-matching on `message`.

---

### Recommended Default

**Default:** RFC 9457 for ALL 4xx/5xx responses with distinct error types per category
**Reason:** One error-parsing code path for clients; machine-classifiable errors for monitoring; spec compliance for API gateways.

---

### Risks Of Wrong Choice

Custom error formats cannot be parsed by API gateways. Single generic type for all errors defeats machine classification. Missing `type` breaks spec compliance.

---

### Related Rules

* Include All Required Fields in Every Error Response
* Register Distinct Error Types per Error Category

---

### Related Skills

* Implement RFC 9457 Problem Details
* Exception Rendering

---

---

## Error Type Registry Design

---

### Decision Context

Designing the error type taxonomy: defining `type` URIs, mapping exception classes to error types, and maintaining documentation URLs.

---

### Decision Criteria

* maintainability
* security
* reliability

---

### Decision Tree

Does the error type URI resolve to a live documentation page?
├── YES → Is the URL path internal or external?
│   ├── Internal (`/errors/validation-error`) → Register a route serving error documentation
│   ├── External (`https://docs.example.com/errors/validation-error`) → Ensure the URL stays live
│   └── No documentation available → Use `about:blank`
└── NO → Use `about:blank` until documentation is available

Is there a mapping between exception classes and error types?
├── YES → Is the mapping in a central configuration (not scattered across handlers)?
│   ├── YES → Good — maintain in `config/errors.php` or similar
│   └── NO → Centralize mapping in exception handler
└── NO → Create mapping in exception handler: `$typeMap = [ValidationException::class => '/errors/validation-error', ...]`

Should validation errors use an extension member?
├── YES → Use `invalid_params` or similar extension with field-level validation details
└── NO → Include validation details in `detail` string only

---

### Rationale

Distinct error types enable machine classification, monitoring aggregation, and type-specific client handling. A centralized error type registry ensures consistent mapping and makes adding new error types straightforward.

---

### Recommended Default

**Default:** Central error type registry in exception handler; distinct types for validation, not-found, auth, rate-limit, and internal-error; `about:blank` for unclassified errors
**Reason:** Central registry prevents scattered type definitions; distinct types enable meaningful error aggregation.

---

### Risks Of Wrong Choice

Single generic type for all errors defeats monitoring. Broken `type` URLs provide no documentation value. Missing registry causes inconsistent type mapping across controllers.

---

### Related Rules

* Make `type` URLs Resolve to Documentation
* Register Distinct Error Types per Error Category

---

### Related Skills

* Error Code Taxonomy
* Exception Rendering

---

---

## Security and Correlation in Error Responses

---

### Decision Context

Balancing the need for detailed error information (for debugging) with security requirements (preventing information leakage) in RFC 9457 responses.

---

### Decision Criteria

* security
* maintainability
* reliability

---

### Decision Tree

Does the error response include information that could aid an attacker?
├── YES → Sanitize the response for production
│   ├── Is there a stack trace, SQL query, or file path in `detail`?
│   │   ├── YES → Remove from `detail`; log server-side instead
│   │   └── NO → Continue — detail is already sanitized
│   └── Should extension members expose debug info?
│       ├── YES → Only in non-production environments
│       └── NO → Production extension members contain only safe data
└── NO → Error is safe to expose

Does the response include a correlation identifier for client-server debugging?
├── YES → Is `instance` a UUID or request ID (not a user ID)?
│   ├── YES → Good — enables log correlation without leaking PII
│   └── NO → Use a request UUID instead of user ID
└── NO → Add `instance` with request UUID for log correlation

---

### Rationale

Error responses are sent to untrusted clients and must never expose internal implementation details. Stack traces, SQL queries, and file paths aid attackers. A correlation ID (`instance`) enables efficient debugging without exposing internal identifiers.

---

### Recommended Default

**Default:** Sanitized `detail` with safe message; `instance` as request UUID; extension members only for non-sensitive data like validation field errors
**Reason:** Security requires sanitization; log correlation requires `instance`; field-level validation errors are safe and useful.

---

### Risks Of Wrong Choice

Stack traces in `detail` leak database structure and framework versions. User IDs in `instance` expose internal identifiers. Missing `instance` makes client error reports impossible to correlate with server logs.

---

### Related Rules

* Never Include Stack Traces or Debug Info in `detail`
* Include `instance` as a Correlation ID for Log Tracing

---

### Related Skills

* Response Caching Headers
* Envelope Response Design
