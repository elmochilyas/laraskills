# Skill: Test Authentication Failures

## Purpose
Write feature tests verifying that unauthenticated requests are rejected with 401 for every protected endpoint, covering missing/invalid/expired/revoked tokens, asserting error body shape, and parameterizing across all protected routes.

## When To Use
- Every authenticated API endpoint
- Endpoints protected by `auth:api` or `auth:sanctum` middleware
- Regression testing after authentication middleware changes

## When NOT To Use
- Authorization (403 Forbidden) scenarios
- Authentication success scenarios (covered by happy path testing)
- Unit tests on Guard classes

## Prerequisites
- Feature test structure (PHPUnit/PestPHP)
- Laravel Sanctum or Passport authentication
- Protected API routes definition

## Inputs
- List of protected endpoints
- Test token generation setup
- Baseline authenticated user factory

## Workflow
1. Write at least one 401 test per protected endpoint — parameterize endpoints using PestPHP datasets
2. Separate missing-token from invalid-token, expired-token, and revoked-token tests
3. Assert error body shape (`message: Unauthenticated.`) alongside `assertStatus(401)` or `assertUnauthorized()`
4. Test token from wrong guard (e.g., web token against auth:api middleware)
5. Never use `withoutMiddleware` in auth tests — it bypasses the middleware under test
6. Use PestPHP `beforeEach` to set up one authenticated user shared across happy-path tests

## Validation Checklist
- [ ] Every protected endpoint has at least one 401 test
- [ ] Missing-token, invalid-token, expired-token, revoked-token scenarios tested
- [ ] Error body asserted alongside 401 status code
- [ ] Wrong-guard scenario tested if applicable
- [ ] `withoutMiddleware` not used in auth tests
- [ ] Parameterized tests cover all protected endpoints

## Common Failures
- Testing auth failure with routes that don't have `auth` middleware
- Asserting only `assertStatus(401)` without checking error body
- Forgetting to test token-from-wrong-guard scenarios
- Using `withoutMiddleware` and wondering why auth tests fail

## Decision Points
- Test granularity: per-endpoint tests vs dataset-parameterized tests
- Auth variants: all variants (missing/invalid/expired/revoked) vs representative sample
- Error shape assertion: per-test vs global error shape test suite

## Performance Considerations
- Auth-failure tests are lightweight — rejected at middleware before controller
- Use PestPHP's `beforeEach` to seed one authenticated user for all tests
- Batch with datasets to reduce kernel boots

## Security Considerations
- 401 responses must never expose user details or valid token hints
- Log auth failures with request metadata but never expose in response
- Auth-failure tests verify error responses don't leak information

## Related Rules
- Test Every Authenticated Endpoint For 401
- Assert Error Body, Not Just Status
- Separate Missing-Token From Invalid-Token Tests
- Parameterize Protected Endpoints
- Never Use WithoutMiddleware On Auth Tests

## Related Skills
- Test Authorization Failures
- Test Validation Failures
- Test Error Response Shape

## Success Criteria
- All protected endpoints are covered by 401 tests
- Missing, invalid, expired, and revoked tokens are each tested
- Error body structure is consistent across all auth failures
- Auth tests validate the full middleware-to-controller pipeline
- No false-positive auth tests exist
