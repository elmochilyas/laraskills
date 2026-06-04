# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Gateway patterns in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Gateway type — Table Data Gateway vs Row Data Gateway vs Service Gateway
* Decision 2: Gateway interface design — abstraction vs leaky abstraction
* Decision 3: Gateway error handling — domain exceptions vs raw exceptions

---

# Architecture-Level Decision Trees

---

## Decision: Gateway Type — Table Data Gateway vs Row Data Gateway vs Service Gateway

---

## Decision Context

Choose the appropriate gateway type for the external resource being accessed.

---

## Decision Criteria

* performance considerations: Row Data Gateway per row can cause N+1; Table Data Gateway handles sets efficiently
* architectural considerations: Table Data Gateway matches SQL operations; Service Gateway wraps API calls
* security considerations: Service Gateway can centralize authentication for external services
* maintainability considerations: each gateway type has different mapping complexity

---

## Decision Tree

Is the external resource a database table?
↓
YES → Data Gateway type
    ↓
    Does the application operate on individual rows (find, update, delete one record)?
    YES → Row Data Gateway (one object per row, row-level operations)
    ↓
    Is the gateway used for a single table with simple CRUD?
    YES → Row Data Gateway (matches Active Record pattern closely)
    NO → Consider Table Data Gateway for set operations
    NO → Table Data Gateway (operates on table-level: insert, update, delete sets)
NO → Is the external resource an external service (API, microservice, legacy system)?
    YES → Service Gateway (wraps HTTP calls, handles auth, serialization, retries)
    ↓
    Does the external service have a complex protocol (OAuth, custom headers, rate limiting)?
    YES → Service Gateway with protocol handling
    NO → Simple Service Gateway (HTTP client wrapper with basic error handling)
NO → Is the external resource a file system, cache, or other resource?
    YES → Gateway encapsulating the resource-specific operations
    NO → Gateway may not be needed — consider if abstraction is justified

---

## Rationale

Table Data Gateway handles set-level operations on a table. Row Data Gateway represents a single row. Service Gateway wraps external API calls. In Laravel, Eloquent models function as a hybrid Table/Row Data Gateway with Active Record patterns. Service Gateways are the most common custom gateway type, wrapping HTTP API calls to external services.

---

## Recommended Default

**Default:** Row Data Gateway for per-row DB operations. Service Gateway for external API calls. Table Data Gateway for set operations (batch updates, bulk inserts).

**Reason:** Row Data Gateway maps naturally to Eloquent's per-model operations. Service Gateways are essential for isolating external API dependencies. Table Data Gateway is useful for set operations that don't fit the per-model pattern.

---

## Risks Of Wrong Choice

Row Data Gateway for set operations: inefficient batch operations, multiple round trips. Table Data Gateway for row operations: overly complex for single row access. Gateway with business logic: mixes data access and domain rules.

---

## Related Rules

- Rule 1: Gateways encapsulate access to external systems — no business logic
- Rule 2: Service Gateways handle HTTP communication, auth, serialization, and error translation

---

## Related Skills

- Implement Table Data Gateway
- Implement Row Data Gateway
- Implement Service Gateway

---

## Decision: Gateway Interface Design — Abstraction vs Leaky Abstraction

---

## Decision Context

Choose whether the gateway's public interface fully abstracts the external system or exposes its concepts.

---

## Decision Criteria

* performance considerations: full abstraction may hide performance characteristics
* architectural considerations: full abstraction decouples clients from external system changes
* security considerations: full abstraction can hide security-sensitive details
* maintainability considerations: leaky abstractions couple clients to external system; full abstractions require mapping effort

---

## Decision Tree

Does the gateway interface expose types from the external system (HTTP response objects, API DTOs)?
↓
YES → Leaky abstraction — external system types leak into the gateway's interface
    ↓
    Is the external system stable (rarely changes, well-documented)?
    YES → Leaky abstraction is acceptable (mapping to domain types adds overhead)
    ↓
    Will the gateway be swapped for a different provider?
    YES → Definitely need full abstraction (leaky means all clients change)
    NO → Leaky abstraction is pragmatic (less mapping code)
    NO → Is the external system likely to change or be replaced?
        YES → Full abstraction (gateway returns domain objects, not API responses)
        ↓
        Create domain-specific DTOs for the gateway's return values
        Map external responses to domain objects inside the gateway
        NO → Leaky abstraction is acceptable
NO → Gateway returns domain-appropriate types (no external system leakage)
    YES → Full abstraction is achieved
    ↓
    Verify: can the external system be replaced without changing gateway consumers?
    YES → Abstraction is successful
    NO → Add mapping layer to complete the abstraction

---

## Rationale

A fully abstracted Gateway hides all external system details — consumers depend only on domain-appropriate types. A leaky Gateway exposes external types, coupling consumers to the external system's interface. Full abstraction requires more mapping code but enables swapping providers. Leaky abstraction is acceptable for stable external systems unlikely to change.

---

## Recommended Default

**Default:** Fully abstracted Gateway — return domain DTOs or value objects, never external system types. Leaky abstraction only for stable, non-swappable external systems.

**Reason:** Full abstraction decouples consumers from external system changes. The mapping cost is justified when the external system may change or be replaced.

---

## Risks Of Wrong Choice

Leaky abstraction: changing external system requires changing all gateway consumers. Full abstraction for every gateway: mapping overhead even for stable systems. Gateway returning different types conditionally: unpredictable consumer experience.

---

## Related Rules

- Rule 3: Gateway should return domain-appropriate types, not external system types
- Rule 4: Gateway without interface is not mockable — always code to an interface

---

## Related Skills

- Design Gateway Interfaces
- Apply Anti-Corruption Layer

---

## Decision: Gateway Error Handling — Domain Exceptions vs Raw Exceptions

---

## Decision Context

Choose whether the Gateway translates external system exceptions into domain exceptions or lets raw exceptions propagate.

---

## Decision Criteria

* performance considerations: exception translation adds minimal overhead
* architectural considerations: domain exceptions decouple consumers from external error types
* security considerations: raw exceptions may leak external system internals (stack traces, API keys)
* maintainability considerations: domain exceptions provide stable error contracts; raw exceptions break on provider changes

---

## Decision Tree

Does the gateway make network calls (HTTP, gRPC, message queue)?
↓
YES → Network calls can fail in various ways — error handling is critical
    ↓
    Do consumers need to treat different error types differently (retry vs fail)?
    YES → Translate to domain exceptions with clear semantic categories
    ↓
    Categories:
    → `GatewayTimeoutException` (retryable)
    → `GatewayAuthenticationException` (credential issue, not retryable)
    → `GatewayNotFoundException` (resource missing)
    → `GatewayValidationException` (client sent invalid data)
    → `GatewayUnavailableException` (service down, retryable with backoff)
    ↓
    Map raw HTTP status codes to the appropriate domain exception inside the gateway
    NO → Single `GatewayException` wrapping the original exception
NO → Does the gateway access a local resource (file system, local database)?
    YES → Wrap in domain exception only if consumers need to handle the error differently
    ↓
    Is the error recoverable?
    YES → Domain exception with recovery guidance
    NO → Let raw exception propagate (no benefit to wrapping)
NO → Gateway is read-only and best-effort — consider returning null/optional instead of throwing

---

## Rationale

Gateway error handling should translate external system errors into domain exceptions that make sense to the consumer. Raw exceptions (HTTP exceptions, connection errors) leak implementation details and change when providers change. A well-designed gateway exception hierarchy isolates consumers from the external system's error patterns.

---

## Recommended Default

**Default:** Translate external exceptions into domain exception hierarchy. At minimum, wrap in a single `GatewayException`. For richer handling, provide specific subclasses per error category.

**Reason:** Domain exceptions decouple consumers from external error details, provide stable error contracts, and prevent leaking of external system internals.

---

## Risks Of Wrong Choice

Raw exceptions: consumer catches HTTP exceptions, breaks when provider changes, leaks internals. Overly generic exceptions: consumer can't distinguish between error types (retryable vs not). Swallowing exceptions in gateway: silent failures, no recovery opportunity for consumers.

---

## Related Rules

- Rule 5: Gateway translates external exceptions into domain-specific gateway exceptions
- Rule 6: Categorize gateway exceptions by consumer action (retry, fail, retry with backoff)

---

## Related Skills

- Design Gateway Exception Hierarchy
- Implement Retry and Fallback in Gateway
