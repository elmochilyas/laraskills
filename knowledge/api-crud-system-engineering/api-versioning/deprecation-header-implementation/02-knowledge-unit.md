# Deprecation Header Implementation — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
The `Deprecation` header (RFC 9745) signals to consumers that an API version or endpoint is deprecated. Phase 2 covers implementing the `Deprecation` header as HTTP middleware, adding deprecation metadata to responses, and configuring deprecation thresholds.

## Core Concepts
- **Deprecation Header (`Deprecation: true`):** Indicates the API version used in the request is deprecated.
- **RFC 9745:** Standardizes the `Deprecation` header with `true` value and optional `since` and `for` parameters.
- **Deprecation vs Sunset:** Deprecation warns of future removal; sunset announces the removal date.
- **Per-Endpoint Deprecation:** Specific endpoints can be deprecated independently of the version.

## Mental Models
- **Yellow Warning Sign:** The Deprecation header is a yellow warning sign on the API highway. "This road will be closed. Find an alternate route."
- **Library "Deprecated" Annotation:** Like `@deprecated` in code — the API still works, but consumers should stop using it.

## Internal Mechanics
- Middleware checks the resolved version against a config array of deprecated versions.
- If deprecated, `header('Deprecation: true')` is added to the response.
- Optional `Deprecation: since="2026-01-01"` provides context.
- Per-endpoint deprecation uses route attributes or a separate config map.

## Patterns
- Deprecation middleware added to deprecated version route groups.
- Deprecation config: `config('api.deprecation.versions')` listing deprecated versions with `since` date.
- Response body deprecation warning in addition to the header.
- Link header to migration guide: `Link: </docs/migration-v1-to-v2>; rel="deprecation"`.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Header location | Middleware vs controller | Middleware is consistent, automatic |
| Header format | `Deprecation: true` (RFC 9745) | Standards-compliant |
| `since` parameter | ISO 8601 date | Machine-parseable |
| Response body warning | JSON field `deprecated: true` | Consumer visibility |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Middleware-based | Consistent, automatic | Hard to exclude specific endpoints |
| Controller-manual | Per-endpoint control | Forgot to add, inconsistency |
| Header only | Standards-compliant | Easily ignored by clients |
| Header + body | Double visibility | Wastes bandwidth |

## Performance Considerations
- Header injection adds ~0.01ms per deprecated response.
- Config array lookup is O(1) — no performance concern.
- Response body deprecation field adds bytes to every deprecated response.

## Production Considerations
- Test that deprecated endpoints still function correctly (deprecation ≠ broken).
- Monitor Deprecation header frequency to estimate consumer migration progress.
- Add deprecation headers at least 6 months before removal.
- Include deprecation in API monitoring dashboards.

## Common Mistakes
- Adding deprecation header but not having a sunset header or timeline.
- Using non-standard header names (`X-Deprecated` instead of `Deprecation`).
- Deprecating a version but still adding new features to it.
- Not communicating deprecation outside of the header (no docs, no email).

## Failure Modes
- **Header fatigue:** Many endpoints deprecated → consumers ignore the header.
- **Silent deprecation:** Header added but consumers don't notice until removal.
- **Ambiguous deprecation:** Header says deprecated but no alternative version exists.
- **Broken deprecation:** Deprecated endpoint has bugs but team ignores it because "it's deprecated."

## Ecosystem Usage
- **Stripe:** Deprecation header on old API versions with `Sunset` header for removal date.
- **GitHub:** Deprecation header on preview API media types.
- **Twilio:** Deprecation header with 12-month warning before version removal.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Sunset header implementation
- Deprecation link headers

### Advanced Follow-up Topics
- RFC 9745
- Consumer deprecation notification systems

## Research Notes
### Source Analysis
RFC 9745 (2022) standardized the Deprecation HTTP header. Prior to this, custom headers like `X-Deprecated` were common. Stripe's implementation (2023) was among the first major adopters.

### Key Insight
The Deprecation header alone is insufficient — it must be paired with a Sunset header and a Link header to the migration guide to be actionable for consumers.

### Version-Specific Notes
Laravel 11's `$response->header('Deprecation', 'true')` sets the header. Use `header_remove()` carefully in PHP 8.x.
