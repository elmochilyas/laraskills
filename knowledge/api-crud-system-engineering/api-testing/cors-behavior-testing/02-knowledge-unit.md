# CORS Behavior Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** CORS Behavior Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
CORS (Cross-Origin Resource Sharing) tests verify that API endpoints correctly handle cross-origin requests — responding with the appropriate `Access-Control-*` headers for preflight OPTIONS requests and actual requests from allowed origins, and rejecting disallowed origins. Tests cover allowed origins, allowed methods, allowed headers, exposed headers, credentials, max-age, and preflight caching. Laravel's `fruitcake/laravel-cors` middleware or custom CORS middleware handles enforcement. Tests assert specific CORS headers exist on OPTIONS responses and that actual requests from allowed origins complete while disallowed origins get the appropriate error (typically dropped CORS headers).

---

## Core Concepts
CORS is a browser security mechanism: before a cross-origin request, the browser sends an OPTIONS preflight to check allowed origins, methods, and headers. The server responds with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and optionally `Access-Control-Max-Age` and `Access-Control-Allow-Credentials`. For simple requests (GET, HEAD, POST with certain content types), the preflight is skipped but `Access-Control-Allow-Origin` must still be present. Laravel's CORS configuration (`config/cors.php`) defines: `allowed_origins`, `allowed_methods`, `allowed_headers`, `exposed_headers`, `max_age`, `supports_credentials`. Tests assert these headers for both preflight and actual requests.

---

## Mental Models
CORS testing is **border patrol testing** — the API server is a country, and each origin is a passport. The OPTIONS preflight is the "can I enter?" inquiry. The `Access-Control-Allow-Origin` header is the stamped passport. Allowed origins get in (200 + headers), disallowed origins get turned away (no CORS headers, browser blocks the request). The browser is the immigration officer checking the stamped passport.

---

## Internal Mechanics
`fruitcake/laravel-cors` registers `HandleCors` middleware in the global middleware stack. On every request, `HandleCors::handle()` checks the `Origin` header. If the origin is in `allowed_origins`, it adds `Access-Control-Allow-Origin` to the response. For OPTIONS requests, it returns a 204 with CORS headers and stops further middleware execution. The configuration `allowed_origins` supports `*` wildcard for all origins. `supports_credentials: true` requires specific origins (not `*`). Laravel's `config/cors.php` also includes `paths` to restrict CORS to specific URI patterns.

---

## Patterns
- **Test preflight OPTIONS request**: `$this->optionsJson('/api/posts', [], ['Origin' => 'https://example.com'])` and assert CORS headers.
- **Test allowed origin**: `$response->assertHeader('Access-Control-Allow-Origin', 'https://example.com')`.
- **Test disallowed origin**: Request with a disallowed origin, assert CORS headers are missing.
- **Test preflight caching**: `$response->assertHeader('Access-Control-Max-Age', '86400')`.
- **Test credentialed requests**: With `supports_credentials: true`, assert `Access-Control-Allow-Credentials: true`.
- **Test allowed methods on preflight**: `$response->assertHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')`.

---

## Architectural Decisions
CORS is enforced at the browser level, not the server level — even if the server returns data to a disallowed origin, the browser blocks it. This means CORS tests in Laravel validate that the server sends the correct headers, but can't fully simulate the browser's enforcement. The architectural decision is that CORS testing is server-side header verification, not browser-level E2E testing. Use dedicated CORS test suites that send requests with various `Origin` headers and assert the response headers.

---

## Tradeoffs
| Tradeoff | Server-Side CORS Test | Browser E2E CORS Test |
|---|---|---|
| Speed | Fast (<100ms) | Slow (browser launch) |
| Coverage | Header verification | Header + browser enforcement |
| Reliability | High (deterministic) | Medium (browser quirks) |
| False negatives | Low | Higher (CORS + other browser issues) |

---

## Performance Considerations
CORS tests are lightweight — they're just OPTIONS or GET requests with custom `Origin` headers. Test all allowed origins in a dataset to minimize kernel boots. Batch CORS preflight and CORS actual-request tests in the same class.

---

## Production Considerations
CORS configuration must match API documentation exactly. A misconfigured `allowed_origins` that doesn't include the production frontend URL will break the entire application for all users — no API requests will work from the browser. Test all production origins (staging, production frontend URLs) explicitly. Wildcard `*` origins cannot be used with `supports_credentials: true` — this is a browser restriction, not a server restriction, but failing to configure it correctly will cause login flows to break. In production, audit CORS headers regularly — a missing `Access-Control-Allow-Origin` is a silent failure (browser blocks without clear error).

---

## Common Mistakes
- Testing CORS without sending an `Origin` header — the middleware only acts when `Origin` is present.
- Confusing preflight (OPTIONS) with actual request (GET/POST) — both need CORS headers but only OPTIONS gets `Allow-Methods` and `Allow-Headers`.
- Using `*` with `supports_credentials: true` — preflight returns `Access-Control-Allow-Origin: *` but the browser rejects credentialed requests with wildcard origins.
- Forgetting to test `Access-Control-Expose-Headers` — custom response headers (like `X-RateLimit-*`) are invisible to browser JS without this header.

---

## Failure Modes
- **Missing CORS headers on error responses**: API returns 500 but without CORS headers — browser can't read the error.
- **CORS middleware not applied to all paths**: The `paths` config restricts CORS to `/api/*` but a new route outside the pattern gets no CORS headers — frontend requests fail.
- **Preflight missing max-age**: Browser sends preflight on every request instead of caching — increased latency.
- **OPTIONS request returns 404**: No CORS middleware, or the route doesn't handle OPTIONS — preflight fails entirely.

---

## Ecosystem Usage
`fruitcake/laravel-cors` is the standard CORS package for Laravel (pre-Laravel 11). Laravel 11 uses `config/cors.php` with built-in CORS handling via `HandleCors` middleware. Spatie's `laravel-cors` provides alternative configuration. API Gateway services (AWS, Kong) may add or override CORS headers externally.

---

## Related Knowledge Units
### Prerequisites
- CORS Protocol (preflight, simple requests, credentialed requests)
- HTTP OPTIONS Method handling in Laravel

### Related Topics
- response-header-testing (Access-Control assertions)
- response-status-code-testing (OPTIONS returns 204)

### Advanced Follow-up Topics
- CORS with multiple allowed origins (dynamic origin resolution)
- Reverse proxy CORS handling (Nginx, CloudFront)
- CORS for file uploads and non-standard content types

---

## Research Notes
### Source Analysis
`fruitcake/laravel-cors` package `HandleCors` middleware. Laravel 11 built-in CORS at `Illuminate\Foundation\Http\Middleware\HandleCors`. Configuration in `config/cors.php` (published via `php artisan config:publish cors`).
### Key Insight
CORS is a browser-enforced protocol — server-side tests can only verify header correctness, not browser behavior. A passing CORS test does not guarantee the browser accepts the response.
### Version-Specific Notes
Laravel 11 includes `HandleCors` as a default middleware in the global stack. Laravel 10 and earlier required `fruitcake/laravel-cors`. The `config/cors.php` `paths` option was introduced in Laravel 8.x.
