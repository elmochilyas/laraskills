# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** API Response Shapes
**Difficulty:** Intermediate
**Category:** Response Structures
**Last Updated:** 2026-06-03

---

# Overview

API Response Shapes define the structural patterns of API responses — the envelope format, data wrapping, error structure, and top-level organization. The response shape is the most visible aspect of the API contract, determining how consumers parse every response.

Engineers must care because the response shape is the API's most fundamental contract. Changing the shape after consumers depend on it is a breaking change. Choosing the right shape upfront — envelope vs bare body, data wrapping vs direct array — determines long-term API maintainability.

---

# Core Concepts

**Envelope Response:** Wraps data in a consistent structure with `data`, `meta`, and `links` keys. Provides extensibility for metadata and error states.

**Bare Body Response:** Returns the resource directly without wrapping. Simpler but lacks metadata space.

**Data Wrapping:** Encloses resource data in a `data` key. `{ "data": { "id": 1, "name": "Alice" } }` vs `{ "id": 1, "name": "Alice" }`.

**Error Shape:** The structure of error responses — typically `{ "error": { "code": "...", "message": "..." } }`.

**Collection Shape:** The structure of list responses — typically `{ "data": [...], "meta": { ... }, "links": { ... } }`.

---

# When To Use

- Every API response — the shape is a fundamental design decision
- Envelope for extensible APIs with metadata needs
- Bare body for simple APIs where metadata is communicated via headers

---

# When NOT To Use

- Envelope and bare body shouldn't be mixed across endpoints
- Choose one and apply consistently

---

# Best Practices

**Choose one response shape and apply consistently.** Every endpoint returns the same structure.

**Prefer envelope response for public APIs.** The `data` key provides space for metadata and prevents top-level key conflicts.

**Use bare body for simple, internal APIs.** Fewer bytes, simpler parsing.

**Standardize pagination collection responses.** All list endpoints return the same collection shape.

**Standardize error responses.** All errors follow the same envelope structure, regardless of error type.

---

# Architecture Guidelines

**Response shape is enforced by a base response class or macro.** All responses go through a consistent formatter.

**API Resources define the data shape.** The resource's `toArray()` output is placed inside the envelope.

**Error shape is defined in the exception handler.** All exceptions produce the same error structure.

**Pagination shape is defined in the paginator response.** `PaginatedResourceResponse` controls collection shape.

---

# Performance Considerations

**Envelope wrapping adds bytes.** `{"data":` is 8 characters overhead per response. Bare body is more efficient.

**Data wrapping adds nesting depth.** Each wrapping level adds array nesting that clients must traverse.

**Error envelope overhead is negligible.** Error responses are infrequent.

---

# Security Considerations

**Error shape must not leak internal details.** Consistent error shape regardless of error type or severity.

**Data wrapping prevents top-level prototype pollution.** Wrapping data in a `data` key prevents JSON prototype pollution in some parsers.

---

# Common Mistakes

**Inconsistent shapes across endpoints.** Single-resource endpoints return bare body; list endpoints return envelope.

**No error envelope.** Errors return various formats depending on the error type.

**Changing shape after launch.** Consumers depend on the shape; changes break existing integrations.

---

# Anti-Patterns

**Shape Inconsistency:** Mixing envelope and bare body responses across endpoints.
**Better approach:** Choose one shape and apply universally.

**Deeply Nested Responses:** Wrapping data in multiple unnecessary levels: `{ "response": { "result": { "data": { ... } } } }`.
**Better approach:** Flat envelope with one level of wrapping. `{ "data": {...}, "meta": {...} }`.

**Shape Changes Per Endpoint:** Each endpoint returns a slightly different structure.
**Better approach:** All endpoints return the same structural shape. Only the contents of `data` differ.
