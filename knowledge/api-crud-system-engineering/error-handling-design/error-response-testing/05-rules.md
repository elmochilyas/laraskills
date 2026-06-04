# Phase 5: Rules — Error Response Testing

## Rule: Test Error Shapes as API Contracts
---
## Category
Testing | Maintainability
---
## Rule
Always assert the exact JSON structure of the error envelope in error response tests; never test only the HTTP status code.
---
## Reason
Error responses are part of the API contract. A change to the error shape (field name, nesting, type) breaks clients silently — only shape assertions catch this.
---
## Bad Example
```php
$response = $this->postJson('/api/users', []);
$response->assertStatus(422);
// No shape assertion — shape could change without detection
```
---
## Good Example
```php
$response = $this->postJson('/api/users', []);
$response->assertStatus(422);
$response->assertJsonStructure([
    'error' => [
        'code',
        'message',
        'status',
        'detail' => ['fields' => ['email', 'name']],
    ],
]);
```
---
## Exceptions
Rapid prototyping endpoints; add shape assertions before the first consumer integration.
---
## Consequences Of Violation
Client-breaking shape changes go undetected in CI; production incidents when clients receive unexpected field structures.

---

## Rule: Always Test with APP_DEBUG=false for Production Mode
---
## Category
Testing | Security
---
## Rule
Always run a dedicated test suite with `APP_DEBUG=false` and `app.debug` disabled that validates no sensitive data leaks in any error response.
---
## Reason
Tests run with `APP_DEBUG=true` by default (phpunit.xml), which includes stack traces and debug data. Production error responses must be validated separately to ensure no internals leak.
---
## Bad Example
```php
// Default APP_DEBUG=true — passes but doesn't validate production safety
public function test_error_response(): void
{
    $response = $this->getJson('/api/users/999');
    $response->assertStatus(404);
    // Doesn't verify no sensitive data in production
}
```
---
## Good Example
```php
public function test_error_response_no_sensitive_data_in_production(): void
{
    app()->detectEnvironment(fn () => 'production');
    config(['app.debug' => false]);

    $response = $this->getJson('/api/users/999');
    $response->assertStatus(404);
    $response->assertJsonMissingPath('error.trace');
    $response->assertJsonMissingPath('error.file');
    $response->assertJsonMissingPath('error.line');
    $response->assertJsonMissingPath('debug');
}
```
---
## Exceptions
No common exceptions — production-mode error testing is mandatory for any deployable API.
---
## Consequences Of Violation
Sensitive data leaks go undetected until production; compliance violations discovered during audit; incident response required for information disclosure.

---

## Rule: Use Shared Assertion Traits to Avoid Duplication
---
## Category
Testing | Maintainability
---
## Rule
Always define reusable error assertion methods in a test trait (e.g., `AssertErrorResponse`); never duplicate error shape assertions across test classes.
---
## Reason
Shared assertions ensure consistent validation across all endpoint error tests and reduce maintenance when the envelope shape evolves.
---
## Bad Example
```php
// Same assertion duplicated in every test class
class UserTest extends TestCase
{
    public function test_validation(): void {
        $response->assertJsonStructure(['error' => ['code', 'message', 'status']]);
    }
}
class OrderTest extends TestCase
{
    public function test_validation(): void {
        $response->assertJsonStructure(['error' => ['code', 'message', 'status']]);
    }
}
```
---
## Good Example
```php
trait AssertErrorResponse
{
    protected function assertErrorShape(TestResponse $response, int $status, string $code): void
    {
        $response->assertStatus($status);
        $response->assertJsonStructure([
            'error' => ['code', 'message', 'status'],
        ]);
        $response->assertJson([
            'error' => ['code' => $code, 'status' => $status],
        ]);
    }
}

class UserTest extends TestCase
{
    use AssertErrorResponse;

    public function test_validation(): void {
        $this->assertErrorShape($response, 422, ErrorCodes::VALIDATION_ERROR);
    }
}
```
---
## Exceptions
No common exceptions — shared assertions always reduce duplication and improve consistency.
---
## Consequences Of Violation
Inconsistent assertion quality across test classes; missed shape changes when updating envelope; test maintenance burden grows linearly with endpoints.

---

## Rule: Test All Documented Error Modes per Endpoint
---
## Category
Testing | Reliability
---
## Rule
Always write a test case for every documented error mode of each endpoint; never ship an endpoint with only happy-path tests.
---
## Reason
Undocumented and untested error modes inevitably break in production. Error response behavior is as critical to the API contract as success response behavior.
---
## Bad Example
```php
// Only happy path tested — error modes unknown
public function test_create_user_success(): void { /* ... */ }
// Missing: validation error, auth error, duplicate email conflict
```
---
## Good Example
```php
public function test_create_user_success(): void { /* ... */ }
public function test_create_user_validation_error(): void { /* ... */ }
public function test_create_user_unauthenticated(): void { /* ... */ }
public function test_create_user_duplicate_email_conflict(): void { /* ... */ }
```
---
## Exceptions
Error modes that cannot be triggered in a test environment (e.g., disk full); document these explicitly.
---
## Consequences Of Violation
Production incidents from broken error responses; client teams discover undocumented error behavior; emergency fixes during business hours.

---

## Rule: Assert Headers in Error Response Tests
---
## Category
Testing | Framework Usage
---
## Rule
Always assert the presence and value of HTTP headers specific to error responses — `WWW-Authenticate`, `Retry-After`, `Content-Type` — in error response tests.
---
## Reason
Headers like `WWW-Authenticate` (401) and `Retry-After` (429) are mandatory per HTTP spec; omitting them breaks automated clients and HTTP compliance.
---
## Bad Example
```php
$response = $this->getJson('/api/user');
$response->assertStatus(401);
// Missing WWW-Authenticate header assertion
```
---
## Good Example
```php
$response = $this->getJson('/api/user');
$response->assertStatus(401);
$response->assertHeader('WWW-Authenticate', 'Bearer realm="api"');
$response->assertHeader('Content-Type', 'application/json');
```
---
## Exceptions
Error responses where headers do not carry spec-mandated values (e.g., 404, 500).
---
## Consequences Of Violation
HTTP spec non-compliance; automated clients fail to authenticate; rate-limited clients have no retry guidance.

---

## Rule: Use Data Providers for Error Scenario Matrices
---
## Category
Testing | Maintainability
---
## Rule
Always use PHPUnit data providers to iterate all endpoints and their known error modes when testing error responses; never write individual test methods per scenario.
---
## Reason
Data providers make it trivial to add a new endpoint or error mode without writing new test methods, and they ensure every endpoint has consistent error coverage.
---
## Bad Example
```php
// Duplicated logic per scenario
public function test_get_user_401(): void { /* ... */ }
public function test_get_user_404(): void { /* ... */ }
public function test_get_order_401(): void { /* ... */ }
public function test_get_order_404(): void { /* ... */ }
```
---
## Good Example
```php
public static function errorScenarios(): array
{
    return [
        ['GET', '/api/users/1', 401, ErrorCodes::USER_AUTH_UNAUTHENTICATED],
        ['GET', '/api/users/999', 404, ErrorCodes::USER_NOT_FOUND],
        ['POST', '/api/users', [], 422, ErrorCodes::VALIDATION_ERROR],
    ];
}

/** @dataProvider errorScenarios */
public function test_error_scenario(string $method, string $uri, int $status, string $code): void
{
    $response = $this->call($method, $uri);
    $this->assertErrorShape($response, $status, $code);
}
```
---
## Exceptions
Error scenarios that require complex setup (specific DB state, external mocks); use individual tests with clear names for these.
---
## Consequences Of Violation
Error test coverage gaps when new endpoints are added; higher test maintenance cost; inconsistent testing patterns across the team.

---

## Rule: Use Snapshot Testing for Stable Error Shapes
---
## Category
Testing | Maintainability
---
## Rule
Always use snapshot testing (`spatie/phpunit-snapshot-assertions`) for error shapes that change infrequently; never hardcode full JSON assertions for large, stable error shapes.
---
## Reason
Snapshot assertions update automatically when intentional shape changes are made and fail clearly when unexpected changes occur, reducing test maintenance.
---
## Bad Example
```php
$response->assertJson([
    'error' => [
        'code' => 'VALIDATION_ERROR',
        'message' => 'The given data was invalid.',
        'status' => 422,
        'detail' => ['fields' => ['email' => ['...']]],
    ],
]);
// Brittle — breaks on message localisation changes
```
---
## Good Example
```php
$response->assertStatus(422);
$response->assertJsonStructure(['error' => ['code', 'message', 'status', 'detail']]);
$this->assertMatchesJsonSnapshot($response->json());
// Snapshot updates via --update-snapshots when intentionally changed
```
---
## Exceptions
Error shapes with dynamic values (trace_id, timestamps); exclude dynamic fields before snapshot comparison.
---
## Consequences Of Violation
Brittle tests that fail on every localized message or minor format change; developers disable tests instead of updating them.

---

## Rule: Include Error Test Coverage in CI Gating
---
## Category
Testing | Reliability
---
## Rule
Always require error response tests to pass as part of CI gating; never deploy an endpoint without passing error tests.
---
## Reason
Error response regressions are as impactful as success response regressions. Without CI gating, error test coverage silently degrades over time.
---
## Bad Example
```php
// CI pipeline only runs unit and feature tests for happy paths
// Error response tests are not included in deploy gate
```
---
## Good Example
```php
// CI pipeline:
// 1. Unit tests
// 2. Feature tests (happy path)
// 3. Error response tests (with APP_DEBUG=false)
// 4. Deploy gate: ALL tests must pass
```
---
## Exceptions
No common exceptions — error testing is a core part of contract validation.
---
## Consequences Of Violation
Error response regressions reach production; client teams discover broken error handling in production; trust erosion.

---

## Rule: Test with Integration Tests, Not Unit Tests for Handler
---
## Category
Testing | Reliability
---
## Rule
Always write integration (HTTP) tests for error responses that exercise the full middleware and handler stack; never write unit tests that test the handler in isolation.
---
## Reason
Unit tests of the handler miss middleware effects — CSRF, authentication, rate limiting, and request formatting — that all impact the actual error response returned to the client.
---
## Bad Example
```php
// Unit test — doesn't exercise middleware stack
public function test_handler(): void
{
    $handler = app(Handler::class);
    $response = $handler->render(request(), new AuthenticationException());
    // Misses CsrfToken, TrimStrings, rate limit middleware effects
}
```
---
## Good Example
```php
// Integration test — full stack, real middleware
public function test_unauthenticated_error_response(): void
{
    $response = $this->getJson('/api/protected-resource');
    $response->assertStatus(401);
    $response->assertJsonStructure(['error' => ['code', 'message', 'status']]);
    $response->assertHeader('WWW-Authenticate');
}
```
---
## Exceptions
Handler unit tests for testing `classify()` or `resolveCode()` internal logic in isolation; still complemented by integration tests.
---
## Consequences Of Violation
Middleware-induced errors go untested; handler behavior in test differs from production; false confidence in error response correctness.
