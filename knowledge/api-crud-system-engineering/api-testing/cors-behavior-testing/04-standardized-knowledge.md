# ECC Standardized Knowledge — CORS Behavior Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | CORS Behavior Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

CORS (Cross-Origin Resource Sharing) tests verify that API endpoints correctly handle cross-origin requests — responding with the appropriate `Access-Control-*` headers for preflight OPTIONS requests and actual requests from allowed origins, and rejecting disallowed origins. Tests cover allowed origins, allowed methods, allowed headers, exposed headers, credentials, max-age, and preflight caching. Laravel's `fruitcake/laravel-cors` middleware or built-in `HandleCors` middleware handles enforcement. Tests assert specific CORS headers exist on OPTIONS responses and that actual requests from allowed origins complete while disallowed origins get blocked (browser-level enforcement).

## Core Concepts

- **Preflight OPTIONS request**: Browser sends OPTIONS before actual cross-origin request
- **`Access-Control-Allow-Origin`**: Specifies which origins are permitted
- **`Access-Control-Allow-Methods`**: Specifies allowed HTTP methods (preflight only)
- **`Access-Control-Allow-Headers`**: Specifies allowed request headers (preflight only)
- **`Access-Control-Allow-Credentials`**: Whether credentials (cookies, auth headers) are allowed
- **`Access-Control-Max-Age`**: How long preflight result can be cached
- **`Access-Control-Expose-Headers`**: Which response headers browser JS can access
- **CORS configuration**: `config/cors.php` — `allowed_origins`, `allowed_methods`, `allowed_headers`, `exposed_headers`, `max_age`, `supports_credentials`, `paths`

## When To Use

- Any API consumed by browser-based frontends (SPA, mobile web)
- APIs with multiple frontend origins (staging, production, local dev)
- APIs supporting credentialed requests (cookies, authorization headers)
- Post-deployment validation of CORS configuration

## When NOT To Use

- Internal APIs consumed only by server-to-server clients
- APIs behind a reverse proxy that handles CORS (Nginx, CloudFront, API Gateway)
- Browser-level E2E CORS testing (use Cypress, Playwright instead)
- General response-header testing (covered by response-header-testing)

## Best Practices

- **Test preflight OPTIONS request**: `$this->optionsJson('/api/posts', [], ['Origin' => 'https://example.com'])` and assert CORS headers.
- **Test allowed origin**: `$response->assertHeader('Access-Control-Allow-Origin', 'https://example.com')`.
- **Test disallowed origin**: Request with disallowed origin, assert CORS headers are missing.
- **Test preflight caching**: `$response->assertHeader('Access-Control-Max-Age', '86400')`.
- **Test credentialed requests**: With `supports_credentials: true`, assert `Access-Control-Allow-Credentials: true`.
- **Test allowed methods on preflight**: `$response->assertHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')`.
- **Test CORS headers on error responses**: Ensure 500 errors still include CORS headers.

## Architecture Guidelines

- CORS is enforced at the browser level — server-side tests validate header correctness, not browser behavior.
- Use dedicated CORS test suites that send requests with various `Origin` headers and assert response headers.
- CORS configuration must match API documentation exactly — a misconfigured `allowed_origins` breaks the entire application for all users.
- Wildcard `*` origins cannot be used with `supports_credentials: true` — browser restriction.

## Performance Considerations

- CORS tests are lightweight — OPTIONS or GET requests with custom `Origin` headers.
- Test all allowed origins in a dataset to minimize kernel boots.
- Batch CORS preflight and CORS actual-request tests in the same class.

## Security Considerations

- A missing `Access-Control-Allow-Origin` is a silent failure — browser blocks without clear error.
- Test that CORS headers are present on error responses too — otherwise browser can't read the error.
- Never use wildcard `*` origins with `supports_credentials: true` — this is a browser security restriction.
- Ensure `Access-Control-Expose-Headers` includes all custom headers (e.g., `X-RateLimit-*`) that browser JS needs to read.

## Common Mistakes

- Testing CORS without sending an `Origin` header — middleware only acts when `Origin` is present.
- Confusing preflight (OPTIONS) with actual request (GET/POST) — both need CORS headers but only OPTIONS gets `Allow-Methods` and `Allow-Headers`.
- Using `*` with `supports_credentials: true` — preflight returns `Access-Control-Allow-Origin: *` but browser rejects credentialed requests with wildcard.
- Forgetting to test `Access-Control-Expose-Headers` — custom response headers are invisible to browser JS without this header.

## Anti-Patterns

- **Testing only preflight, not actual requests**: Preflight passes but the actual GET/POST request may miss CORS headers.
- **No CORS tests for error responses**: API returns 500 without CORS headers — browser can't read the error in the console.
- **Wildcard origins in production**: `Access-Control-Allow-Origin: *` — acceptable for public APIs but dangerous with credentials.

## Examples

```php
it('returns CORS headers for allowed origin', function () {
    $response = $this->optionsJson('/api/posts', [], [
        'Origin' => 'https://example.com',
        'Access-Control-Request-Method' => 'GET',
    ]);

    $response->assertStatus(200)
        ->assertHeader('Access-Control-Allow-Origin', 'https://example.com')
        ->assertHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->assertHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

it('allows actual request from allowed origin', function () {
    $response = $this->getJson('/api/posts', ['Origin' => 'https://example.com']);

    $response->assertHeader('Access-Control-Allow-Origin', 'https://example.com');
});

it('blocks disallowed origin', function () {
    $response = $this->getJson('/api/posts', ['Origin' => 'https://evil.com']);

    $response->assertHeaderMissing('Access-Control-Allow-Origin');
});
```

## Related Topics

- **Prerequisites**: CORS Protocol, HTTP OPTIONS Method handling in Laravel
- **Siblings**: response-header-testing, response-status-code-testing
- **Advanced**: Dynamic CORS origin resolution, Reverse proxy CORS handling, CORS for file uploads and non-standard content types

## AI Agent Notes

- CORS is a browser-enforced protocol — server-side tests can only verify header correctness, not browser behavior.
- Laravel 11 includes `HandleCors` as a default middleware. Laravel 10 and earlier required `fruitcake/laravel-cors`.
- The `config/cors.php` `paths` option (Laravel 8+) restricts CORS to specific URI patterns.

## Verification

- [ ] Preflight OPTIONS request returns correct CORS headers for allowed origins
- [ ] Actual requests from allowed origins include CORS headers
- [ ] Disallowed origins get no CORS headers (browser will block)
- [ ] Credentialed requests work when `supports_credentials: true`
- [ ] CORS headers are present on error responses (4xx, 5xx)
- [ ] `Access-Control-Expose-Headers` includes all custom response headers
