# Response Status Code Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Response Status Code Testing
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Response status code tests assert that every endpoint returns the correct HTTP status code under every condition — success, created, no-content, unauthorized, forbidden, not-found, validation-error, too-many-requests, and server-error. Laravel provides `assertOk` (200), `assertCreated` (201), `assertNoContent` (204), `assertNotFound` (404), `assertForbidden` (403), `assertUnauthorized` (401), `assertStatus($code)` for any code, and PestPHP equivalents. Status codes are the first thing API consumers check — a wrong status code breaks client logic even if the response body is correct.

---

## Core Concepts
Every HTTP method has a canonical status code for success: GET returns 200, POST returns 201, PUT/PATCH returns 200, DELETE returns 204 (or 200 with body). Error codes follow standardized ranges: 400 for client errors, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 422 for validation errors, 429 for rate limited, 500 for server errors. `assertStatus($code)` is the generic assertion; convenience methods (`assertOk`, `assertCreated`, `assertNoContent`) improve readability. Test the status code before any other assertion — if the status is wrong, further assertions on the body are meaningless.

---

## Mental Models
Status codes are the **traffic lights of your API** — green (2xx) means go, yellow (4xx) means the client made a mistake, red (5xx) means the server broke. A test suite that doesn't verify status codes is like driving without checking traffic lights. Every possible condition maps to exactly one light color; the test enforces that mapping.

---

## Internal Mechanics
`assertOk()` compares `$response->status() === 200`. `assertCreated()` checks `=== 201`. `assertNoContent()` checks `=== 204`. `assertStatus($code)` is a direct equality check. The status code is set by Symfony's `Response` class (`Response::HTTP_OK`, `Response::HTTP_CREATED`, etc.). Laravel sets status codes via `response()->json($data, $status)` in controllers, or automatically via `Response::create()`. Exception handlers map exceptions to codes: `ModelNotFoundException`→404, `AuthenticationException`→401, `AuthorizationException`→403, `ValidationException`→422, `ThrottleRequestsException`→429, `NotFoundHttpException`→404.

---

## Patterns
- **Assert status first**: `$response->assertOk()->assertJsonStructure([...])` — chain status before shape.
- **Use convenience methods**: Prefer `assertCreated()` over `assertStatus(201)` for readability.
- **Map every condition to a status**: Each test variant asserts a specific status — success variant asserts 200, validation variant asserts 422, etc.
- **Test edge status codes**: 201 for store, 204 for delete, 206 for partial content (if used), 304 for not-modified (if caching).
- **Custom status assertions**: `assertRedirect()` for 302/301, or custom macros for business-specific status codes.

---

## Architectural Decisions
The HTTP status code is a fundamental part of the API contract — clients depend on it for conditional logic (e.g., retry on 429, redirect on 301). Testing status codes at the feature level (not unit) validates the entire middleware-to-controller-to-exception-handler pipeline. The same status code bug could originate in a controller (wrong `response()->json()` status), middleware (auth rejection status), or exception handler — only feature tests catch all three.

---

## Tradeoffs
| Tradeoff | Feature Status Test | Unit Status Test |
|---|---|---|
| Pipeline coverage | Full (controller + handler) | Partial (controller only) |
| Redundancy | Minimal (one assertion per condition) | High (mock status propagation) |
| Speed | Slower | Faster |
| Confidence | High | Low (mock coupling) |

---

## Performance Considerations
Status code assertions are the cheapest assertion type — they check a single integer on the response object without JSON decoding. Always assert status first in a chain; if status is wrong, further assertions won't execute (saves response parsing time). Group status assertions by endpoint (one test per endpoint per condition) to avoid unnecessary kernel boots.

---

## Production Considerations
Status codes must be consistent across API versions. A v1 endpoint returning 201 for store and v2 returning 200 is a breaking change. Include status code expectations in API documentation. In production, monitor 5xx status rates — a spike indicates unhandled exceptions. Monitor 429 rates for throttling effectiveness. The 204 response for delete is often forgotten — verify it in tests.

---

## Common Mistakes
- Returning 200 instead of 201 for resource creation.
- Returning 200 instead of 204 for resource deletion.
- Returning 403 when the correct code is 401 (authenticated but wrong — should be 401 if unauthenticated, 403 if unauthorized).
- Returning 500 for validation errors (uncaught `ValidationException`).
- Not distinguishing between `assertOk()` (200) and `assertStatus(200)` — they're identical, but `assertOk()` is more semantic.

---

## Failure Modes
- **Wrong controller status**: `return response()->json($post, 200)` on store — test expects 201, gets 200.
- **Missing exception mapping**: A third-party package throws a custom exception that the handler doesn't convert — results in 500 instead of the intended 4xx.
- **Middleware shadowing**: `auth:api` middleware returns 302 redirect (non-API) instead of 401 — test expects 401, gets 302.

---

## Ecosystem Usage
Laravel's test suite uses `assertStatus` extensively throughout. PestPHP provides `assertOk()`, `assertCreated()`, `assertNoContent()` as top-level helpers. `Symfony\Component\HttpFoundation\Response` defines all HTTP status code constants.

---

## Related Knowledge Units
### Prerequisites
- HTTP Status Code Semantics (RFC 7231, RFC 6585)
- feature-test-structure (chaining assertions)

### Related Topics
- happy-path-testing (2xx statuses)
- authentication-failure-testing (401 status)
- authorization-failure-testing (403 status)
- validation-failure-testing (422 status)
- rate-limit-testing (429 status)
- not-found-testing (404 status)

### Advanced Follow-up Topics
- Custom status code constants for business logic
- Status code deprecation across API versions
- HATEOAS status code patterns

---

## Research Notes
### Source Analysis
`Symfony\Component\HttpFoundation\Response` provides `HTTP_OK`, `HTTP_CREATED`, `HTTP_NO_CONTENT`, `HTTP_UNAUTHORIZED`, `HTTP_FORBIDDEN`, `HTTP_NOT_FOUND`, `HTTP_UNPROCESSABLE_ENTITY`, `HTTP_TOO_MANY_REQUESTS`, `HTTP_INTERNAL_SERVER_ERROR`. Laravel's `TestResponse` wraps these constants in convenience methods.
### Key Insight
Status code assertions are the highest-value-per-line test in an API suite — they catch the most obvious contract violation with the simplest assertion.
### Version-Specific Notes
Laravel 11 uses `Response::HTTP_*` constants throughout. `assertOk()` and friends are available since Laravel 5.5. PestPHP 2.x provides the same assertions as top-level functions.
