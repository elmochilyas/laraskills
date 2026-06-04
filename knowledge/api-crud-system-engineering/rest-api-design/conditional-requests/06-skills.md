# Skill: Implement Conditional Requests

## Purpose
Support conditional requests using `ETag` and `Last-Modified` headers for cache validation, with 304 Not Modified responses when resource hasn't changed.

## When To Use
- Read endpoints with cacheable responses
- Bandwidth-optimized APIs
- Resources with update timestamps

## When NOT To Use
- Write endpoints (POST, PUT, PATCH, DELETE)
- Rapidly changing resources
- Non-cacheable responses

## Prerequisites
- HTTP caching semantics
- Middleware implementation

## Inputs
- Resource ETag generation strategy
- Last-Modified source field

## Workflow
1. Generate `ETag` from resource content hash (e.g. MD5 of serialized response) or version
2. Set `Last-Modified` header from `updated_at` timestamp — ISO 8601 format
3. Check `If-None-Match` header — return 304 if ETag matches
4. Check `If-Modified-Since` header — return 304 if not modified
5. Return 304 with no body — only headers
6. Apply to GET/HEAD requests only
7. Use consistent ETag format — strong vs weak validation
8. Include `Cache-Control` with conditional response directives
9. Test conditional requests with matching and non-matching headers
10. Document conditional request support

## Validation Checklist
- [ ] ETag header on cacheable GET responses
- [ ] Last-Modified header on cacheable GET responses
- [ ] 304 for matching If-None-Match
- [ ] 304 for matching If-Modified-Since
- [ ] 200 for non-matching conditions
- [ ] 304 has no body
- [ ] Conditional support for GET/HEAD only
- [ ] Cache-Control headers present
- [ ] Tests cover match and non-match

## Related Skills
- Response Caching Headers
- Cache Control Strategy
- REST Maturity Model
