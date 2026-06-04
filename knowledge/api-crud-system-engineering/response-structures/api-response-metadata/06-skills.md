# Skill: Structure API Response Metadata

## Purpose
Include top-level `meta` keys in envelope for response metadata: timestamps, request IDs, pagination info, and application version, with configurable fields via middleware or resource base class.

## When To Use
- All envelope-style API responses
- Responses requiring tracking or debug information
- Paginated response metadata

## When NOT To Use
- Non-envelope responses (204, binary, streaming)
- Internal microservice responses where meta is redundant

## Prerequisites
- Envelope response design
- Middleware or base resource class

## Inputs
- Meta field definitions (required and optional)
- Resource base class

## Workflow
1. Define required top-level meta fields: `request_id`, `timestamp` (ISO 8601), `api_version`
2. Add pagination-specific fields when applicable — include via resource collection
3. Use middleware to inject request-level meta (request_id, timestamp) — consistent across all responses
4. Use resource `additional()` method for resource-specific meta — never override top-level `meta` in middleware
5. Format timestamp as ISO 8601 in UTC — never local time
6. Generate request_id per request via middleware — UUID v4, logged to correlate
7. Avoid storing mutable meta (request_id, timestamp) in HTTP cache
8. Exclude internal meta fields (debug data, query timing) from envelope — internal header or log only
9. Keep meta structure stable within version — additive changes only, never rename or remove fields

## Validation Checklist
- [ ] `request_id` present in all response envelopes
- [ ] `timestamp` in ISO 8601 UTC format in all response envelopes
- [ ] `api_version` present in all response envelopes
- [ ] Pagination fields in `meta` for paginated responses
- [ ] Request-level meta injected via middleware
- [ ] Resource-specific meta via `additional()` method
- [ ] Timestamp is ISO 8601 UTC, never local time
- [ ] Request_id is UUID v4 format
- [ ] Internal meta excluded from envelope (in headers/logs)
- [ ] Meta structure stable — no breaking changes within version

## Common Failures
- Timestamp in local time or non-standard format — breaks client parsing
- Request_id not included — makes troubleshooting across services difficult
- Meta injected via response macro — conflicts with resource `additional()` meta
- Mutable meta (request_id, timestamp) cached and served stale
- Debug data leaked to production clients — query timing, memory usage in meta
- Meta fields inconsistently present — some endpoints have `meta`, others don't

## Decision Points
- Required vs optional meta — request_id and timestamp always required; debug info always excluded
- Middleware vs resource level — request-level (request_id, timestamp) in middleware, endpoint-level in resources
- Cache strategy — exclude mutable meta from cache keys, regenerate on response

## Performance Considerations
- Request_id generation adds ~0.001ms per request (UUID v4 on PHP 8+)
- Timestamp formatting adds negligible overhead
- Mutable meta invalidates HTTP caching by default — use `Cache-Control: no-cache` for meta-bearing responses
- Meta overhead is ~100 bytes per response — negligible for JSON APIs

## Security Considerations
- Never include debug metadata (query logs, memory, timing) in production meta
- Request_id enables log correlation without exposing internal identifiers
- Api_version in meta should match what was negotiated — not what server is capable of
- Consistency metadata (timestamps) help clients detect response reordering

## Related Rules
- Include Request ID in Every Response
- Use ISO 8601 UTC For All Timestamps
- Inject Request-Level Meta Via Middleware
- Use additional() For Resource-Specific Meta
- Exclude Internal Meta Fields From Envelope
- Keep Meta Structure Stable Within Version
- Exclude Mutable Meta From HTTP Cache

## Related Skills
- Envelope Response Design — for overall envelope structure
- Pagination Metadata Design — for pagination-specific meta
- Request ID Generation — for request_id implementation

## Success Criteria
- Every response includes `request_id`, `timestamp`, and `api_version` in meta
- Timestamps consistently ISO 8601 UTC
- Paginated responses include relevant pagination metadata
- Mutable meta not cached with response body
- Debug metadata never exposed to production clients
- Meta structure consistent across all endpoints and versions
