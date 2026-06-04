| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Per-Page Parameter Design |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

The `per_page` (or `limit`) parameter controls how many records are returned in a single paginated response. Its design — default value, maximum value, parameter naming, and behavior when omitted or exceeded — significantly impacts API usability, server load, and data transfer costs. A well-designed per-page strategy balances client convenience (smaller pages for mobile, larger pages for batch processing) with server protection (limits prevent abuse and excessive load).

## Core Concepts

- **Parameter Naming**: `per_page` (Laravel/JSON:API), `limit` (database-idiomatic/Stripe), `page[size]` (JSON:API nested).
- **Default Values**: Laravel default 15; typical REST defaults 15-30; mobile 10-15; admin 25-50.
- **Maximum Enforcement**: Critical safeguard — typical max 100, generous max 1000.
- **Clamping Pattern**: `min(max((int) $request->input('per_page', 15), 1), 100)` — ensure valid range.
- **Per-Endpoint Tuning**: Different endpoints may warrant different defaults and maximums based on record size and client type.

## When To Use

- Use `per_page` naming for public REST APIs following Laravel/JSON:API conventions.
- Use `limit` naming for internal/gRPC-like APIs where the caller directly controls the database limit.
- Different defaults for different client types: mobile (10-15), web (15-25), admin (25-50).
- Larger maximums (1000) for dedicated export endpoints; smaller maximums (100) for general endpoints.

## When NOT To Use

- Do not use different parameter names across endpoints — standardize on one naming convention.
- Do not use a `per_page` default larger than 50 for mobile APIs without good reason.
- Do not set maximum above 1000 without specific batch-processing requirements and safeguards.
- Do not use `per_page` as a substitute for dedicated batch/export endpoints for large data dumps.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always enforce a documented maximum per_page | Prevents resource exhaustion (OOM, slow queries, bandwidth abuse) |
| Use `min(max())` clamping over failing on invalid values | Graceful handling of edge cases — clamp to valid range |
| Document default and max per-endpoint | Clients need to know what values to send and what to expect |
| Use consistent naming across all endpoints | Reduces client integration complexity |
| Choose default based on median record size | Small records (IDs/names) can use larger defaults; large records (articles) need smaller defaults |
| Consider tying rate limits to per_page | Larger pages consume more server resources; heavier rate limiting is reasonable |

## Architecture Guidelines

- Configure model-specific defaults using `Model::$perPage` property or `Paginator::defaultPerPage()` globally.
- Use static defaults for predictability; avoid dynamic defaults (client-type-based) unless documented.
- Provide a per-endpoint configuration array mapping resources to their default and max per_page values.
- For admin/internal endpoints, use more generous limits; for public endpoints, use restrictive limits.
- Log and monitor requests with per_page values near the maximum for abuse detection.

## Performance Considerations

- per_page=10: ~2-5KB response, 10 requests for 100 records.
- per_page=100: ~20-50KB response, 1 request for 100 records.
- per_page=1000: ~200-500KB response, 1 request but 5-10x slower.
- Optimal per_page balances response size (network time) with request count (round trips) — 15-25 is typically the sweet spot.
- Large per_page increases query execution time, memory usage, and serialization cost (Eloquent hydration, JSON encoding).

## Security Considerations

- Unbounded per_page is a resource exhaustion vector — always enforce a maximum.
- Requests with per_page near the maximum may indicate scraping or abuse — log and monitor.
- Rate limiting should account for per_page; large page requests consume more resources.
- Validate that per_page is a positive integer; zero or negative values can crash pagination logic.
- For authenticated endpoints, consider user-specific per_page limits based on subscription tier.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not enforcing a maximum per_page | Trusting clients to request reasonable values | Client requests 100K records; OOM or slow response | Always enforce a documented maximum |
| Using per_page for batch operations | Setting per_page=1000 to iterate all records quickly | Large pages time out or consume excessive memory | Provide dedicated export endpoint with chunked processing |
| Inconsistent naming across endpoints | Different developers choose different names | Clients must adapt to different parameter names per endpoint | Standardize on one naming convention across the entire API |
| Not validating per_page value | No type or range validation | Zero or negative values crash pagination | Validate integer, min:1, max: configured limit |

## Anti-Patterns

- **No maximum limit**: Classic resource exhaustion vulnerability.
- **Different parameter names per endpoint**: Confuses clients and increases integration complexity.
- **Using per_page as a batch processing mechanism**: Pagination endpoints are for UI navigation, not bulk data export.
- **Dynamic defaults without documentation**: Clients can't predict page sizes; leads to inconsistent UX.
- **Allowing per_page=0 or negative**: Crashes LIMIT clauses in SQL (MySQL interprets LIMIT 0 as return no rows).

## Examples

- **Laravel model default**: `protected $perPage = 25;` on the Model class.
- **Request clamping**: `$perPage = min(max((int) $request->input('per_page', 15), 1), 100);`
- **Validation**: `$request->validate(['per_page' => 'integer|min:1|max:100']);`
- **Per-endpoint configuration**: `['posts' => ['default' => 15, 'max' => 100], 'users' => ['default' => 25, 'max' => 200]]`
- **Client-adaptive**: Mobile clients get `min($perPage, 50)` while web clients get `min($perPage, 100)`.

## Related Topics

- Offset Pagination Design — Where per_page is used
- Cursor Pagination Design — Where per_page/limit is used
- Pagination Strategy Selection — Context for per_page decisions
- Rate Limiting Design — Relationship between per_page and resource consumption
- Response Payload Optimization — Minimizing per-page data transfer

## AI Agent Notes

- Always include per_page maximum enforcement in paginated endpoint code.
- Use `min(max())` clamping rather than rejecting out-of-range values — it's more resilient.
- Default to 15 (Laravel convention) unless there's a specific reason to deviate.
- Document default and max values in API specifications and OpenAPI/Swagger docs.
- For mobile APIs, consider smaller defaults (10) and lower maximums (50).

## Verification

- [ ] per_page has a documented and enforced maximum value
- [ ] Default per_page is configured per resource (model or endpoint)
- [ ] Parameter naming is consistent across all endpoints (per_page or limit, not both)
- [ ] per_page is validated as integer with min:1 and max:{configured}
- [ ] Clamping (min/max) is used instead of hard rejection for out-of-range values
- [ ] Mobile and web clients have appropriate default/max values
- [ ] Large per_page requests are logged and monitored
- [ ] Rate limiting accounts for per_page value
- [ ] Dedicated export endpoint exists for batch data retrieval (not using per_page for this)
