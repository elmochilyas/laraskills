# Decomposition: Cache Control Headers

## Topic Overview
Cache-Control HTTP headers determine what CloudFront caches and for how long. Incorrect headers cause unnecessary origin requests (cache bypass) or stale content (over-caching). Proper cache-control strategy is the difference between 90% cache hit ratio and 10%. For Laravel, static assets should have immutable headers while dynamic routes must explicitly define cacheability.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-cache-control-headers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cache Control Headers
- **Purpose:** Cache-Control HTTP headers determine what CloudFront caches and for how long. Incorrect headers cause unnecessary origin requests (cache bypass) or stale content (over-caching). Proper cache-control strategy is the difference between 90% cache hit ratio and 10%. For Laravel, static assets should have immutable headers while dynamic routes must explicitly define cacheability.
- **Difficulty:** Foundation
- **Dependencies:** - CDN Integration (ku-01), - File Compression (ku-04), - Laravel HTTP Cache Middleware

## Dependency Graph
**Depends on:**
- CDN Integration (ku-01)
- File Compression (ku-04)
- Laravel HTTP Cache Middleware

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- `public, max-age=31536000, immutable`: All versioned assets (mix-manifest hashed files)
- `public, max-age=86400`: Non-versioned but cacheable content (user avatars, logos)
- `no-cache`: API responses that change but can use conditional requests
- `no-store`: User-specific data, credit card forms, auth tokens
**Out of scope:**
- `no-store`: Not for static assets (prevents caching entirely); use only for sensitive data
- `max-age` > 1 year: Not for non-versioned files (cache poisoning risk without versioning)
- `no-cache` without ETag: Without ETag/Last-Modified, no-cache forces unconditional revalidation (worst of both worlds)
- `private` for CDN: CloudFront respects `private` and will not cache; use `no-cache` instead if revalidation is acceptable
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization