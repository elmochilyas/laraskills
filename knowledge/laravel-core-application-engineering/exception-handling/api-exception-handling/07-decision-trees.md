# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** JSON Error Formatting
**Generated:** 2026-06-03

---

# Decision Inventory

* Consistent Error Envelope Structure (message vs type vs code vs details)
* Catch-All Renderable vs Type-Specific Renderable Registration
* Validation Error Detail Format (flat vs structured field-level errors)

---

# Architecture-Level Decision Trees

---

## Decision 1: Consistent Error Envelope Structure (message vs type vs code vs details)

---

## Decision Context

What fields to include in the JSON error response envelope to balance machine readability, human readability, and debuggability.

---

## Decision Criteria

* Whether API clients need machine-readable error classification (type field)
* Whether the API documents its error format (OpenAPI/Swagger)
* Whether the API needs field-level error details (validation errors)
* Whether the application needs error tracing across distributed services
* Whether the API serves multiple client types (web, mobile, third-party)

---

## Decision Tree

Does the API serve third-party clients or have documented error contracts?
↓
YES → Use a full envelope with `message`, `type`, `code`, and `details` — clients depend on structure stability
NO → Is the API consumed by a first-party frontend (SPA, mobile)?
    YES → Does the frontend need machine-readable error types for branching logic?
        YES → Include `type` field — frontend switches on type, not HTTP status
        NO → Include `message` and `code` — sufficient for display and HTTP handling
NO → Is the API an internal microservice API?
    YES → Include `message`, `type`, `code`, and `request_id` — minimal but traceable
    NO → Include `message` and `code` — default minimal envelope

---

## Rationale

Third-party clients depend on a stable, documented error contract. First-party clients can be more flexible but still benefit from structured errors. The `type` field is more stable than HTTP status codes for client-side branching logic.

---

## Recommended Default

**Default:** Use `{ error: { message, type, code, details }, request_id }` envelope for all API responses.
**Reason:** This structure satisfies the needs of third-party clients, first-party frontends, and internal services with a single consistent format.

---

## Risks Of Wrong Choice

* No `type` field: Clients parse HTTP status codes or message strings — brittle, breaks when status codes change
* No `request_id`: Production errors can't be correlated across services or logs
* Missing `details`: Validation errors require separate API calls to get field-level info
* Over-engineered envelope: Microservices waste bandwidth on fields they never use

---

## Related Rules

* API Error Response Standardization
* Consistent JSON Error Envelope

---

## Related Skills

* JSON Exception Response Formatting
* Global API Error Handler Configuration

---

---

## Decision 2: Catch-All Renderable vs Type-Specific Renderable Registration

---

## Decision Context

Whether to register a single catch-all `renderable()` callback for `Throwable` that handles all exception types, or register separate `renderable()` callbacks for each exception type.

---

## Decision Criteria

* Number of custom exception types in the application
* Whether different exception types need fundamentally different response structures
* Whether the handler is already using the Laravel 11+ fluent API or Handler class
* Whether the team prefers explicit declaration or centralized dispatch logic

---

## Decision Tree

Does the application have 5+ custom exception types with different response needs?
↓
YES → Use type-specific `renderable()` callbacks — each exception type has its own response logic
NO → Use a single catch-all `renderable()` for `Throwable` — dispatch on type internally
    ↓
    Does the catch-all need to handle both API and web responses?
    ↓
    YES → Add `$request->is('api/*')` check at the top — return early for non-API requests
    NO → Single dispatch without branching — simpler implementation

---

## Rationale

A catch-all renderable with internal dispatch is simpler for applications with few exception types. Type-specific callbacks are better for applications with many custom exception types where each needs independent response logic. Mixing both is redundant.

---

## Recommended Default

**Default:** Use a single catch-all `renderable()` for `Throwable` with internal `match` dispatch for exception types. This centralizes all API error logic in one place.
**Reason:** Single catch-all is simpler to maintain and reason about than multiple separate callbacks, especially for applications with fewer than 10 custom exception types.

---

## Risks Of Wrong Choice

* Separate callbacks for every type: Handler file grows large, callback ordering matters, easy to miss a type
* Single catch-all with complex dispatch: Match block becomes unwieldy at 10+ types
* No catch-all for `Throwable`: Unhandled exception types fall through to HTML — API clients receive unparseable responses
* Catch-all without early return for non-API: Web requests also get JSON errors

---

## Related Rules

* API Error Response Standardization
* Error Handler Renderable Registration

---

## Related Skills

* JSON Exception Response Formatting
* Global API Error Handler Configuration

---

---

## Decision 3: Validation Error Detail Format (flat vs structured field-level errors)

---

## Decision Context

How to format validation error details in API responses — whether to use Laravel's default flat structure or a structured field-level format.

---

## Decision Criteria

* Whether the consuming frontend expects a specific error format (Inertia, Vue, React, mobile SDK)
* Whether the API is documented with OpenAPI/Swagger for third-party consumption
* Whether validation errors need machine-readable error codes per field
* Whether the API needs to support i18n for validation messages

---

## Decision Tree

Does the consuming frontend expect a specific validation error format (Inertia's `errors` object, Vue's field mapping)?
↓
YES → Match the frontend's expected format — custom format if needed, otherwise Laravel default
NO → Is the API documented for third-party consumption?
    YES → Use structured format with `field`, `messages`, and `code` per error — stable contract
    NO → Is machine-readable error code needed per field for programmatic handling?
        YES → Use structured format with `field`, `messages`, `code` — `code` enables i18n and automated handling
        NO → Use Laravel's default flat format `{ field: [messages] }` — sufficient and simple

---

## Rationale

Laravel's default validation error format (`{ field: [messages] }`) is sufficient for most first-party frontends. Third-party APIs benefit from a structured format with machine-readable error codes that enable i18n and automated error handling without parsing message strings.

---

## Recommended Default

**Default:** Use Laravel's default `{ field: [messages] }` format for first-party APIs. Use structured `[{ field, messages, code }]` format for third-party APIs.
**Reason:** The default format is simple and sufficient for frontends with direct field mapping. Structured format with codes provides a stable contract for external consumers.

---

## Risks Of Wrong Choice

* Laravel default for third-party API: No machine-readable codes — clients parse message strings, breaks on i18n
* Structured format for first-party: Over-engineered — frontend only needs field-to-message mapping
* Inconsistent format across endpoints: Clients must handle multiple formats — maintenance burden
* No format documentation: Clients can't reliably parse — integration issues

---

## Related Rules

* API Error Response Standardization
* Validation Error Response Structure

---

## Related Skills

* JSON Exception Response Formatting
* Validation Error Formatting
