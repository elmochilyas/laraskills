# Error Response Shape Testing — Rules

## Test Handler-Level Consistency, Not Per-Endpoint
---
## Category
Testing
---
## Rule
Test the error response shape at the exception handler level, not per endpoint.
---
## Reason
Error shape is controlled by a single file (the exception handler). Testing each endpoint's error shape individually is redundant — 20 endpoints × 4 error types = 80 tests that all validate the same handler logic. A handler-level test suite validates all error types globally with fewer tests and higher consistency assurance.
---
## Bad Example
```php
it('returns 401 shape on posts list', fn () => $this->getJson('/api/posts')->assertExactJson(['message' => 'Unauthenticated.']));
it('returns 401 shape on posts store', fn () => $this->postJson('/api/posts', [])->assertExactJson(['message' => 'Unauthenticated.']));
// Same assertion repeated for every endpoint
```
---
## Good Example
```php
it('returns consistent 401 shape', function () {
    $this->withoutExceptionHandling();
    $this->getJson('/api/posts')
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

// One representative test per error status — handler-level coverage
```
---
## Exceptions
Endpoints that intentionally override the default error handler (custom error responses for specific routes) need per-endpoint shape tests.
---
## Consequences Of Violation
Massive test duplication; high maintenance when error shapes change; false confidence — handler changes still require updating many tests.
---

## Test Each Error Status Code Shape
---
## Category
Testing
---
## Rule
Write a dedicated shape test for each error status code (401, 403, 404, 422, 429, 500).
---
## Reason
Each error status has a potentially different shape: 401/403/404/429 return `{"message": "..."}`, while 422 adds `{"errors": {...}}`. A test suite that covers only 422 misses structural differences in other error shapes. Each status must be independently verified.
---
## Bad Example
```php
it('validates error shape', function () {
    $this->postJson('/api/posts', [])
        ->assertStatus(422)
        ->assertJsonStructure(['message', 'errors']);
    // Never tests 401, 403, 404, 429, or 500 shapes
});
```
---
## Good Example
```php
it('returns 401 shape', fn () => $this->getJson('/api/posts')->assertExactJson(['message' => 'Unauthenticated.']));
it('returns 403 shape', fn () => $this->actingAs($user)->postJson('/api/admin/posts', [])->assertExactJson(['message' => 'This action is unauthorized.']));
it('returns 404 shape', fn () => $this->getJson('/api/posts/999999')->assertExactJson(['message' => 'Not Found.']));
it('returns 422 shape', fn () => $this->postJson('/api/posts', [])->assertJsonStructure(['message', 'errors']));
```
---
## Exceptions
Error statuses that the application never returns (e.g., no rate limiting configured → 429 never returned) may be omitted.
---
## Consequences Of Violation
Inconsistent error shapes across different error types; client error-handling code breaks for unverified status codes.
---

## Test Both Debug And Production Error Shapes
---
## Category
Testing
---
## Rule
Test error shapes under both `APP_DEBUG=true` and `APP_DEBUG=false` configurations.
---
## Reason
Stack traces with filenames and line numbers are useful in development but a critical security leak in production. The `APP_DEBUG` setting controls this behavior. Testing only the debug mode misses production leaks. Testing only production mode misses debugging feedback.
---
## Bad Example
```php
it('returns server error shape', function () {
    config(['app.debug' => false]);

    $this->getJson('/api/trigger-error')->assertJsonMissing(['file', 'line', 'trace']);
    // Never tests debug mode shape
});
```
---
## Good Example
```php
it('includes stack trace in debug mode', function () {
    config(['app.debug' => true]);

    $response = $this->withoutExceptionHandling(fn () => $this->getJson('/api/trigger-error'));
    expect($response->json('exception'))->not->toBeNull();
});

it('strips debug information in production', function () {
    config(['app.debug' => false]);

    $this->getJson('/api/trigger-error')
        ->assertServerError()
        ->assertJsonMissing(['file', 'line', 'trace', 'exception']);
});
```
---
## Exceptions
When the production environment always runs with `APP_DEBUG=false`, debug-mode tests may be omitted by project policy.
---
## Consequences Of Violation
Sensitive debug information leaked in production error responses; security vulnerability; compliance failure (data exposure).
---

## Assert Absence Of Sensitive Data
---
## Category
Security
---
## Rule
Use `assertJsonMissing` to verify that error responses do not contain email addresses, tokens, internal IDs, or SQL queries.
---
## Reason
Error responses are the most common source of accidental data leaks. Stack traces may include query parameters with emails; validation error messages may repeat user input including tokens. Asserting absence of sensitive patterns prevents data exposure.
---
## Bad Example
```php
it('strips debug info in production', function () {
    config(['app.debug' => false]);

    $this->getJson('/api/trigger-error')->assertServerError();
    // No assertion that sensitive data is absent
});
```
---
## Good Example
```php
it('strips sensitive data from error responses', function () {
    config(['app.debug' => false]);

    $this->withHeader('Authorization', 'Bearer secret-token-12345')
        ->getJson('/api/posts/999999')
        ->assertNotFound()
        ->assertJsonMissing(['secret-token-12345', 'user@example.com']);
});
```
---
## Exceptions
When error messages intentionally include user-provided input for debugging (e.g., validation errors returning the submitted value).
---
## Consequences Of Violation
PII exposure in error logs and responses; compliance violations (GDPR, CCPA); security incidents from leaked credentials.
---

## Test Custom Error Fields Are Always Present
---
## Category
Testing
---
## Rule
When adding custom error fields (trace_id, code, documentation_url), assert their presence and consistency across all error responses.
---
## Reason
Custom error fields that are present in 422 but missing in 401 confuse consumers that rely on them for error handling. The exception handler must apply custom fields uniformly — any exception type that bypasses the handler breaks the convention.
---
## Bad Example
```php
it('includes trace_id in error', function () {
    $this->postJson('/api/posts', [])
        ->assertStatus(422)
        ->assertJsonStructure(['message', 'errors', 'trace_id']);
    // Does not test that 401 also includes trace_id
});
```
---
## Good Example
```php
it('includes trace_id in every error response', function (string $method, string $uri) {
    $this->call($method, $uri)
        ->assertStatus(401)
        ->assertJsonStructure(['message', 'trace_id']);
})->with([
    ['GET', '/api/posts'],
    ['POST', '/api/posts'],
]);
```
---
## Exceptions
When custom fields are intentionally excluded from certain error types (e.g., no trace_id for validation errors due to payload size).
---
## Consequences Of Violation
Inconsistent error shape across endpoints; client logic that parses custom fields fails on untested error types.
---
