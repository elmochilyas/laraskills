# Response Header Testing — Rules

## Assert Content-Type On Every Endpoint
---
## Category
Testing
---
## Rule
Assert `Content-Type: application/json` on every API endpoint response.
---
## Reason
A misconfigured route or middleware can return HTML instead of JSON without changing the status code. Without a Content-Type assertion, a 200 OK HTML response passes body-based assertions but breaks every client that expects JSON.
---
## Bad Example
```php
it('lists posts', function () {
    $this->getJson('/api/posts')
        ->assertOk()
        ->assertJsonStructure(['data' => ['*' => ['id']]]);
    // No Content-Type assertion — a route returning HTML would pass
});
```
---
## Good Example
```php
it('lists posts', function () {
    $this->getJson('/api/posts')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/json')
        ->assertJsonStructure(['data' => ['*' => ['id']]]);
});
```
---
## Exceptions
Endpoints that return non-JSON responses (file downloads, streaming, HTML views) should assert the appropriate Content-Type.
---
## Consequences Of Violation
Client JSON parsing fails with cryptic error; production debugging identifies the real cause only after logging.
---

## Test Location Header On Created Resources
---
## Category
Testing
---
## Rule
Assert the `Location` header equals the correct resource URL after every successful resource creation.
---
## Reason
The `Location` header is the standard way for REST APIs to indicate where the newly created resource can be accessed. It's easy to forget the `->header('Location', $url)` call in the controller. A missing or incorrect Location header breaks client redirect logic and HATEOAS navigation.
---
## Bad Example
```php
it('creates a post', function () {
    $this->postJson('/api/posts', $data)
        ->assertCreated();
    // No Location header assertion
});
```
---
## Good Example
```php
it('creates a post', function () {
    $response = $this->postJson('/api/posts', $data);

    $response->assertCreated();
    $response->assertHeader('Location', '/api/posts/1');
    $this->assertDatabaseHas('posts', ['id' => 1]);
});
```
---
## Exceptions
Endpoints that do not create a single identifiable resource (bulk creation, async operations) may omit Location header.
---
## Consequences Of Violation
Client redirect logic fails; API consumers cannot automatically navigate to new resources; RESTful contract violation.
---

## Assert Security Headers In Dedicated Suite
---
## Category
Security
---
## Rule
Test security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options) in a dedicated test suite that runs against all endpoints.
---
## Reason
Security headers are global middleware concerns, not per-endpoint logic. A dedicated suite covering all endpoints with a single dataset guards against accidental disabling or removal of security headers. Per-endpoint tests would miss omissions on newly added routes.
---
## Bad Example
```php
it('has security headers on posts', function () {
    $this->getJson('/api/posts')
        ->assertHeader('X-Frame-Options', 'DENY');
    // Only tests one endpoint — new route may miss security headers
});
```
---
## Good Example
```php
$allApiRoutes = [
    ['GET', '/api/posts'],
    ['GET', '/api/posts/1'],
    ['POST', '/api/posts'],
    // ... all routes
];

it('includes security headers on all routes', function (string $method, string $uri) {
    $this->call($method, $uri)->assertHeader('X-Content-Type-Options', 'nosniff');
    // Run as first CI stage — fast header-only checks
})->with($allApiRoutes);
```
---
## Exceptions
Public endpoints (webhooks, file downloads) that intentionally omit certain security headers should be listed as exceptions in the test dataset.
---
## Consequences Of Violation
Security header gaps on specific routes; vulnerability to clickjacking, MIME sniffing, or XSS; compliance audit failures.
---

## Assert Header Absence Where Expected
---
## Category
Testing
---
## Rule
Use `assertHeaderMissing` to verify that debug headers are stripped and that error responses don't include location or cache headers.
---
## Reason
Presence of the `X-Debug-Bar` header, a `Location` header on validation errors, or `Cache-Control: public` on authenticated endpoints indicates a misconfiguration. Asserting header absence catches production-incorrect behavior that status and body assertions would miss.
---
## Bad Example
```php
it('rejects invalid input', function () {
    $this->postJson('/api/posts', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['title']);
    // No assertion that Location header is absent
});
```
---
## Good Example
```php
it('rejects invalid input', function () {
    $this->postJson('/api/posts', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['title'])
        ->assertHeaderMissing('Location')    // No redirect after failed validation
        ->assertHeaderMissing('X-Debug-Bar'); // Debug headers stripped
});
```
---
## Exceptions
When the application intentionally includes custom headers in all responses (including errors), test for their presence explicitly.
---
## Consequences Of Violation
Debug headers leaked to production clients; accidental redirect locations exposed in error responses; cache headers applied to sensitive data.
---

## Use BeforeEach For Common Header Assertions
---
## Category
Performance
---
## Rule
Use PestPHP `beforeEach` or a shared test trait for common header assertions across all endpoints.
---
## Reason
Content-Type, CORS, and security headers are identical across all endpoints. Asserting them in every test method duplicates code and creates maintenance overhead. A single `beforeEach` block ensures every test implicitly validates these common headers.
---
## Bad Example
```php
it('lists posts', function () {
    $this->getJson('/api/posts')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/json');
});

it('shows a post', function () {
    $this->getJson('/api/posts/1')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/json');
});
// Content-Type assertion duplicated in every test
```
---
## Good Example
```php
beforeEach(function () {
    $this->withoutExceptionHandling();
});

uses()->group('api-headers')->beforeEach(function () {
    $this->response->assertHeader('Content-Type', 'application/json');
});
```
---
## Exceptions
When specific endpoints intentionally return different Content-Type values (file downloads, streaming).
---
## Consequences Of Violation
Redundant test code; common header assertions inconsistently applied; new endpoints may miss common header coverage.
---
