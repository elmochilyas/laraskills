# Skill: Test Authentication and Authorization Boundaries

## Purpose
Write comprehensive tests for every authentication and authorization boundary: guest access, role-based access, ownership checks, and login flow mechanics.

## When To Use
- Adding or modifying any protected endpoint
- Implementing authentication (login, registration, password reset)
- Implementing authorization (roles, permissions, policies, ownership)
- Reviewing security test coverage for protected resources

## When NOT To Use
- Testing third-party auth providers (test integration separately)
- Testing features without authentication requirements (public endpoints)
- Testing the auth system internals (test behavior, not framework internals)

## Prerequisites
- Laravel authentication system configured (guards, providers)
- Policies or gate definitions for authorization
- Sanctum installed if testing API token auth

## Inputs
- Route definitions with middleware (auth, sanctum, role checks)
- User factory with role/permission states
- Resource ownership structure

## Workflow
1. For every protected endpoint, write tests for all four authorization sides: guest (401/403/redirect), wrong role (403), correct role (200), ownership boundary (403 for another user's resource)
2. Use `$this->actingAs($user)` for authorization tests (fast, bypasses login); use actual HTTP POST for login flow tests
3. Test authorization for all HTTP verbs (GET, POST, PUT, DELETE) on each resource
4. For ownership-based resources, create two users and a resource owned by User A, then verify User B gets 403
5. Use `$this->actingAsSanctum($user)` for Sanctum-guarded API routes, `$this->actingAs($user)` for session-guarded routes
6. Test rate limiting on auth endpoints: within limit succeeds, exceeded returns 429, after decay resets
7. Test that error responses for unauthorized resources return 404 (not 403) to prevent enumeration

## Validation Checklist
- [ ] Every protected endpoint tests guest access rejection
- [ ] Authorization tested for all HTTP verbs on every resource
- [ ] Ownership boundaries tested (User A cannot access User B's data)
- [ ] Role-based access matrix tested for all roles
- [ ] Login flow tested with actual POST (wrong password, lockout, CSRF)
- [ ] Correct guard helper used (actingAs vs actingAsSanctum)
- [ ] Auth endpoint rate limiting tested
- [ ] Opaque 404 responses prevent resource enumeration

## Common Failures
- Testing only authenticated access, missing guest access tests
- Using `actingAs()` for login flow testing — misses password verification/CSRF/lockout
- Guard mismatch: `actingAs()` on Sanctum routes (user appears unauthenticated)
- Missing ownership boundary tests (User A can modify User B's data)
- Only testing GET but not POST/PUT/DELETE authorization

## Decision Points
- Use `actingAs()` for authorization tests; actual POST `$this->post('/login', [...])` for auth mechanism tests
- Use opaque 404 for unauthorized resources vs explicit 403 (404 prevents enumeration)
- Clear permission cache in `setUp()` when using Spatie Permission: `$this->app->make(PermissionRegistrar::class)->forgetCachedPermissions()`

## Performance Considerations
- `actingAs()` adds <1ms — sets user in session without DB query
- Full login flow (POST) adds ~10-15ms per test
- Policy resolution adds ~1-2ms per check
- Rate limiting tests are sequential by nature

## Security Considerations
- Authorization testing gaps = production security vulnerabilities
- Test that error responses don't reveal resource existence
- Test brute force protection (account lockout after N failed attempts)
- Test all auth boundaries before deploying auth changes

## Related Rules (from 05-rules.md)
- Rule 1: Test every side of every authorization boundary
- Rule 2: Use `actingAs()` for authorization tests, actual POST for login flow
- Rule 3: Test authorization for every HTTP verb
- Rule 4: Test ownership boundaries for user-scoped resources
- Rule 5: Use `actingAsSanctum()` for Sanctum-guarded API routes
- Rule 6: Test rate limiting on authentication endpoints
- Rule 7: Test that error responses do not reveal whether a resource exists

## Success Criteria
- Every protected endpoint has 4 tests (guest, wrong role, correct role, ownership)
- Login flow tested with actual HTTP requests (not bypassed)
- All HTTP verbs authorized correctly
- No user can access another user's private resources
