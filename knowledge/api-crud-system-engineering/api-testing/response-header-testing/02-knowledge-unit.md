# Response Header Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Response Header Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Response header tests assert that API endpoints return correct HTTP headers — `Content-Type`, `Cache-Control`, `X-Request-Id`, `X-RateLimit-*`, `Access-Control-Allow-Origin`, `Location` (for created resources), and custom application headers. Laravel's `assertHeader`, `assertHeaderMissing`, and `$response->headers->get()` verify header presence, values, and absence. Headers control caching, security (CSP, HSTS), content negotiation, rate limiting, and cross-origin behavior — testing them is essential for API reliability.

---

## Core Concepts
`TestResponse::assertHeader($name, $value)` asserts a header exists with the given value. `assertHeaderMissing($name)` asserts a header is absent. Access raw header data via `$response->headers->get('Content-Type')` or `$response->baseResponse->headers`. Common headers to test: `Content-Type: application/json` (all API responses), `Location` (POST creates — URL of new resource), `X-RateLimit-Remaining`, `X-RateLimit-Limit` (throttled endpoints), `Cache-Control: no-cache, private` (authenticated endpoints), `Access-Control-Allow-Origin` (CORS endpoints). Use `assertHeaderMissing('X-Debug-*')` in production-like tests to ensure debug headers are stripped.

---

## Mental Models
Headers are the **envelope of your API response** — the data inside (body) is the letter, but the envelope tells the client how to interpret, cache, secure, and route the response. Header tests verify the envelope is correctly addressed and stamped. A correctly addressed envelope with a wrong stamp (no CORS header, wrong content type) is useless.

---

## Internal Mechanics
`TestResponse::assertHeader()` calls `$this->baseResponse->headers->get($name)` and compares to the expected value. The `baseResponse` is `Illuminate\Http\Response` or `JsonResponse`, which extends Symfony's `Response`. Symfony stores headers in a `HeaderBag` with case-insensitive keys. `Content-Type` is set automatically by `response()->json()` to `application/json`. Custom headers are set via `header()` in middleware or `->withHeaders()` on the response object. CORS headers are typically set by a middleware package like `fruitcake/laravel-cors`. The `Location` header is set automatically by `response()->json($data, 201)` when no explicit location is provided, but must be set manually for resource creation.

---

## Patterns
- **Test security headers in a dedicated suite**: Group `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security` tests.
- **Assert Location header on creation**: `$response->assertStatus(201)->assertHeader('Location', '/api/posts/'.$post->id)`.
- **Assert Content-Type on every endpoint**: `$response->assertHeader('Content-Type', 'application/json')`.
- **Test header absence for error responses**: `$response->assertHeaderMissing('Location')` on validation errors.
- **Parameterize header expectations by endpoint type**: Collection endpoints get cache headers, member endpoints get no-cache.
- **Rate-limit headers**: `assertHeader('X-RateLimit-Remaining', $expectedRemaining)`.

---

## Architectural Decisions
Header testing at the feature level validates both the controller (which may set custom headers) and the middleware pipeline (which modifies/removes headers). A CORS test at the unit level (testing `HandleCors` middleware in isolation) misses the interaction with Laravel's response preparation. Feature-level header tests catch middleware ordering bugs that unit tests miss.

---

## Tradeoffs
| Tradeoff | Feature Header Test | Unit Header Test |
|---|---|---|
| Middleware interaction | Verified | Missed (isolated middleware) |
| Header manipulation order | Verified (real pipeline) | Mock-dependent |
| Test speed | Slower | Fast |
| Common bug detection | High (middleware ordering) | Low |

---

## Performance Considerations
Header assertions are cheap — they read from the response object without parsing JSON. Bundle header assertions into the same test method as status/shape assertions. Use PestPHP's `beforeEach` to assert common headers (Content-Type, CORS) in a `describe()` block for all endpoints.

---

## Production Considerations
Security headers are a production requirement — enforce with header tests that fail the build. Debug headers (`X-Debug-Bar`, `X-Inertia`) must be stripped in production — test in a production-like environment. CORS headers must match the allowed origins configuration — test with both allowed and disallowed origins. The `Location` header for created resources enables RESTful client workflows — a missing Location breaks auto-discovery.

---

## Common Mistakes
- Not testing the `Location` header after resource creation.
- Assuming `Content-Type` is always `application/json` — error responses from HTML middleware may return `text/html`.
- Testing CORS headers with the same origin (no cross-origin) — the header may be absent for same-origin requests.
- Forgetting that `assertHeader` is case-insensitive — testing `content-type` works but is misleading.

---

## Failure Modes
- **Missing CORS headers**: API client running in browser gets CORS error — `assertHeader('Access-Control-Allow-Origin')` catches.
- **Wrong Content-Type**: A non-API route responds with HTML instead of JSON — `assertHeader('Content-Type', 'application/json')` catches.
- **Missing security headers**: `X-Content-Type-Options: nosniff` absent — vulnerability detected.
- **Location header absent on created resource**: Client can't auto-navigate — `assertHeader('Location')` catches.

---

## Ecosystem Usage
Laravel Fortify, Jetstream, and Breeze all test header assertions. `fruitcake/laravel-cors` includes CORS header tests in its own suite. Spatie's `laravel-responsecache` modifies `Cache-Control` headers — header tests verify the caching contract. `Laravel Telescope`'s debug headers must be stripped in production — `assertHeaderMissing` validates this.

---

## Related Knowledge Units
### Prerequisites
- HTTP Headers (Content-Type, Cache-Control, CORS, Security)
- feature-test-structure (accessing response headers)

### Related Topics
- cors-behavior-testing (CORS-specific header tests)
- rate-limit-testing (X-RateLimit header assertions)
- response-shape-testing (body vs header concerns)

### Advanced Follow-up Topics
- Custom header propagation across microservices
- ETag and conditional request testing
- Header-based API versioning testing

---

## Research Notes
### Source Analysis
`Symfony\Component\HttpFoundation\ResponseHeaderBag` stores headers. `TestResponse::assertHeader()` is defined in `Illuminate\Testing\TestResponse`. `TestResponse::assertHeaderMissing()` verifies absence.
### Key Insight
Header tests catch production-critical misconfigurations (CORS, security, caching) that body tests miss entirely — they are the cheapest way to verify the response envelope.
### Version-Specific Notes
Laravel 11 uses `Symfony 7.x` `ResponseHeaderBag`. CORS handling depends on the middleware stack configuration. `assertHeader` and `assertHeaderMissing` have been available since Laravel 5.5.
