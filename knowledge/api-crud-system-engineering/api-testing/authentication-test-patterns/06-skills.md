# Skill: Implement Authentication Test Patterns

## Purpose
Write tests for authentication flows including token-based and cookie-based auth, token expiry scenarios, missing/invalid token responses, role-based access control enforcement, and unauthenticated fallback middleware behavior.

## When To Use
- All authenticated API endpoints
- Auth middleware testing
- Token-based and session-based authentication
- Role/permission guard testing

## When NOT To Use
- Non-API routes
- Unit tests for Auth classes — those need plain PHPUnit

## Prerequisites
- Sanctum or Passport configuration
- Authentication middleware setup

## Inputs
- Auth guard configuration
- Token types and abilities
- Protected endpoint list

## Workflow
1. Test unauthenticated request returns 401 — every protected endpoint
2. Test missing token returns 401 — no Authorization header
3. Test invalid token returns 401 with `AuthenticationException` — tampered or malformed token
4. Test expired token returns 401 — token past expiration
5. Test valid token returns 200/201/204 — happy path authentication
6. Test token with insufficient abilities returns 403 — `$response->assertForbidden()`
7. Test token with matching ability returns success — scope check
8. Test SPA cookie-based auth end-to-end with `actingAs()` and session driver
9. Test guard fallback behavior — unauthenticated default middleware response
10. Test logout/token revocation — token invalidated, subsequent request returns 401

## Validation Checklist
- [ ] All protected endpoints tested for unauthenticated (401) case
- [ ] Invalid/expired token tested for 401 response
- [ ] Token abilities tested (insufficient → 403, matching → success)
- [ ] SPA cookie auth tested end-to-end
- [ ] Guard fallback middleware behavior tested
- [ ] Token revocation tested — revoked token returns 401
- [ ] Rate limits on auth endpoints tested separately
- [ ] Throttle behavior for repeated failed auth tested

## Common Failures
- Testing only happy-path auth — 401/403 cases produce infinite loops on some auth guards
- Sharing test setup across auth types — token setup differs from cookie
- Forgetting `$this->withHeader('Accept', 'application/json')` for SPA tests to avoid redirects
- Not refreshing application state after auth user creation in `setUp`
- Testing token with database but not header — middleware may differ from mock

## Decision Points
- `actingAs()` vs manual token creation — actingAs for cookie/session, manual for token
- Mock auth vs real token — real token for integration, mock for controller unit tests
- Token ability testing — `actingAs($user, ['ability'])` vs explicit token creation

## Performance Considerations
- Token creation in setUp is faster than per-test — use `beforeEach` with Redis for multi-test reuse
- Auth user creation adds ~5-10ms per test — consider using unauthenticated-only suite for 401 tests
- Token refresh tests require real wall time or clock mocking

## Security Considerations
- Never test with production tokens or credentials
- Ensure test database is separate — auth tests create real users
- Test that revoked tokens truly invalidate — not just soft-delete
- Test that insufficient ability returns 403, not 401

## Related Rules
- Test Unauthenticated Request Returns 401
- Test Missing, Invalid, and Expired Tokens
- Test Token Abilities — Insufficient Returns 403
- Test SPA Cookie Authentication End-to-End
- Test Guard Fallback Behavior
- Test Logout and Token Revocation

## Related Skills
- Sanctum Token Auth — for token-based implementation
- Sanctum SPA Cookie Auth — for cookie-based implementation
- Token Ability Design — for ability definition
- HTTP Endpoint Assertions — for assertion patterns

## Success Criteria
- Every protected endpoint has unauthenticated (401) test
- Token expiry, invalidity, and missing scenarios are covered
- Ability-based access control is tested (403 vs success)
- Cookie auth flow is tested separately from token flow
- Guard fallback behavior is documented and tested
- Token revocation renders subsequent requests invalid
