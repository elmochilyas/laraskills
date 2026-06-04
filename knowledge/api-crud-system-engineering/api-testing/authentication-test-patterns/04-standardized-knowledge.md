# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Authentication Test Patterns
**Difficulty:** Intermediate
**Category:** Testing & Quality Assurance
**Last Updated:** 2026-06-03

---

# Overview

Authentication Test Patterns are systematic test approaches for verifying API authentication — covering token-based auth, cookie-based SPA auth, token expiry, invalid tokens, insufficient permissions, guard fallback behavior, and token revocation. They exist because authentication is the primary security boundary of any API; a single unauthenticated endpoint that returns 200 instead of 401 exposes the entire system.

Engineers must care because authentication bugs are security vulnerabilities, not just functional bugs. An endpoint that accidentally skips auth middleware allows unauthorized data access. Comprehensive authentication test patterns catch these gaps before they reach production.

---

# Core Concepts

**Unauthenticated Request Testing:** Verifying that every protected endpoint returns 401 (or 403 for API token guards) when no authentication is provided. This is the baseline security assertion.

**Token Validity Testing:** Testing behavior with missing tokens, invalid/malformed tokens, expired tokens, and tokens with insufficient scopes/abilities. Each scenario should produce a distinct response.

**Ability/Scope Testing:** Testing that tokens with specific abilities can access authorized resources and are denied (403) from unauthorized resources. This validates the authorization layer on top of authentication.

**SPA Cookie Auth Testing:** Testing session-based authentication using Sanctum's SPA cookie pattern, which requires CSRF token handling and session state management.

**Guard Fallback Testing:** Testing the behavior when the default auth guard fails and the application falls through to alternative guards or returns the default unauthenticated response.

**Token Revocation Testing:** Verifying that revoked or deleted tokens no longer grant access, and that subsequent requests with revoked tokens return 401.

**Rate Limit Auth Testing:** Testing that authentication endpoints (login, token refresh) respect rate limits differently from regular API endpoints.

---

# When To Use

- All API endpoints behind authentication middleware
- Multi-guard API authentication (Sanctum tokens + session)
- Token-based APIs with ability/scope systems
- SPA APIs using cookie-based authentication
- APIs with token revocation requirements
- APIs with role-based access control layered on authentication

---

# When NOT To Use

- Public, unauthenticated API endpoints
- Unit tests for Authentication classes
- Non-API routes (web routes with session auth use different patterns)

---

# Best Practices

**Test unauthenticated access first.** Before writing any authenticated test, verify that the endpoint returns 401 without credentials. This establishes the security baseline.

**Test each auth scenario independently.** Missing token, invalid token, expired token, and insufficient abilities are separate concerns. Don't combine them into a single test.

**Use actingAs() for cookie-based tests, manual token creation for token-based tests.** `actingAs()` simulates session authentication. Token tests need explicit token creation and header setup.

**Test token revocation end-to-end.** Create a token, revoke it, then attempt to use it. Verify 401 response. Don't just test that the revoke endpoint returns 200.

**Test guard fallback behavior explicitly.** Create scenarios where the primary guard fails and verify the fallback produces the expected response.

**Set Accept header for SPA tests.** SPA authentication tests require `$this->withHeader('Accept', 'application/json')` to prevent redirect responses.

---

# Architecture Guidelines

**Authentication tests belong in feature tests, not unit tests.** Auth involves middleware, session state, and the HTTP kernel — requiring the full Laravel test stack.

**Authentication setup belongs in beforeEach at the describe level.** Most tests in a protected endpoint group need authentication. Extract setup to beforeEach and override in tests that test unauthenticated scenarios.

**Token creation for tests should use factories or helpers.** Don't create tokens inline in every test. An `actingAsToken()` helper method reduces duplication.

**SPA and token auth tests should be in separate describe blocks or files.** The setup and assertions differ significantly; combining them creates confusion.

---

# Performance Considerations

**Token creation in setUp adds ~5-10ms per test.** For large test suites, create a single auth user and token in a parent describe's beforeEach rather than per-test.

**Unauthenticated-only test suites can be faster.** If a resource has many endpoints but auth testing is the same pattern, extract auth-specific tests to a dedicated describe block to run only once.

**Token refresh and expiry tests require clock mocking or real wall time.** Use `Carbon::setTestNow()` to simulate token expiration without waiting.

---

# Security Considerations

**Never use production tokens or credentials in tests.** Test data must be isolated from production.

**Test database must be separate.** Authentication tests create real users in the database. Use in-memory SQLite or a dedicated test database.

**Verify revoked tokens are truly invalid.** Test that soft-deleted tokens, expired tokens, and explicitly revoked tokens all return 401 — not just one case.

**Verify insufficient ability returns 403, not 401.** 401 means "not authenticated"; 403 means "authenticated but not authorized." Confusing these masks authorization gaps.

---

# Common Mistakes

**Testing only happy-path auth** — the 401 case is often forgotten because developers focus on authenticated scenarios.

**Sharing test setup across auth types** — token setup differs from cookie-based setup. Mixing them creates confusing tests that don't properly validate either path.

**Forgetting Accept header for SPA tests** — Laravel redirects unauthenticated requests by default for session guards. Without `Accept: application/json`, the test receives an HTML redirect instead of a JSON 401.

**Not refreshing application state after auth user creation** — Auth user created in `setUp` but database state not refreshed between tests, causing test pollution.

**Testing token with database query but not via HTTP header** — The token exists but the middleware path is different from the mock path.

---

# Anti-Patterns

**Auth Test Everything:** Running full authentication tests for every single endpoint when the auth behavior is identical across all endpoints.
**Better approach:** Test auth once per auth guard at the describe level. Individual endpoint tests assume auth is handled and focus on business logic.

**Hardcoded Token Values:** Using hardcoded token strings in tests that don't correspond to real tokens.
**Better approach:** Always create real tokens through Sanctum or Passport test helpers.

**Session-Token Confusion:** Mixing SPA cookie tests and token tests in the same describe block without separating concerns.
**Better approach:** Separate describe blocks or test files for each auth mechanism.

---

# Examples

**Token auth test:**
```
beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = $this->user->createToken('test-token', ['read'])->plainTextToken;
});

it('returns 401 without token', function () {
    $response = $this->getJson('/api/v1/users');
    $response->assertStatus(401);
});

it('returns 403 with insufficient ability', function () {
    $response = $this->withToken($this->token)
        ->postJson('/api/v1/users', []);
    $response->assertStatus(403);
});
```

---

# Related Topics

**Prerequisites:**
- Sanctum Token Auth Implementation
- HTTP Endpoint Assertions

**Closely Related Topics:**
- Token Ability Design — defining abilities tested in auth patterns
- Token Expiration and Rotation — testing token lifecycle
- Rate Limiting — testing rate limits on auth endpoints

**Advanced Follow-Up Topics:**
- Multi-Guard Authentication Testing — testing multiple auth guards
- OAuth2 Flow Testing — testing authorization code flow

**Cross-Domain Connections:**
- API Security Headers — headers tested alongside authentication
- Policy Design for APIs — authorization layer validated on top of auth
