# Phase 5: Rules — CORS Configuration

> Generated from 04-standardized-knowledge.md

## Never Use Wildcard Origin with Credentials
---
## Category
Security
---
## Rule
Never set `allowed_origins: ['*']` when `supports_credentials` is `true`.
---
## Reason
The CORS specification explicitly forbids the wildcard origin with credentials. Browsers reject responses where `Access-Control-Allow-Origin: *` is combined with `Access-Control-Allow-Credentials: true`.
---
## Bad Example
```php
// config/cors.php
'allowed_origins' => ['*'],
'supports_credentials' => true,
```

---
## Good Example
```php
'allowed_origins' => ['https://app.example.com'],
'supports_credentials' => true,
```

---
## Exceptions
Truly public APIs with no authentication — but then credentials should be `false`.
---
## Consequences Of Violation
All browser requests with credentials fail CORS; cryptic CORS errors in the browser console.

---
## Whitelist Explicit Origins in Production
---
## Category
Security
---
## Rule
Always use an explicit whitelist of known origins in production. Avoid dynamic origin matching unless multi-tenant architecture requires it.
---
## Reason
Dynamic origin matching (reading from database or using closures) adds latency and risk of origin injection. A static whitelist is auditable, cacheable, and eliminates misconfiguration.
---
## Bad Example
```php
'allowed_origins' => [request()->header('Origin')],
```

---
## Good Example
```php
'allowed_origins' => [
    'https://app.example.com',
    'https://admin.example.com',
],
```

---
## Exceptions
Multi-tenant SaaS platforms where tenants have custom domains — cache the allowed origins list for performance.
---
## Consequences Of Violation
Origin injection vulnerability; increased request latency from dynamic resolution.

---
## Include Authorization and Content-Type in Allowed Headers
---
## Category
Framework Usage
---
## Rule
Always include `Authorization` and `Content-Type` in the `allowed_headers` CORS configuration.
---
## Reason
Authenticated API requests send the `Authorization: Bearer` header, and mutating requests send `Content-Type: application/json`. Missing either causes preflight failure for all authenticated or mutating requests.
---
## Bad Example
```php
'allowed_headers' => ['X-CSRF-TOKEN'],
// Authorization header missing — authenticated requests fail
```

---
## Good Example
```php
'allowed_headers' => ['Authorization', 'Content-Type', 'X-CSRF-TOKEN', 'X-Requested-With'],
```

---
## Exceptions
No common exceptions. Authorization and Content-Type are required for any real API.
---
## Consequences Of Violation
Authenticated API calls from browsers fail at the CORS preflight check.

---
## Include OPTIONS in Allowed Methods
---
## Category
Framework Usage
---
## Rule
Always include `OPTIONS` in the `allowed_methods` CORS configuration.
---
## Reason
Browsers send a preflight `OPTIONS` request before non-simple requests. If `OPTIONS` is not in allowed methods, the preflight gets a 404 and the actual request never executes.
---
## Bad Example
```php
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
// OPTIONS missing — preflight requests fail
```

---
## Good Example
```php
'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
```

---
## Exceptions
Simple requests only (GET, HEAD, POST with safelisted headers) — rare for real APIs.
---
## Consequences Of Violation
All non-simple browser requests (most real API calls) fail with CORS errors.

---
## Set Access-Control-Max-Age to 86400 in Production
---
## Category
Performance
---
## Rule
Always set `Access-Control-Max-Age: 86400` (24 hours) in production CORS configuration.
---
## Reason
Preflight caching reduces OPTIONS request volume from one per request to one per origin per day. Without caching, every cross-origin request triggers an OPTIONS preflight, doubling request count.
---
## Bad Example
```php
// No Max-Age set — every request triggers preflight
```

---
## Good Example
```php
// config/cors.php
// Laravel 11 uses cors config — no direct Max-Age setting in config file
// Set via middleware or ensure proxy handles it
$response->headers->set('Access-Control-Max-Age', 86400);
```

---
## Exceptions
Development environments where CORS config changes frequently — use shorter Max-Age (600) to avoid stale caches.
---
## Consequences Of Violation
Doubled request latency for every API call; unnecessary OPTIONS traffic on the server.

---
## Expose Rate Limit Headers via CORS
---
## Category
Framework Usage
---
## Rule
Always expose rate limit headers via `Access-Control-Expose-Headers` in the CORS configuration.
---
## Reason
Browser clients cannot read `X-RateLimit-*` headers unless explicitly exposed via CORS. Without exposure, client-side backoff logic cannot function.
---
## Bad Example
```php
// Rate limit headers set but not exposed — browser clients cannot read them
```

---
## Good Example
```php
// config/cors.php
'exposed_headers' => [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
],
```

---
## Exceptions
No common exceptions. Exposing rate limit headers is best practice for any public API.
---
## Consequences Of Violation
Browser-based clients cannot implement intelligent backoff; poor user experience on rate-limited endpoints.

---
## Handle CORS in One Layer Only
---
## Category
Architecture
---
## Rule
Always handle CORS in either Laravel OR the reverse proxy (Nginx, Cloudflare), never both.
---
## Reason
Dual CORS handling causes duplicated or conflicting headers. The browser may reject responses with multiple `Access-Control-Allow-Origin` headers.
---
## Bad Example
```php
// Laravel sends CORS headers AND Nginx is configured to add them
```

---
## Good Example
```php
// Choose one:
// Option A: Laravel handles CORS (disable in Nginx)
// Option B: Nginx handles CORS (disable in Laravel config/cors.php)

// Laravel only:
'paths' => ['api/*'],
```

---
## Exceptions
When using Laravel as an upstream behind a CORS-handling gateway — disable CORS in Laravel entirely.
---
## Consequences Of Violation
CORS errors from duplicated headers; debugging confusion; intermittent failures.

---
## Set Vary: Origin Header
---
## Category
Performance
---
## Rule
Always ensure the `Vary: Origin` header is included in responses (Laravel's CORS middleware includes this automatically — do not remove it).
---
## Reason
CDNs and caching proxies need `Vary: Origin` to cache separate copies of responses per origin. Without it, cached responses from one origin are served to another, potentially leaking data.
---
## Bad Example
```php
// Manually stripping Vary headers — breaks CDN caching per origin
$response->headers->remove('Vary');
```

---
## Good Example
```php
// Laravel's HandleCors middleware sets Vary: Origin automatically
// Do not remove or override it
```

---
## Exceptions
No common exceptions. Always include Vary: Origin for CORS-enabled responses.
---
## Consequences Of Violation
CDN serving wrong-origin cached data; cache poisoning between tenants.

---
## Never Use Trailing Slash in Origins
---
## Category
Design
---
## Rule
Always specify origins without trailing slashes or paths. Origins are `protocol + host + port` only.
---
## Reason
The CORS spec defines origin as `scheme + host + port`. Adding a trailing slash (`https://app.example.com/`) makes it an invalid origin, causing all requests to fail origin matching.
---
## Bad Example
```php
'allowed_origins' => ['https://app.example.com/'],
// Trailing slash — never matches browser Origin header
```

---
## Good Example
```php
'allowed_origins' => ['https://app.example.com'],
```

---
## Exceptions
No common exceptions. Origins never include paths.
---
## Consequences Of Violation
All CORS requests fail with origin mismatch; difficult to debug because the browser reports the origin correctly.
