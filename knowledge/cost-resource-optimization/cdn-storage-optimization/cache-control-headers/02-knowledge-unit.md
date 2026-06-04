# KU-03-CACHE-CONTROL-HEADERS: Cache Control Headers

## Metadata
- **ID**: KU-03-CACHE-CONTROL-HEADERS
- **Subdomain**: CDN & Storage Optimization
- **Topic**: Cache Control Headers
- **Source**: CDN & Storage Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Cache-Control HTTP headers determine what CloudFront caches and for how long. Incorrect headers cause unnecessary origin requests (cache bypass) or stale content (over-caching). Proper cache-control strategy is the difference between 90% cache hit ratio and 10%. For Laravel, static assets should have immutable headers while dynamic routes must explicitly define cacheability.

## Core Concepts
- **Cache-Control: public, max-age=31536000, immutable**: Best for versioned static assets (CSS/JS with hash)
- **Cache-Control: no-cache**: Forces revalidation (conditional request with ETag); serves stale while checking
- **Cache-Control: no-store**: Prevents any caching (sensitive data); CloudFront will not cache
- **Cache-Control: private**: Browser can cache but CDN should not
- **ETag**: Entity tag for conditional requests; saves bandwidth when content hasn't changed
- **CloudFront Minimum/Default/Max TTL**: Overrides Cache-Control max-age when set

## Mental Models
- Default: `max-age=31536000, immutable` for all hashed assets
- Default: `no-cache, must-revalidate` + ETag for API responses
- Check if assets are Mix/Vite versioned before recommending immutable

## Internal Mechanics
- `immutable` directive prevents browser revalidation entirely (fastest possible)
- ETag revalidation sends 304 responses (~500 bytes) vs full 200 responses (50KB-1MB)
- Cache hit ratio target: >95% for static assets, >60% for HTML with revalidation
- Conditional requests cost virtually nothing (Lambda@Edge or ALB processing still applies)

## Patterns
- Version static assets with content hash
- Use ETag for dynamic content
- Set short TTL with revalidation for HTML
- Override CloudFront TTLs at distribution level

## Architectural Decisions
- Configure Laravel Mix/Vite to output content-hashed filenames automatically
- Add ETag middleware for API routes (Laravel ETag middleware package or custom)
- Set Cache-Control headers in Nginx/Apache for file-based assets
- For Laravel responses, use `$response->setCache()` or middleware per-route
- Never override Cache-Control at CloudFront for hashed assets; respect origin headers

## Tradeoffs
**When To Use:**
- `public, max-age=31536000, immutable`: All versioned assets (mix-manifest hashed files)
- `public, max-age=86400`: Non-versioned but cacheable content (user avatars, logos)
- `no-cache`: API responses that change but can use conditional requests
- `no-store`: User-specific data, credit card forms, auth tokens

**When NOT To Use:**
- `no-store`: Not for static assets (prevents caching entirely); use only for sensitive data
- `max-age` > 1 year: Not for non-versioned files (cache poisoning risk without versioning)
- `no-cache` without ETag: Without ETag/Last-Modified, no-cache forces unconditional revalidation (worst of both worlds)
- `private` for CDN: CloudFront respects `private` and will not cache; use `no-cache` instead if revalidation is acceptable

## Performance Considerations
- `immutable` directive prevents browser revalidation entirely (fastest possible)
- ETag revalidation sends 304 responses (~500 bytes) vs full 200 responses (50KB-1MB)
- Cache hit ratio target: >95% for static assets, >60% for HTML with revalidation
- Conditional requests cost virtually nothing (Lambda@Edge or ALB processing still applies)

## Production Considerations
- Never cache authenticated responses with user-specific data (use `private` or `no-store`)
- `immutable` directive should never be used on non-versioned URLs (cache poisoning risk)
- ETags should be content-derived (cryptographic hash), not based on timestamps (prevents timing attacks)
- Clear cache with version change, not header change; changing Cache-Control on existing URL may not invalidate

## Common Mistakes
- **No Cache-Control on static assets**: S3 origin returns no Cache-Control by default; CloudFront uses default 24h TTL (Cause: not configuring S3 metadata; Consequence: content revalidates every 24h unnecessarily; Better: set `public, max-age=31536000, immutable` on S3 object metadata)
- **`private` directive preventing CloudFront caching**: Returning `Cache-Control: private` for API responses that could be cached (Cause: misconception that `private` is safer; Consequence: zero CDN caching for cacheable API data; Better: use `no-cache` with ETag for revalidation)
- **Overriding headers in CloudFront**: Setting CloudFront TTLs that conflict with origin Cache-Control (Cause: configuring CDN-level cache without understanding headers; Consequence: unexpected cache behavior; Better: let origin headers drive caching, use CloudFront TTLs only to set bounds)

## Failure Modes
- **`no-cache` without validation**: Using no-cache but not implementing ETag/Last-Modified (forces full revalidation every time)
- **Same Cache-Control for all routes**: Applying `public, max-age=3600` globally including sensitive endpoints
- **Immutable on non-hashed URLs**: Applies to `style.css` (not hashed); change breaks browser cache if file changes

## Ecosystem Usage
- **Hashed asset**: `build/assets/app.a1b2c3d4.js` -> `Cache-Control: public, max-age=31536000, immutable`
- **API list endpoint**: `/api/posts` -> `Cache-Control: public, max-age=0, must-revalidate` + ETag
- **User avatar**: `/storage/avatars/user-1.jpg` -> `Cache-Control: public, max-age=86400`
- **Admin only**: `/admin/dashboard` -> `Cache-Control: private, no-store`

## Related Knowledge Units
- CDN Integration (ku-01)
- File Compression (ku-04)
- Laravel HTTP Cache Middleware

## Research Notes
Derived from CDN & Storage Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.