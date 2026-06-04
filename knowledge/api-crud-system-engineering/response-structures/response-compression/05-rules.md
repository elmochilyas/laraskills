# response-compression Rules

## Rule 1: Compress at the Server Level, Not Application Level
---
## Category
Architecture
---
## Rule
Always configure response compression at the web server layer (Nginx, Caddy, HAProxy), never in PHP application code or middleware.
---
## Reason
Server-level compression is implemented in C (orders of magnitude faster than PHP), keeps application code simple, runs outside the PHP request lifecycle, and eliminates double-compression risk when both layers are accidentally enabled.
---
## Bad Example
```php
// Application-level compression middleware
public function handle($request, Closure $next)
{
    $response = $next($request);
    $response->header('Content-Encoding', 'gzip');
    $response->setContent(gzencode($response->getContent(), 5));
    return $response;
}
```
---
## Good Example
```nginx
# Nginx-level compression — offloads CPU from PHP
gzip on;
gzip_types application/json application/vnd.api+json;
gzip_comp_level 5;
gzip_min_length 1000;
```
---
## Exceptions
Serverless environments (Laravel Vapor) where no web server layer exists — but compression is typically handled by API Gateway or CloudFront automatically.
---
## Consequences Of Violation
PHP CPU time wasted on compression that Nginx could do more efficiently. Double-compression risks corrupting payloads. Application complexity increased unnecessarily.

## Rule 2: Add JSON Content Types to Compression Configuration
---
## Category
Reliability
---
## Rule
Always explicitly add `application/json`, `application/vnd.api+json`, and `application/problem+json` to the web server's compression MIME type list.
---
## Reason
Default Nginx compression configs only compress `text/html`, `text/css`, and `text/javascript`. JSON API responses are not included by default and remain uncompressed, wasting 70-90% potential bandwidth savings.
---
## Bad Example
```nginx
gzip on;
gzip_types text/html text/css text/javascript;
# JSON responses NOT compressed — 70% bandwidth savings lost
```
---
## Good Example
```nginx
gzip on;
gzip_types application/json application/vnd.api+json application/problem+json text/html;
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
JSON API responses sent uncompressed. Mobile clients download 3-10x more data than necessary. Higher bandwidth costs and slower perceived performance.

## Rule 3: Set a Compression Threshold of at Least 1KB
---
## Category
Performance
---
## Rule
Always set `gzip_min_length` (or equivalent) to at least 1000 bytes to avoid compressing tiny responses where overhead exceeds savings.
---
## Reason
Compression headers add bytes. For responses under ~1KB, the compressed payload plus `Content-Encoding` header is frequently larger than the uncompressed response. Below this threshold, compression is counterproductive.
---
## Bad Example
```nginx
gzip on;
gzip_min_length 0; # compresses every response, even tiny ones
```
---
## Good Example
```nginx
gzip on;
gzip_min_length 1000; # only compress responses >= 1KB
```
---
## Exceptions
Internal microservices where every byte is negligible — threshold can be increased to 4KB to further reduce CPU waste.
---
## Consequences Of Violation
Tiny error responses and status messages grow larger after compression. CPU cycles wasted compressing responses that would be faster to send uncompressed.

## Rule 4: Use gzip Compression Level 5-6
---
## Category
Performance
---
## Rule
Always set gzip compression level to 5 or 6 — never the maximum level of 9.
---
## Reason
Level 9 provides less than 2% additional compression compared to level 6 but uses 3x more CPU time. The marginal gain does not justify the CPU cost, especially under high concurrency.
---
## Bad Example
```nginx
gzip on;
gzip_comp_level 9; # 3x CPU for <2% better compression
```
---
## Good Example
```nginx
gzip on;
gzip_comp_level 5; # best CPU-to-compression ratio
```
---
## Exceptions
CPU-idle environments where bandwidth is extremely expensive (satellite, metered cellular).
---
## Consequences Of Violation
Server CPU saturation under load for negligible bandwidth savings. Reduced request throughput. Higher latency under concurrency.

## Rule 5: Generate ETags on Uncompressed Content
---
## Category
Reliability
---
## Rule
Always compute ETags on the uncompressed response content, not the compressed bytes.
---
## Reason
ETags represent content identity, not wire format. The same resource compressed with gzip vs brotli produces different compressed bytes but identical uncompressed content. ETags should match across compression variants.
---
## Bad Example
```php
// ETag computed after compression — changes per algorithm
$compressed = gzencode($content, 5);
$etag = md5($compressed); // different for gzip vs brotli
```
---
## Good Example
```php
// ETag computed on uncompressed content — stable across algorithms
$etag = md5($content);
$response->header('ETag', '"' . $etag . '"');
// Compression applied after ETag
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients that support brotli receive different ETags than clients using gzip. Conditional requests fail cross-algorithm. CDNs cache separate entries for each compression algorithm.

## Rule 6: Disable Compression on BREACH-Vulnerable Endpoints
---
## Category
Security
---
## Rule
Always disable response compression on any endpoint whose response body includes both user-controlled input and sensitive secrets (CSRF tokens, session IDs, API keys).
---
## Reason
The BREACH attack exploits compression ratio changes when attacker-controlled input is reflected in a compressed response alongside secrets. Disabling compression eliminates the side channel.
---
## Bad Example
```nginx
# OpenAPI endpoint reflects user input in compressed responses with CSRF token
gzip on; # compression enabled — BREACH vulnerability
```
---
## Good Example
```nginx
# Disable compression for vulnerable endpoints
location /api/tokens {
    gzip off;
}
```
---
## Exceptions
Internal-only endpoints not accessible to external attackers.
---
## Consequences Of Violation
Secret tokens recoverable through repeated requests and compression ratio analysis. CSRF tokens, API keys, or session IDs leaked to attackers.

## Rule 7: Verify Compression with curl Before Deploying
---
## Category
Testing
---
## Rule
Always verify compression configuration with `curl` before deploying to production to confirm headers and ratios are correct.
---
## Reason
Compression misconfiguration (wrong types, double compression, missing threshold) is silent — responses are still served, just uncompressed. Only explicit verification catches the issue.
---
## Bad Example
```bash
# No verification — assume compression works
git push production
# JSON responses not compressed — in production for weeks unnoticed
```
---
## Good Example
```bash
# Verify before deploy
curl -H "Accept-Encoding: gzip" -o /dev/null -w "%{size_download}" https://staging.api/users
curl -H "Accept-Encoding: identity" -o /dev/null -w "%{size_download}" https://staging.api/users
# Compare sizes — compressed should be 10-30% of uncompressed
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Compression not actually working despite configuration being deployed. Bandwidth costs 3-10x expected. Mobile performance worse than expected.
