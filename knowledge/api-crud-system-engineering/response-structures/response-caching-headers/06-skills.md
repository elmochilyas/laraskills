# Skill: Implement Response Caching Headers

## Purpose
Set `Cache-Control`, `ETag`, `Last-Modified`, `Expires`, and `Vary` headers on API responses based on resource cacheability, with public vs private caching per response type.

## When To Use
- Cacheable GET endpoints
- Public resources (listings, reference data)
- Performance optimization for read-heavy endpoints

## When NOT To Use
- User-specific responses (private cache only)
- Write endpoints
- Real-time data

## Prerequisites
- HTTP caching semantics
- Resource cacheability classification

## Inputs
- Cache TTL per resource type
- Cache scope (public vs private)

## Workflow
1. Set `Cache-Control: public, max-age=3600` for public resources
2. Set `Cache-Control: private, max-age=60` for user-specific data
3. Set `Cache-Control: no-store, no-cache` for sensitive/volatile data
4. Set `Expires` header with RFC 7231 formatted date
5. Set `Vary: Accept, Authorization` for cache key differentiation
6. Set `ETag` for conditional request support
7. Exclude 4xx/5xx responses from cache
8. Exclude POST/PUT/PATCH/DELETE from cache
9. Test cache headers with different response types
10. Document caching behavior per endpoint

## Validation Checklist
- [ ] Cache-Control on all GET responses
- [ ] Public vs private scope correct
- [ ] max-age matches resource volatility
- [ ] Expires header present
- [ ] Vary header includes Accept and Authorization
- [ ] 4xx/5xx not cached
- [ ] Write endpoints excluded from cache
- [ ] Cache behavior documented

## Related Skills
- Conditional Requests
- Response Compression Strategy
- CDN Cache Strategy
