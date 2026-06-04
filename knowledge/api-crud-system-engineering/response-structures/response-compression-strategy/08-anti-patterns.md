# Anti-Patterns: Response Compression Strategy

## Double Compression
**Description:** Both the web server (Nginx gzip on) and PHP middleware (ob_gzhandler, spatie/laravel-http-compression) compress responses, wasting CPU cycles on already-compressed content.
**Why it happens:** Adding compression at multiple layers during deployment without checking existing configuration.
**Consequences:** 2x CPU overhead; slightly larger response as double-compressed data is less efficient; debugging confusion.
**Better approach:** Enable compression at one layer only — web server preferred, CDN secondary, middleware last resort.

## PHP Output Buffering Compression
**Description:** Using `ob_gzhandler()` or PHP-level compression instead of web server or CDN compression.
**Why it happens:** Developers follow PHP-centric tutorials that don't address infrastructure-level compression.
**Consequences:** PHP process spends CPU on compression that the web server could do more efficiently; blocks PHP process during compression of large responses.
**Better approach:** Configure compression at the web server level (Nginx gzip on) or CDN. PHP-level is a fallback only.

## Pre-Compression of Dynamic Responses
**Description:** Attempting to pre-compress and cache API responses at build time using gzip static or similar.
**Why it happens:** Applying static asset optimization techniques to dynamic API responses.
**Consequences:** Dynamic responses cannot be pre-compressed; stale compressed responses served; cache invalidation complexity.
**Better approach:** API responses are dynamic — compress on-the-fly at the web server. Use HTTP caching (ETag, Cache-Control) instead.

## Compression Level Over-Optimization
**Description:** Setting gzip level 9 or brotli level 11 for all responses, chasing maximum compression ratio.
**Why it happens:** Misunderstanding that higher compression level always equals better performance.
**Consequences:** 10-20x more CPU time for 3-5% additional compression; increased latency at high traffic; server CPU saturation.
**Better approach:** Level 1-3 for high-throughput APIs, level 6 as balanced default. Higher levels rarely justify CPU cost.

## No Vary Header
**Description:** Compressed responses served without `Vary: Accept-Encoding` header, causing cached responses to be served to clients that don't support that encoding.
**Why it happens:** Not understanding how HTTP caching interacts with content negotiation.
**Consequences:** Clients that don't support gzip receive compressed content and fail to decode; clients that support brotli receive gzip content.
**Better approach:** Always set `Vary: Accept-Encoding` on compressed responses. This ensures the cache stores separate entries per encoding.

## Compressing Every Response Regardless of Size
**Description:** Compressing all responses including tiny payloads (< 1KB) where compression overhead exceeds bandwidth savings.
**Why it happens:** Default configuration without minimum content length threshold.
**Consequences:** Added latency and CPU for responses that would be faster uncompressed; negligible bandwidth savings.
**Better approach:** Configure minimum content length (typically 1KB) below which compression is not applied.
