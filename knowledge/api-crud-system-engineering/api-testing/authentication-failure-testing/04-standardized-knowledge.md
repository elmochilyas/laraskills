# ECC Standardized Knowledge — Authentication Failure Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Authentication Failure Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Authentication failure tests verify that unauthenticated requests are rejected with 401 Unauthorized and a consistent error body. They cover missing tokens, expired tokens, malformed Authorization headers, and unsupported authentication schemes. Every non-public endpoint must prove it rejects unauthenticated callers. Tests at the feature level catch middleware misconfiguration — the most common Laravel auth bug.

## Core Concepts

- **Missing token**: No Authorization header -> 401.
- **Malformed token**: Invalid Bearer format -> 401.
- **Expired token**: Token past expiration -> 401.
- **Revoked token**: Token marked as revoked in database -> 401.
- **Wrong guard**: Token from auth:web used against auth:api -> 401.
- **Default error body**: `{"message": "Unauthenticated."}`.
- **assertStatus(401)**: Primary assertion for auth failures.

## When To Use

- Every authenticated API endpoint
- Endpoints protected by `auth:api` or `auth:sanctum` middleware
- Regression testing after authentication middleware changes

## When NOT To Use

- Authorization (403 Forbidden) scenarios — separate KU
- Authentication success scenarios (covered by happy path testing)
- Unit tests on Guard classes (token parsing logic)

## Best Practices

- **Parameterize protected endpoints**: Use `@dataProvider` or PestPHP `with()` to test every protected endpoint with auth-failure scenarios.
- **Separate missing-token from invalid-token tests**: Different conditions may yield different error messages.
- **Test token from wrong guard**: Ensure `auth:api` middleware rejects tokens issued for `auth:web`.
- **Assert error shape, not just status**: `assertStatus(401)->assertJson(['message' => 'Unauthenticated.'])`.
- **One test per auth scenario per endpoint group**: Don't test every endpoint with every variant — test a representative sample.

## Architecture Guidelines

- 401 = "I don't know you" — identity verification failure. Separate from 403 (authorization).
- Feature-level auth tests verify middleware-to-controller pipeline, not just Guard logic.
- Architecture tests enforce: every route in authenticated API must have an auth-failure test.
- In production, monitor 401 rates as security signal (spike may indicate token theft or brute-force).

## Performance Considerations

- Auth-failure tests are lightweight — rejected at middleware before controller.
- Use PestPHP's `beforeEach` to seed one authenticated user for all tests.
- Batch auth-failure tests with `@dataProvider` to reduce kernel boots.

## Security Considerations

- 401 responses must never expose user details or valid token hints.
- Log auth failures with request metadata (IP, User-Agent) but never expose in response.
- Auth-failure tests verify that error responses don't leak information.

## Common Mistakes

- Testing auth failure with routes that don't have `auth` middleware.
- Asserting only `assertStatus(401)` without checking error body.
- Forgetting to test token-from-wrong-guard scenarios.
- Using `withoutMiddleware('auth')` then wondering why auth tests fail.

## Anti-Patterns

- **Leaky error messages**: 401 response exposes user count or valid token hints.
- **Inconsistent error shape**: Some endpoints return string response, others JSON.

## Examples

- Missing token: `$this->getJson('/api/posts')->assertStatus(401)->assertJson(['message' => 'Unauthenticated.'])`.
- Expired token: Create Sanctum token with `expires_at` in past, send with Bearer header, assert 401.
- Invalid format: `$this->withHeaders(['Authorization' => 'Bearer invalid'])->getJson('/api/posts')->assertStatus(401)`.

## Related Topics

- **Prerequisites**: Laravel Authentication (Sanctum/Passport), Feature Test Structure
- **Closely Related**: Authorization Failure Testing, Response Shape Testing, Error Response Shape Testing
- **Advanced**: OAuth2 token introspection testing, JWT blacklist testing, Multi-guard authentication testing

## AI Agent Notes

When testing auth failures: test missing/invalid/expired/revoked tokens, separate 401 from 403 tests, assert error body not just status, test wrong-guard scenarios, parameterize across protected endpoints, monitor 401 rates in production as security signal.

## Verification

Sources: `Illuminate\Auth\AuthenticationException`, Sanctum token validation, domain-analysis.md.
