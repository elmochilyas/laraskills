# CORS Behavior Testing — Rules

## Test Preflight OPTIONS Request
---
## Category
Testing
---
## Rule
Always test the preflight OPTIONS request with an `Origin` header and assert all CORS headers are returned.
---
## Reason
The browser sends a preflight OPTIONS request before cross-origin actual requests. If the preflight fails — missing `Access-Control-Allow-Origin`, wrong `Allow-Methods`, or missing `Allow-Headers` — the browser blocks the actual request. Testing the preflight is the only way to catch these failures.
---
## Bad Example
```php
it('allows CORS requests', function () {
    $this->getJson('/api/posts', ['Origin' => 'https://example.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://example.com');
    // Only tests actual request — preflight OPTIONS untested
});
```
---
## Good Example
```php
it('returns CORS headers on preflight', function () {
    $response = $this->optionsJson('/api/posts', [], [
        'Origin' => 'https://example.com',
        'Access-Control-Request-Method' => 'GET',
    ]);

    $response->assertStatus(200)
        ->assertHeader('Access-Control-Allow-Origin', 'https://example.com')
        ->assertHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->assertHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
```
---
## Exceptions
Simple requests (GET with no custom headers) do not trigger a preflight — the actual request test is sufficient for those.
---
## Consequences Of Violation
Browser blocks cross-origin requests despite correct actual-response CORS headers; debugging requires reading browser console network tab.
---

## Test Both Allowed And Disallowed Origins
---
## Category
Testing
---
## Rule
Test with an allowed origin (assert CORS headers present) and a disallowed origin (assert CORS headers absent).
---
## Reason
A CORS configuration that returns `Access-Control-Allow-Origin: *` for every origin (including malicious ones) exposes the API to cross-origin data theft. The disallowed-origin test verifies the origin whitelist is enforced, not just that the CORS middleware is active.
---
## Bad Example
```php
it('allows CORS', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
    // Does not test that evil.com is blocked
});
```
---
## Good Example
```php
it('allows trusted origin', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
});

it('blocks untrusted origin', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://evil.com'])
        ->assertHeaderMissing('Access-Control-Allow-Origin');
});
```
---
## Exceptions
When the API is intentionally public (no origin restrictions, `Access-Control-Allow-Origin: *`), disallowed-origin tests may be omitted.
---
## Consequences Of Violation
Security vulnerability — any website can read the API response; cross-origin data theft; CORS misconfiguration passes tests.
---

## Test CORS Headers On Error Responses
---
## Category
Security
---
## Rule
Assert that error responses (4xx and 5xx) include CORS headers.
---
## Reason
When an API returns a 500 error without CORS headers, the browser cannot read the error response — the client sees a network error instead of the actual error details. This makes production debugging for frontend developers nearly impossible.
---
## Bad Example
```php
it('returns CORS on success', function () {
    $this->getJson('/api/posts', ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
    // Error responses untested
});
```
---
## Good Example
```php
it('includes CORS headers on 404', function () {
    $this->getJson('/api/posts/999999', ['Origin' => 'https://trusted.com'])
        ->assertNotFound()
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
});

it('includes CORS headers on 500', function () {
    $this->getJson('/api/trigger-error', ['Origin' => 'https://trusted.com'])
        ->assertStatus(500)
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
});
```
---
## Exceptions
When CORS middleware runs early in the middleware stack (before error handling), all responses automatically get CORS headers.
---
## Consequences Of Violation
Browser displays generic network error instead of actual API error; frontend debugging severely impaired; user sees blank error state.
---

## Test Access-Control-Expose-Headers
---
## Category
Testing
---
## Rule
Assert that `Access-Control-Expose-Headers` includes all custom response headers the browser client needs to read.
---
## Reason
By default, browser JavaScript can only read simple response headers (Cache-Control, Content-Type, etc.). Custom headers like `X-RateLimit-Remaining`, `X-Request-Id`, or `Deprecation` are invisible without being explicitly listed in `Access-Control-Expose-Headers`.
---
## Bad Example
```php
it('returns CORS headers', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
    // Does not verify expose-headers includes rate-limit headers
});
```
---
## Good Example
```php
it('exposes rate-limit headers to browser', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Expose-Headers', function (string $value) {
            return str_contains($value, 'X-RateLimit-Remaining');
        });
});
```
---
## Exceptions
When no custom response headers need to be read by browser JavaScript, expose-headers may be omitted.
---
## Consequences Of Violation
Browser JavaScript cannot read rate-limit, pagination, or custom headers; frontend features silently broken; production debugging pain.
---

## Test Credentialed Requests
---
## Category
Testing
---
## Rule
When `supports_credentials: true`, test that preflight returns `Access-Control-Allow-Credentials: true` and actual requests include credentials.
---
## Reason
Credentialed CORS (cookies, authorization headers) has additional restrictions: `Access-Control-Allow-Origin` cannot be `*` and `Access-Control-Allow-Credentials` must be `true`. A misconfiguration that allows `*` origin with credentials will be blocked by the browser — testing is the only way to catch this.
---
## Bad Example
```php
// Tests CORS without credentials — misses credentialed-request configuration
it('allows CORS', function () {
    $this->optionsJson('/api/posts', [], ['Origin' => 'https://trusted.com'])
        ->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
});
```
---
## Good Example
```php
it('allows credentialed requests', function () {
    $response = $this->optionsJson('/api/posts', [], [
        'Origin' => 'https://trusted.com',
        'Access-Control-Request-Method' => 'GET',
    ]);

    $response->assertHeader('Access-Control-Allow-Origin', 'https://trusted.com');
    $response->assertHeader('Access-Control-Allow-Credentials', 'true');
    expect($response->headers->get('Access-Control-Allow-Origin'))->not->toBe('*');
});
```
---
## Exceptions
When `supports_credentials` is `false` (public API), credentialed request tests may be omitted.
---
## Consequences Of Violation
Browser blocks credentialed CORS requests; login-based SPAs cannot authenticate; `Access-Control-Allow-Origin: *` with credentials silently fails.
---
