# Backward-Compatible Changes — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Backward-compatible changes allow API evolution without creating a new version. Phase 2 covers concrete implementation patterns for safe additions: adding optional fields, expanding enums, relaxing validation, and extending response shapes without breaking existing consumers.

## Core Concepts
- **Non-Breaking Additions:** Adding fields, endpoints, parameters, or enum values that don't break existing clients.
- **Relaxation:** Making previously required fields optional, expanding accepted values.
- **Response Extension:** Adding properties to JSON responses that clients ignore via Postel's Law.
- **Idempotent Defaults:** New fields must have sensible defaults that don't alter existing behavior.

## Mental Models
- **House Extension:** Adding a room (response field) to a house doesn't break existing rooms. Existing furniture (client code) stays where it is. New furniture can use the new room.
- **Restaurant Menu Addition:** Adding a new dish (endpoint) doesn't remove existing dishes. Vegetarians (existing clients) still order from the existing menu. New customers can try the new dish.

## Internal Mechanics
- Laravel resources use `$this->when()` to conditionally include new fields based on request.
- Form requests use `nullable|sometimes` for newly optional fields.
- New endpoints are added alongside existing ones — no route changes to existing routes.
- Enum classes in PHP 8.1+ support `tryFrom()` for graceful handling of new values.

## Patterns
- **Optional Field Addition:** Add field with `null` default. Clients reading the field get `null` or the value. Existing clients ignore it.
- **Query Parameter Addition:** Default is existing behavior. New parameter alters behavior only when explicitly provided.
- **Enum Expansion:** Append values to the existing enum; never reorder or remove existing values.
- **New Endpoint Addition:** Add `/api/v1/related-resources` without modifying `/api/v1/resources`.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| New field handling | `null` default vs sentinel value | `null` is universally understood |
| New query params | Ignore if absent | Existing clients don't send them = no change |
| Enum expansion | Append-only | Removal would be breaking |
| Error message changes | Only additive | Never change existing error texts |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| `null` defaults | Safe, expected | Shifts null-check burden to client |
| Strict null vs absent | Absent is cleaner, null is simpler | Different parsing code in clients |
| Append-only enums | Never breaks | Old clients may not handle new values gracefully |
| Silent field addition | No client change needed | Client may accidentally use new field |

## Performance Considerations
- `$this->when()` adds negligible overhead (~0.01ms per condition).
- New query parameters don't affect request processing unless explicitly read.
- New endpoints add routes but don't impact existing route lookups.
- Enum `tryFrom()` is O(1) — no performance concern.

## Production Considerations
- Document new fields as "added in version X" in API docs.
- Monitor for clients that send unrecognized query parameters (could indicate typos).
- Add new fields behind a feature flag initially to verify stability.
- Test that existing clients work unchanged when hitting the updated endpoint.

## Common Mistakes
- Adding a field without a default value (clients get `null` but expected it to exist).
- Adding a required query parameter (existing clients don't send it → 422).
- Removing a field from documentation but keeping it in the response (confused consumers).
- Adding a field with a non-null default that changes existing behavior.

## Failure Modes
- **Undocumented new field:** Client uses it assuming it's always present; it's not.
- **Validation tightening:** New validation rule accidentally applied to all requests, breaking existing clients.
- **Enum sorting change:** Enum values reordered in documentation; client with ordinal-based parsing breaks.
- **New field naming collision:** New field name matches an existing field in a sub-resource.

## Ecosystem Usage
- **Stripe:** Strict backward compatibility policy. New fields always nullable. New parameters always optional.
- **GitHub:** Backward-compatible additions allowed within a major version. New preview features as opt-in.
- **Shopify:** Clear documentation of "added in" version for every field and parameter.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Breaking change identification
- When to create new version

### Advanced Follow-up Topics
- Consumer-driven contracts
- Tolerance-based client libraries

## Research Notes
### Source Analysis
Stripe's "Backward Compatibility" documentation (2023) is the gold standard. Postel's Law ("be conservative in what you send, be liberal in what you accept") is the theoretical foundation.

### Key Insight
Most changes are backward-compatible if you add rather than modify. The discipline is recognizing when an "improvement" is actually a breaking change in disguise.

### Version-Specific Notes
Laravel 11's `whenHas()` method on resources is useful for conditionally including fields only when present.
