# Authentication Failure Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Authentication Failure Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Authentication failure tests verify that unauthenticated requests are rejected with the correct status code (401 Unauthorized) and error body. They cover missing tokens, expired tokens, malformed Authorization headers, and unsupported authentication schemes. Laravel's Sanctum and Passport ship with test helpers; `assertStatus(401)` and error-shape assertions are the validation tools. Every non-public endpoint must prove it rejects unauthenticated callers.

---

## Core Concepts
An authentication failure test sends a request without valid credentials and asserts `401` plus an error response body. Test variations include: no `Authorization` header, malformed `Bearer` token, expired token, token from revoked session, and token with insufficient scopes (authentication vs authorization — authN ensures identity, authZ ensures permission). Use `assertStatus(401)` and assert the error structure matches `{"message": "Unauthenticated."}`. For Sanctum, use `actingAs()` for authenticated requests; omit it for unauthenticated tests. For Passport, use `actingAs()` with token scopes.

---

## Mental Models
Auth-failure tests are **locked-door tests** — every door must prove it stays locked when the key is wrong, missing, or broken. If a door that should be locked accepts any request, the security boundary is breached. The test suite is the security audit.

---

## Internal Mechanics
When no token is present, `Sanctum\Guard` or `auth:api` middleware throws `AuthenticationException`, which Laravel converts to a 401 JSON response via `Handler::unauthenticated()`. The default message is `"message": "Unauthenticated."`. For expired tokens, Sanctum validates token expiration from the `personal_access_tokens` table `expires_at` column. For revoked tokens, Sanctum checks the `revoked` boolean column. Both cases return 401. `withoutMiddleware('auth')` can be used to bypass auth for non-auth tests but should never be used in auth-failure tests.

---

## Patterns
- **Parameterize the protected endpoint**: Use a `@dataProvider` or PestPHP `with()` to test every protected endpoint with the same auth-failure scenarios.
- **Separate missing-token from invalid-token tests**: Different conditions may yield different error messages.
- **Test token from different guard**: Ensure `auth:api` middleware rejects tokens issued for `auth:web`.
- **Assert the error shape, not just status**: `assertStatus(401)->assertJson(['message' => 'Unauthenticated.'])`.
- **One test per auth scenario per endpoint group**: Don't test every endpoint with every token variant — test a representative sample.

---

## Architectural Decisions
The decision to test authentication failure at the feature-test level (not unit or E2E) is deliberate: unit tests against the Guard class verify token parsing logic, but only feature tests verify the middleware-to-controller pipeline correctly converts expired tokens to 401 responses. The tradeoff is that feature tests cannot distinguish between a missing middleware and a broken middleware — they only see the 401 outcome.

---

## Tradeoffs
| Tradeoff | Feature Auth Test | Unit Auth Test |
|---|---|---|
| Pipeline coverage | Full (middleware + guard) | Guard only |
| False negatives | Low | High (mocking misses middleware config) |
| Speed | Slower | Fast |
| Debugging | Harder (tracing middleware chain) | Easier (direct method call) |

---

## Performance Considerations
Auth-failure tests are lightweight — they exercise minimal request processing (rejected at middleware before controller) — but still boot the kernel. Use PestPHP's `beforeEach` to seed one authenticated user for all "authenticated" tests and avoid re-seeding per test. Batch auth-failure tests with `@dataProvider` to reduce kernel boots.

---

## Production Considerations
Every route in an authenticated API must have an auth-failure test. Use architecture tests to enforce: scan route registrations and assert corresponding test methods exist. In production, monitor 401 rates as a security signal — a spike may indicate token theft or brute-force attempts. Log auth failures with request metadata (IP, User-Agent) but never expose user details in the 401 response.

---

## Common Mistakes
- Testing auth failure with routes that don't have `auth` middleware.
- Asserting only `assertStatus(401)` without checking the error body.
- Forgetting to test token-from-wrong-guard scenarios.
- Using `withoutMiddleware('auth')` and then wondering why auth tests fail.

---

## Failure Modes
- **Missing middleware**: Endpoint accepts unauthenticated requests — test fails to get 401.
- **Leaky error messages**: Endpoint returns 401 but exposes the authenticated user count or hints about valid tokens.
- **Inconsistent error shape**: Auth middleware returns string response while controller returns JSON — the error body differs across endpoints.

---

## Ecosystem Usage
Laravel Breeze, Jetstream, and Spark all include auth-failure test patterns. Sanctum's documentation explicitly recommends testing unauthenticated access. Spatie's `laravel-permission` package uses auth-failure tests in its core suite.

---

## Related Knowledge Units
### Prerequisites
- Laravel Authentication (Sanctum/Passport guard mechanics)
- feature-test-structure (test class setup)

### Related Topics
- authorization-failure-testing (403 vs 401 distinction)
- response-shape-testing (error response structure)
- error-response-shape-testing (consistent error formatting)

### Advanced Follow-up Topics
- OAuth2 token introspection testing
- JWT blacklist testing
- Multi-guard authentication testing in APIs

---

## Research Notes
### Source Analysis
`Illuminate\Auth\AuthenticationException` is caught in `Illuminate\Foundation\Configuration\Exceptions::unauthenticated()`. Sanctum's `EnsureFrontendRequestsAreStateful` middleware and `Sanctum\Guard` handle token parsing.
### Key Insight
Auth-failure testing at the feature level catches middleware misconfiguration — the most common Laravel auth bug — which unit tests cannot detect.
### Version-Specific Notes
In Laravel 11, the default authentication stack is Sanctum with token-based API auth. Passport is optional via `install:api`. The 401 response format changed in Laravel 11 to always return JSON for API requests.
