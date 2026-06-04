# Rules: Authentication Test Patterns

## Rule: Test Unauthenticated Request Returns 401
- **Condition:** For every protected API endpoint
- **Action:** Send a request without any authentication. Assert the response status is 401. Assert the error envelope structure is correct.
- **Consequence:** Confirms the auth middleware is properly applied to the endpoint.
- **Enforcement:** CI test coverage check requires unauthenticated test for every protected route.

## Rule: Test Missing, Invalid, and Expired Tokens
- **Condition:** When testing token-based authentication
- **Action:** Test three scenarios: no Authorization header (missing), malformed token string (invalid), and token past expiration (expired). Each must return 401.
- **Consequence:** Covers all token failure modes that consumers may encounter.
- **Enforcement:** Auth test checklist requires all three token scenarios.

## Rule: Test Token Abilities — Insufficient Returns 403
- **Condition:** When using token ability/scope systems
- **Action:** Create a token with an ability that does NOT cover the tested endpoint. Assert 403 Forbidden. Then create a token with the correct ability and assert success.
- **Consequence:** Ability-based access control is validated; 403 vs 401 distinction is maintained.
- **Enforcement:** Code review verifies ability tests exist for endpoints with scope requirements.

## Rule: Test SPA Cookie Authentication End-to-End
- **Condition:** When using Sanctum SPA cookie authentication
- **Action:** Test the full SPA auth flow: CSRF cookie endpoint, login with credentials, authenticated request with session cookie, logout. Set `Accept: application/json` header to prevent redirects.
- **Consequence:** SPA authentication flow works end-to-end; session-based auth is validated.
- **Enforcement:** SPA auth tests required when Sanctum SPA mode is configured.

## Rule: Test Guard Fallback Behavior
- **Condition:** When multiple auth guards are configured
- **Action:** Test scenarios where the primary guard fails and fallback guard activates. Verify the unauthenticated response behavior for each guard.
- **Consequence:** Multi-guard authentication produces consistent results regardless of which guard processes the request.
- **Enforcement:** Auth configuration review includes fallback behavior testing.

## Rule: Test Logout and Token Revocation
- **Condition:** When implementing logout or token revocation
- **Action:** Create and authenticate a token. Call the logout/revoke endpoint. Then attempt the same request with the revoked token — assert 401.
- **Consequence:** Revoked tokens cannot be reused; logout is idempotent.
- **Enforcement:** Revocation test is required when token management endpoints exist.
