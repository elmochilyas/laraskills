# ECC Standardized Knowledge — Error Response Shape Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Error Response Shape Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Error response shape tests assert that every error response (4xx and 5xx) follows a consistent JSON structure across all endpoints. A uniform error shape — typically `{"message": "...", "errors": {...}}` for 422 or `{"message": "..."}` for others — is essential for client-side error handling. Tests verify that the error response has the correct top-level keys, error key naming conventions, message formats, and that debug information is stripped in production-like environments. Laravel's exception handler is the central control point for error shape consistency.

## Core Concepts

- **401 shape**: `{"message": "Unauthenticated."}`
- **403 shape**: `{"message": "This action is unauthorized."}`
- **404 shape**: `{"message": "Not Found."}`
- **422 shape**: `{"message": "The given data was invalid.", "errors": {"field": ["message"]}}`
- **429 shape**: `{"message": "Too Many Attempts."}`
- **500 shape in production**: `{"message": "Server Error"}` (no stack trace)
- **assertJsonStructure**: Verifies top-level keys exist
- **assertExactJson / assertJsonFragment**: Verifies exact or partial error shape
- **Handler customization**: `App\Exceptions\Handler` or `Exceptions` class (Laravel 11) controls error shapes

## When To Use

- Every endpoint that can return error responses (all endpoints)
- API contracts that specify error response structure
- Client SDKs that parse error responses programmatically
- Post-deployment validation of error shape consistency

## When NOT To Use

- The specific conditions that trigger errors (covered by auth-failure, validation-failure, not-found KUs)
- Response shape for success responses (covered by response-shape-testing)
- Error message content localization (i18n of error messages)

## Best Practices

- **Test each error status code shape**: One test per error status (401, 403, 404, 422, 429, 500) asserting the exact JSON structure.
- **Use datasets for error shape coverage**: `it('returns :status shape', fn($status, $shape) => ...)->with('errorShapes')`.
- **Test both debug and production error shapes**: `APP_DEBUG=true` tests include stack traces; `APP_DEBUG=false` tests exclude them.
- **Assert absence of sensitive data**: `$response->assertJsonMissing(['email' => 'user@example.com'])` in error responses.
- **Test custom error key conventions**: If your API uses `{"error": {...}, "code": "VALIDATION_ERROR"}` instead of defaults, assert that convention everywhere.

## Architecture Guidelines

- Error shape consistency is enforced by a single file (Exception Handler) — test the handler, not per-endpoint.
- Custom error shapes (adding `code`, `trace_id`, `status`) must be applied consistently in the handler, tested, and documented.
- Error shapes should be versioned — v1 and v2 may differ, but all endpoints within a version must be consistent.
- Publish the error shape as part of API documentation for client SDK generation.

## Performance Considerations

- Error response shape tests are cheap — trigger errors with malformed requests.
- Run them in a dedicated test suite that validates the exception handler globally, not per-endpoint.
- No complex setup required; these are fast validation tests.

## Security Considerations

- Never include stack traces, SQL queries, or internal IDs in production error messages.
- `APP_DEBUG=false` must strip all debug information from error responses.
- Test that sensitive data (user emails, tokens, internal IDs) does not appear in error messages.
- Log full exception details server-side but return only the safe subset to the client.

## Common Mistakes

- Custom error shapes only applied to some exception types — others fall through to defaults, creating inconsistency.
- Including `exception` and `file` keys in production error responses (debug info leak).
- Making 422 error responses structurally different from 401/403 responses (inconsistent top-level keys).
- Forgetting to test the error shape for 500 errors (unguarded, may expose stack traces).

## Anti-Patterns

- **Per-endpoint error shape testing**: Testing each endpoint's error shape individually instead of testing the handler globally — redundant and misses consistency issues.
- **Over-customization**: Adding too many custom error fields (`code`, `status`, `trace_id`, `error_id`, `documentation_url`) — increases client parsing complexity.
- **Ignoring default shapes**: Assuming Laravel's default error shapes are correct without testing — framework upgrades may change default shapes.

## Examples

```php
it('returns 401 error shape', function () {
    $response = $this->getJson('/api/posts');
    $response->assertStatus(401);
    $response->assertExactJson(['message' => 'Unauthenticated.']);
});

it('returns 422 error shape', function () {
    $response = $this->postJson('/api/posts', []);
    $response->assertStatus(422);
    $response->assertJsonStructure(['message', 'errors']);
    $response->assertJsonFragment(['message' => 'The given data was invalid.']);
});

it('strips stack traces in production', function () {
    config(['app.debug' => false]);
    $response = $this->getJson('/api/error-trigger');
    $response->assertStatus(500);
    $response->assertJsonMissing(['file', 'line', 'trace']);
});
```

## Related Topics

- **Prerequisites**: Laravel Exception Handling, response-shape-testing
- **Siblings**: response-status-code-testing, validation-failure-testing, authentication-failure-testing, authorization-failure-testing
- **Advanced**: JSON:API error shape conformance, Error code taxonomy, Client-side error parsing and i18n

## AI Agent Notes

- Error shape testing is often overlooked — prioritize testing handler-level consistency over per-endpoint error checks.
- When customizing error shapes, ensure all exception types are covered (not just ValidationException).
- The 422 shape with `errors` key is structurally different from other error shapes — this is intentional by Laravel but must be documented.

## Verification

- [ ] Each error status (401, 403, 404, 422, 429, 500) has a dedicated shape test
- [ ] Production error shapes exclude stack traces and debug information
- [ ] Custom error shapes are applied consistently across all endpoints
- [ ] Error shape is documented in the OpenAPI spec for all error responses
- [ ] All endpoints within a version return the same error shape structure
