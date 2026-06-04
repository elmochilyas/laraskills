# Anti-Patterns: Authentication Test Patterns

## Auth Test Everything
**Description:** Running full authentication tests (missing token, invalid token, expired token, insufficient abilities) for every single protected endpoint.
**Why it happens:** Developers think comprehensive testing means testing every auth scenario on every endpoint.
**Consequences:** Test suite bloat; long execution times; diminishing returns on coverage.
**Better approach:** Test auth behavior once per auth guard at the describe/file level. Individual endpoint tests assume auth passes and focus on business logic. Create a single `describe('authentication')` block per resource.

## Hardcoded Token Values
**Description:** Using hardcoded string tokens in tests that don't correspond to real Sanctum or Passport tokens.
**Why it happens:** Developers want to avoid the setup of creating real tokens.
**Consequences:** Tests pass but don't validate actual auth middleware behavior — the middleware never sees a real token format.
**Better approach:** Always create real tokens through `$user->createToken()` or `Passport::actingAs()`.

## SPA Redirect Ignorance
**Description:** Testing SPA cookie endpoints without setting `Accept: application/json` header, causing tests to receive HTML redirect responses instead of JSON 401.
**Why it happens:** Developers are unaware of Laravel's default redirect behavior for unauthenticated session requests.
**Consequences:** Tests fail confusingly; auth behavior appears broken.
**Better approach:** Always set `$this->withHeader('Accept', 'application/json')` in SPA auth tests.

## 401-403 Confusion
**Description:** Testing insufficient ability and expecting 401 instead of 403, or vice versa.
**Why it happens:** Developers treat all auth failures as the same class of error.
**Consequences:** Authorization bugs go undetected — endpoint returns 403 when it should return 401 or vice versa.
**Better approach:** 401 = not authenticated (missing/invalid token). 403 = authenticated but not authorized (insufficient ability). Test both distinctly.

## Token Leakage
**Description:** Leaving hardcoded test tokens, API keys, or credentials in test files that get committed to the repository.
**Why it happens:** Developers hardcode tokens for convenience and forget to remove them.
**Consequences:** Security credentials exposed in source control.
**Better approach:** Use environment variables, factory methods, or in-memory token creation for test authentication.
