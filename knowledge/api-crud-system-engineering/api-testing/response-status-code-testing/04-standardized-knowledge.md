# ECC Standardized Knowledge — Response Status Code Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Response Status Code Testing |
| Difficulty | Foundation |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Response status code tests assert that every endpoint returns the correct HTTP status code under every condition. GET returns 200, POST returns 201, PUT/PATCH returns 200, DELETE returns 204. Error codes: 401 (unauth), 403 (forbidden), 404 (not found), 422 (validation), 429 (rate limit), 500 (server error). Status codes are the first thing API consumers check — a wrong code breaks client logic even with a correct body.

## Core Concepts

- **Convenience methods**: `assertOk()` (200), `assertCreated()` (201), `assertNoContent()` (204), `assertNotFound()` (404), `assertForbidden()` (403), `assertUnauthorized()` (401).
- **Generic method**: `assertStatus($code)` for any status code.
- **Canonical CRUD codes**: index/show=200, store=201, update=200, destroy=204.
- **Error code mapping**: `ModelNotFoundException`->404, `AuthenticationException`->401, `AuthorizationException`->403, `ValidationException`->422, `ThrottleRequestsException`->429.
- **Assert status first**: Chain status before shape before content — if status is wrong, further assertions are meaningless.

## When To Use

- Every test — status code is the first assertion in every API test.
- Regression testing after middleware or exception handler changes.
- Contract verification across API versions.

## When NOT To Use

- Testing response body content (covered by response-shape and happy-path KUs).
- Testing header values (covered by response-header-testing).
- Testing the HTTP protocol itself (Symfony already tested).

## Best Practices

- **Assert status first in every chain**: `$response->assertOk()->assertJsonStructure([...])`.
- **Use convenience methods**: Prefer `assertCreated()` over `assertStatus(201)` for readability.
- **Map every condition to a status**: Success variant asserts 200; validation variant asserts 422.
- **Test edge status codes**: 201 for store, 204 for delete, 206 for partial content, 304 for not-modified.
- **Assert status before any other assertion**: Save response parsing time if status is wrong.

## Architecture Guidelines

- Status codes must be consistent across API versions — v1 returning 201 and v2 returning 200 for store is a breaking change.
- Feature-level status code testing validates controller + middleware + exception handler pipeline.
- Monitor 5xx rates in production — spike indicates unhandled exceptions.
- 204 response for delete is often forgotten — verify in tests.

## Performance Considerations

- Status code assertions are the cheapest assertion type — single integer check.
- Always assert status first; if wrong, further assertions are skipped.
- Group status assertions by endpoint to minimize kernel boots.

## Security Considerations

- 5xx responses must not expose stack traces or internal details (APP_DEBUG=false).
- 4xx responses must use standardized codes to prevent information leakage.
- Wrong status codes (500 instead of 404) may expose unhandled exceptions.

## Common Mistakes

- Returning 200 instead of 201 for resource creation.
- Returning 200 instead of 204 for resource deletion.
- Returning 403 when correct code is 401 (unauthenticated vs unauthorized confusion).
- Returning 500 for validation errors (uncaught ValidationException).
- 401/403 confusion: 401 = unauthenticated, 403 = unauthorized.

## Anti-Patterns

- **No status code assertions**: Test only checks response body, missing contract-breaking status errors.
- **Wrong status for condition**: Returning 200 for validation errors (should be 422).

## Examples

- Store: `$this->postJson('/api/posts', [...])->assertCreated()`.
- Delete: `$this->deleteJson("/api/posts/{$post->id}")->assertNoContent()`.
- 401: `$this->getJson('/api/posts')->assertUnauthorized()`.
- Chain: `$this->getJson('/api/posts')->assertOk()->assertJsonStructure(['data' => [...]]);`

## Related Topics

- **Prerequisites**: HTTP Status Code Semantics (RFC 7231, RFC 6585), Feature Test Structure
- **Closely Related**: Happy Path Testing, Authentication Failure Testing, Authorization Failure Testing, Validation Failure Testing, Rate Limit Testing, Not Found Testing
- **Advanced**: Custom status code constants for business logic, Status code deprecation across versions, HATEOAS status code patterns

## AI Agent Notes

When testing status codes: assert status first in every chain, use convenience methods (assertOk, assertCreated, assertNoContent), map every condition to expected status, test edge codes (201 store, 204 delete), beware 401/403 confusion, status must be consistent across versions.

## Verification

Sources: `Symfony\Component\HttpFoundation\Response::HTTP_*` constants, `Illuminate\Testing\TestResponse`, domain-analysis.md.
