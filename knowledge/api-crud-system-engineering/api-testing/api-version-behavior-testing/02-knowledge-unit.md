# API Version Behavior Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** API Version Behavior Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
API version behavior tests verify that versioned endpoints return the correct responses for each version — asserting that v1 and v2 of the same route return different (or compatible) shapes, status codes, and behaviors. Tests cover URL-prefix versioning (`/api/v1/posts`, `/api/v2/posts`), header-based versioning (`Accept: application/vnd.api+json;version=2`), and query-parameter versioning (`?version=2`). Laravel supports versioning through route grouping, `Route::prefix('v1')`, and custom middleware. Tests assert that the correct version's controller is dispatched, the correct response shape is returned, and deprecated versions return appropriate deprecation headers.

---

## Core Concepts
API versioning is typically implemented via route prefixes: `Route::prefix('v1')->group(...)` and `Route::prefix('v2')->group(...)`. Each version group has its own controllers, form requests, and resources. Version behavior tests assert: v1 response returns v1-specific fields, v2 response returns v2-specific fields (additions or removals), v1 deprecated endpoints return `Sunset` or `Deprecation` headers, unsupported versions return 404 or 400, and header-based versioning correctly routes to the version controller. Shared behavior between versions (pagination shape, error format) should be tested in a shared test suite; version-specific behavior should be tested in per-version test classes.

---

## Mental Models
API version testing is **testing different model years of a car** — v1 of the Ford Mustang (1964) and v2 (2024) both have an engine and wheels (shared behavior), but the v2 has backup cameras and touchscreens (version-specific features). Tests for the shared features run on both versions; tests for specific features run on their respective version. A client running v1 should never receive a v2-specific feature (backward compatibility).

---

## Internal Mechanics
Each version group registers routes under a different prefix: `Route::prefix('v1')` maps to `App\Http\Controllers\Api\V1\PostController`. The `v1` controller returns `V1\PostResource`, while `v2` returns `V2\PostResource`. Feature tests target specific version URLs: `$this->get('/api/v1/posts')` and `$this->get('/api/v2/posts')`. The test class structure mirrors the version structure: `tests/Feature/Api/V1/PostsTest` and `tests/Feature/Api/V2/PostsTest`. Version-specific middleware (like `EnsureApiVersion`) reads the version from the header or prefix and sets the response format. `Sunset` and `Deprecation` headers are set by a middleware or explicitly in the route group.

---

## Patterns
- **Mirror version directory structure**: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`.
- **Shared base test class**: `ApiTestCase` with common assertions (error shape, pagination shape) extended by both V1 and V2 tests.
- **Per-version test traits**: `V1Assertions` trait for v1-specific assertions; `V2Assertions` trait for v2-specific.
- **Deprecation header tests**: `$response->assertHeader('Deprecation', 'true')` or `Sunset` header.
- **Route not found for unsupported version**: `$this->get('/api/v3/posts')->assertStatus(404)`.
- **Version-specific OpenAPI validation**: Contract tests against `openapi-v1.yaml` and `openapi-v2.yaml`.

---

## Architectural Decisions
The decision to use URL-prefix versioning (most common in Laravel) vs header-based or query-parameter versioning affects test structure. URL-prefix versioning makes version testing explicit — tests directly target `/api/v1/...`. Header-based versioning requires tests to set the `Accept` header on every request. URL-prefix is easier to test and debug (visible URL) but "pollutes" the URI space. Header-based is cleaner REST but harder to test (hidden version). Most Laravel APIs use URL-prefix for its testability.

---

## Tradeoffs
| Tradeoff | URL-Prefix Versioning | Header-Based Versioning |
|---|---|---|
| Test simplicity | High (visible version in URL) | Lower (must set Accept header) |
| Debugging | Easy (curl /api/v1/...) | Harder (must set header) |
| URL pollution | Higher (version in every route) | Lower (clean URLs) |
| Cache key | Versioned automatically | Must include version in cache key |
| Default version | Must route or redirect | Can default to latest via middleware |

---

## Performance Considerations
Per-version test suites duplicate assertion logic — ensuring v1 and v2 have near-identical tests with version-specific assertions. Use PestPHP's `describe()` with `beforeEach` to set the version base URL and reduce repetition. Use shared traits for common assertions to avoid test code duplication. Maintain a `BaseApiTest` class with shared endpoint tests.

---

## Production Considerations
Version deprecation is soft — v1 endpoints continue to work but return `Deprecation` and `Sunset` headers. Tests must verify these headers appear on deprecated versions and are absent on current versions. When removing a version entirely, all v1 tests should be deleted and the route group removed. Never break a version without a deprecation period and corresponding test updates. Document version support duration in the API docs.

---

## Common Mistakes
- Copy-pasting tests between version test classes without adjusting version-specific assertions.
- Forgetting to version the OpenAPI spec — all versions validate against the same spec file.
- Testing shared behavior (error format, pagination) in every version test class instead of a shared base.
- Not testing that an unsupported version returns 404 (or appropriate error).
- Version-specific bug fixed in v2 but test not added to v1 suite to confirm the bug still exists in v1.

---

## Failure Modes
- **Version leakage**: A v1 controller accidentally includes a v2 field (extra data exposed).
- **Shared behavior regression**: A fix to the common middleware breaks pagination shape for all versions.
- **Missing deprecation headers**: v1 is deprecated but no headers inform the client.
- **Wrong version dispatched**: Header-based versioning middleware routes to v1 for a v2 `Accept` header.
- **Version routing ambiguity**: `/api/v1/posts` matches `Route::prefix('v1')->group(...)` but also matches a catch-all pattern.

---

## Ecosystem Usage
Laravel API versioning is commonly implemented with route prefixes. `Apiato` (a Laravel API starter kit) uses versioned containers. Spatie's `laravel-json-api` supports versioning. Laravel Nova uses URL-prefix versioning for its internal API.

---

## Related Knowledge Units
### Prerequisites
- Laravel Route Grouping (prefix, middleware per group)
- API Versioning Strategies (URL, header, query parameter)

### Related Topics
- feature-test-structure (per-version test organization)
- response-shape-testing (version-specific shape assertions)
- contract-testing-with-openapi (per-version spec files)

### Advanced Follow-up Topics
- API version deprecation automation
- Canary release testing for new API versions
- Backward compatibility contract testing

---

## Research Notes
### Source Analysis
Laravel `Route::prefix('v1')->group(...)` and `Route::name('api.v1.')->group(...)`. Version-specific middleware can inspect `request()->route()->getPrefix()` to determine the version.
### Key Insight
API version testing is structural as much as behavioral — the test directory structure should mirror the version directory structure, making it visually obvious which version each test belongs to.
### Version-Specific Notes
Laravel 11 route grouping syntax supports `Route::prefix('v1')->as('api.v1.')->group(...)`. PestPHP 2.x supports `describe('V1')` for version grouping. The `Deprecation` header (RFC 8594) and `Sunset` header (RFC 8594) are standardized for API deprecation signaling.
