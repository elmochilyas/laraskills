# Authentication Test Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Authentication Test Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Authentication Test Patterns define how to verify that API endpoints enforce authentication properly — testing that unauthenticated requests are rejected, authenticated requests succeed, and different authentication schemes behave correctly.

---

## Core Concepts
- **Unauthenticated Access**: Asserting that protected endpoints return `401 Unauthorized` when no credentials are provided
- **Token-Based Auth Testing**: Using `Sanctum::actingAs($user)` or `Passport::actingAs($user)` to simulate authenticated requests
- **Role/Scope Verification**: Testing that authenticated users without required roles receive `403 Forbidden`
- **Expired/Invalid Tokens**: Verifying that stale or malformed tokens are rejected appropriately
- **Multi-Guard Authentication**: Testing endpoints protected by different auth guards

---

## Mental Models
1. **Gatekeeper Model**: Every endpoint has a guard. Tests verify the guard lets the right people through and stops the wrong ones.
2. **Three-State Model**: Each endpoint has three authentication states — unauthenticated (401), authenticated but unauthorized (403), and authenticated and authorized (200/201).

---

## Internal Mechanics
Pest tests use helper functions like `Sanctum::actingAs($user)` to generate tokens and attach them to the test request. When `get('/api/users')` is called, Laravel's auth middleware resolves the user from the token. The test response's status code reveals whether authentication and authorization succeeded or failed.

---

## Patterns

### Pattern 1: Before-Filter Authentication
**Purpose**: Define authenticated test methods in `Pest.php` or a base test class
**Benefits**: Reusable authentication setup across all tests
**Tradeoffs**: Can hide auth setup; makes tests less explicit

### Pattern 2: Per-Test Authentication
**Purpose**: Call `actingAs()` explicitly in each test that requires authentication
**Benefits**: Tests are self-documenting about their auth requirements
**Tradeoffs**: Verbose for tests that share the same auth setup

---

## Architectural Decisions
### When To Use
- All API endpoints that require authentication
- Multi-tenant applications with role-based access
- APIs using token-based auth (Sanctum, Passport, JWT)

### When To Avoid
- Public endpoints that don't require authentication
- Tests focused solely on business logic (unit tests)

### Alternatives
- HTTP Basic Auth testing for simple credential verification
- OAuth2 flow simulation for third-party integration tests

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches auth bypasses before production | Auth setup adds test complexity | Use helpers to reduce boilerplate |
| Documents auth requirements explicitly | Tests tied to auth implementation | Test behavior, not implementation |
| Validates role/scope enforcement | Requires realistic user factories | Create role-specific factory states |

---

## Performance Considerations
- `actingAs()` creates a database token — use `RefreshDatabase` to clean up between tests
- Token generation overhead per test is negligible (<5ms)
- For performance-critical auth tests, cache user instances across tests

---

## Production Considerations
- Test auth token expiry scenarios to ensure refresh flows work
- Verify that auth error responses don't leak sensitive information
- Test rate limiting on auth endpoints separately (login, register)

---

## Common Mistakes
**Only testing the happy path**: Testing authenticated requests without verifying unauthenticated rejection. Always add a `401` test for every protected endpoint.
**Testing with wrong guard**: Using Sanctum helpers when the endpoint uses Passport or vice versa. Match the test helper to the middleware.
**Hardcoding tokens**: Using fixed token strings instead of generating them through the application. Tests should use the same auth flow as production.

---

## Failure Modes
**False positive on auth bypass**: A route missing auth middleware returns 200 for unauthenticated requests. *Detection:* Automated route audit that checks every route has auth middleware.
**Token leak in test output**: Auth tokens printed in test failure output. *Detection:* Review test output for sensitive data. *Mitigation:* Redact tokens in test failure messages.

---

## Ecosystem Usage
Laravel Sanctum provides `actingAs()` for token-based API auth. Passport provides `actingAsClient()` for OAuth2 client credentials. Both integrate seamlessly with Pest's fluent API.

---

## Related Knowledge Units
### Prerequisites
- HTTP endpoint assertions
- Sanctum/Passport authentication setup

### Related Topics
- Authorization test patterns
- Validation error test patterns
- CORS behavior testing

### Advanced Follow-up Topics
- OAuth2 flow integration testing
- Multi-factor authentication testing
- SSO/SAML integration testing

---

## Research Notes
- Sanctum's `actingAs()` creates a token with the API token guard; for session-based auth, use `actingAs()` without guard parameter
- Always test the `401` response body format to ensure consistent error structures
