# ECC Standardized Knowledge — Request Size Limits

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Request Size Limits |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Request size limits govern the maximum allowed size for API request bodies, file uploads, and query strings. Limits are enforced at multiple layers (nginx, PHP, Laravel) to prevent resource exhaustion, ensure fair use, and protect against DoS attacks. Defaults are 10 MB body limit and 50 MB upload limit. The strictest limit must be at the outermost layer (nginx), relaxing inward.

## Core Concepts

- **Body size limit**: Maximum size of HTTP request body (10 MB default, 50 MB for uploads).
- **Upload size limit**: Maximum file upload size, typically larger than body limit.
- **Query string limit**: Maximum URL query string length.
- **Multi-layer enforcement**: nginx (gateway), PHP (runtime), Laravel (application) — defense in depth.
- **413 Payload Too Large**: Standard HTTP response for size violations.
- **Tiered limits**: Different limits per consumer tier (Free: 1 MB, Pro: 10 MB, Enterprise: 50 MB).

## When To Use

- All HTTP APIs with request bodies
- File upload endpoints
- Public-facing APIs needing resource protection
- Multi-tenant systems requiring fair usage guarantees

## When NOT To Use

- Internal-only APIs with trusted consumers
- Streaming endpoints (use chunked transfer with streaming validation)
- GraphQL APIs (query complexity sizing is different concern)

## Best Practices

- **Consistent limits across layers**: nginx limit <= PHP limit <= Laravel limit. Strictest at outermost layer.
- **Tiered limits per consumer**: Free: 1 MB, Pro: 10 MB, Enterprise: 50 MB.
- **Endpoint-specific overrides**: File upload endpoints have higher limits; JSON mutation endpoints lower.
- **Informational headers**: Include `X-Content-Length-Limit` header to inform consumers.
- **Graceful rejection**: Return 413 with clear message, current limit, and instructions for increasing.
- **Streaming validation**: Validate size while streaming — don't buffer entire request before rejection.

## Architecture Guidelines

- nginx `client_max_body_size` rejects oversized requests at TCP level before application.
- PHP `upload_max_filesize` and `post_max_size` configured in php.ini.
- Laravel middleware enforces business-specific limits per endpoint or consumer tier.
- Limits documented in error responses and developer portal.
- Separate upload endpoint with streaming + resumable protocol for large files (video).

## Performance Considerations

- nginx rejects at TCP level — minimal resource cost.
- Larger PHP limits increase per-worker memory pressure.
- Streaming uploads to disk reduces per-request memory footprint.
- Validation at nginx prevents wasted application processing on invalid requests.

## Security Considerations

- Request size limits are first line of defense against DoS via large payloads.
- DoS via chunked transfer: enforce cumulative size limit, not per-chunk.
- Log oversized requests with consumer ID, actual size, endpoint — not payload content.
- Tiered limits prevent free-tier abuse while supporting enterprise needs.

## Common Mistakes

- Setting limits too low for legitimate use cases (413 on normal operations).
- Setting limits too high (memory exhaustion under peak traffic).
- Inconsistent limits across layers (nginx allows 10 MB, PHP allows 2 MB — confused consumers).
- Not updating limits when business requirements change.
- Forgetting limit configuration differs between environments (dev needs higher limits for testing).

## Anti-Patterns

- **Single limit for all endpoints**: File upload endpoints and JSON mutations have different needs.
- **No consumer feedback on limits**: Consumer hits 413 with no indication of what the limit is.
- **Innermost limit stricter than outermost**: Request passes nginx, rejected by Laravel — wasted processing.

## Examples

- nginx config: `client_max_body_size 10M;`.
- PHP config: `upload_max_filesize = 50M; post_max_size = 55M;`.
- Tiered limits: Free = 1 MB max body; Pro = 10 MB; Enterprise = 50 MB (upload only).
- Error response: `HTTP 413 { "error": { "code": "PAYLOAD_TOO_LARGE", "message": "Request body exceeds 10 MB limit.", "limit": "10485760", "resolution": "Reduce payload size or upgrade to Pro tier." } }`.

## Related Topics

- **Prerequisites**: Rate Limit Tier Design, CORS Policy Governance
- **Closely Related**: Bulk Operation Design, API Usage Tracking
- **Advanced**: Streaming request validation, Dynamic size limits based on consumer tier, Request size analytics for capacity planning

## AI Agent Notes

When enforcing request size limits: configure nginx limit as strictest outer layer, PHP intermediate, Laravel most permissive; use tiered limits per consumer; provide X-Content-Length-Limit header; return 413 with limit info and upgrade path; stream large uploads to disk; log oversized requests without payload content.

## Verification

Sources: nginx client_max_body_size documentation, PHP upload_max_filesize, Stripe 10 MB limit, GitHub API 100 MB file limit, domain-analysis.md.
