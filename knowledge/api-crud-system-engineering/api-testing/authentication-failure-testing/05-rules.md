# Authentication Failure Testing — Rules

## Test Every Authenticated Endpoint For 401
---
## Category
Testing
---
## Rule
Every non-public API endpoint must have at least one test proving it rejects unauthenticated requests with 401.
---
## Reason
Authentication middleware misconfiguration (wrong guard, missing middleware, route ordering) is the most common Laravel security bug. One test per protected endpoint catches this at the feature level, validating the full middleware-to-controller pipeline.
---
## Bad Example
```php
// Only testing happy path — no auth-failure test for the create endpoint
it('creates a post', fn () => $this->actingAs($user)->postJson('/api/posts', $data)->assertCreated());
```
---
## Good Example
```php
it('rejects unauthenticated post creation', fn () => $this->postJson('/api/posts', $data)->assertUnauthorized());

it('creates a post when authenticated', fn () => $this->actingAs($user)->postJson('/api/posts', $data)->assertCreated());
```
---
## Exceptions
Public endpoints (login, register, health-check) do not require auth-failure tests.
---
## Consequences Of Violation
Authentication middleware may be missing on production routes; unauthenticated users access protected data; security breach in CI-passing code.
---

## Assert Error Body, Not Just Status
---
## Category
Testing
---
## Rule
Always assert the error response body structure alongside the 401 status code.
---
## Reason
A 401 status alone does not verify the error shape is consistent. Inconsistent error shapes (some returning `{"message": "Unauthenticated."}`, others returning `{"error": "Token missing"}`) break client-side error handling.
---
## Bad Example
```php
it('rejects unauthenticated request', fn () => $this->getJson('/api/posts')->assertStatus(401));
```
---
## Good Example
```php
it('rejects unauthenticated request', function () {
    $this->getJson('/api/posts')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Unauthenticated.']);
});
```
---
## Exceptions
When the test suite has a dedicated global error-shape test that covers all endpoints (see Error Response Shape Testing KU).
---
## Consequences Of Violation
Inconsistent error shapes; client SDKs break parsing errors; debugging requires manual endpoint-by-endpoint inspection.
---

## Separate Missing-Token From Invalid-Token Tests
---
## Category
Testing
---
## Rule
Write separate tests for missing Authorization header, malformed token, expired token, and revoked token scenarios.
---
## Reason
Each token-validation condition follows a different code path in Sanctum/Passport. A missing token returns 401 from middleware, while an expired token may reach the controller before failing. Grouping them masks differences in behavior.
---
## Bad Example
```php
it('rejects bad tokens', function () {
    $this->withHeaders(['Authorization' => 'Bearer invalid'])->getJson('/api/posts')->assertUnauthorized();
    $this->getJson('/api/posts')->assertUnauthorized();
    // Expired and revoked scenarios omitted entirely
});
```
---
## Good Example
```php
it('rejects missing token', fn () => $this->getJson('/api/posts')->assertUnauthorized());
it('rejects malformed token', fn () => $this->withHeader('Authorization', 'Bearer invalid')->getJson('/api/posts')->assertUnauthorized());
it('rejects expired token', function () {
    $token = User::factory()->create()->createToken('test', ['*'], now()->subDay());
    $this->withHeader('Authorization', "Bearer {$token->plainTextToken}")->getJson('/api/posts')->assertUnauthorized();
});
it('rejects revoked token', function () {
    $token = User::factory()->create()->createToken('test');
    $token->accessToken->forceFill(['revoked_at' => now()])->save();
    $this->withHeader('Authorization', "Bearer {$token->plainTextToken}")->getJson('/api/posts')->assertUnauthorized();
});
```
---
## Exceptions
When the authentication system guarantees identical behavior across all failure modes (e.g., a custom middleware that normalizes the response).
---
## Consequences Of Violation
Expired or revoked tokens may return non-401 responses (e.g., 500 or unexpected redirects); inconsistent user experience across auth failure modes.
---

## Parameterize Protected Endpoints
---
## Category
Testing
---
## Rule
Use PestPHP `with()` datasets or PHPUnit `@dataProvider` to test authentication failure against all protected endpoints.
---
## Reason
Writing a separate auth-failure test for each of 20+ endpoints is repetitive and encourages skipping coverage. A data-driven approach ensures every protected endpoint is covered with minimal code.
---
## Bad Example
```php
it('rejects unauthenticated posts index', fn () => $this->getJson('/api/posts')->assertUnauthorized());
it('rejects unauthenticated posts store', fn () => $this->postJson('/api/posts', [])->assertUnauthorized());
// Repeat for 18 more endpoints...
```
---
## Good Example
```php
$protectedEndpoints = [
    ['GET', '/api/posts'],
    ['POST', '/api/posts'],
    ['GET', '/api/posts/1'],
    ['PUT', '/api/posts/1'],
    ['DELETE', '/api/posts/1'],
];

it('rejects unauthenticated requests on :method :uri', function (string $method, string $uri) {
    $this->call($method, $uri)->assertUnauthorized();
})->with($protectedEndpoints);
```
---
## Exceptions
Endpoints with different auth guard requirements or different middleware stacks should be in separate datasets.
---
## Consequences Of Violation
New endpoints added without auth-failure tests; authentication coverage gaps grow silently over time.
---

## Never Use WithoutMiddleware On Auth Tests
---
## Category
Testing
---
## Rule
Never use `withoutMiddleware` in tests that verify authentication behavior.
---
## Reason
`withoutMiddleware('auth')` bypasses the exact middleware under test. Tests that use it pass even without proper authentication, giving a false sense of security.
---
## Bad Example
```php
it('rejects unauthenticated request', function () {
    $this->withoutMiddleware(); // Bypasses auth middleware entirely
    $this->getJson('/api/posts')->assertUnauthorized(); // Will fail — no middleware to block
});
```
---
## Good Example
```php
it('rejects unauthenticated request', function () {
    $this->getJson('/api/posts')->assertUnauthorized();
});
```
---
## Exceptions
Non-auth tests (validation, shape, pagination) may use `withoutMiddleware` if authentication is irrelevant to the test concern.
---
## Consequences Of Violation
False-positive auth tests; authentication misconfiguration undetected; production data exposed.
---
