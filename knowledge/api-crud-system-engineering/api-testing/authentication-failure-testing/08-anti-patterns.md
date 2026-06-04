# Anti-Patterns: Authentication Failure Testing

## AP-1: No Auth Failure Tests
**Category**: Security

**Description**: Writing only happy path tests without testing that unauthenticated requests are rejected. Authentication middleware could be missing or misconfigured on production routes, and the test suite gives no warning.

**Warning Signs**:
- Only `actingAs()` authed tests exist for protected endpoints
- No test sends a request without an Authorization header
- No test sends a malformed or expired token
- Authentication coverage is assumed but not verified
- Security audit reveals unprotected endpoints but no failing tests

**Harms**:
- Authentication middleware may be missing on production routes
- Unauthenticated users access protected data
- Security breach in CI-passing code
- No regression detection when auth middleware is accidentally removed
- False confidence in API security

**Real-World Consequence**: A developer adds a new endpoint and forgets to add `auth:sanctum` middleware. All happy path tests use `actingAs($user)`, which works regardless of middleware presence. The test passes. In production, anyone can access the endpoint without authentication. PII data is exposed for 3 weeks before discovery.

**Preferred Alternative**: Every protected API endpoint must have at least one test proving it rejects unauthenticated requests with 401.

**Refactoring Strategy**: Add auth-failure tests for every protected endpoint, use PestPHP datasets to parameterize across routes, separate missing-token, invalid-token, expired-token, and revoked-token scenarios.

**Detection Checklist**:
- `[ ]` Does every protected endpoint have an auth-failure test?
- `[ ]` Are there endpoints with only `actingAs()` tests and no auth-failure tests?
- `[ ]` Would removing `auth` middleware cause any test to fail?
- `[ ]` Is there a CI check enforcing auth-failure test coverage?

**Related**: 05-rules.md (Test Every Authenticated Endpoint For 401), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: Status-Only Auth Assertions
**Category**: Testing

**Description**: Asserting only `assertStatus(401)` without verifying the error response body shape. Inconsistent error formats across endpoints break client-side error handling.

**Warning Signs**:
- Auth failure tests only call `$response->assertStatus(401)`
- No assertion of error message or structure
- Different endpoints return different error formats for 401
- Some endpoints return `{"message": "Unauthenticated."}`, others return raw strings
- Client-side error parsing is brittle

**Harms**:
- Inconsistent error shapes across endpoints
- Client SDKs break parsing errors
- Some endpoints may return non-JSON 401 responses
- No verification that error messages don't leak information
- Debugging requires manual endpoint-by-endpoint inspection

**Real-World Consequence**: Most endpoints return `{"message": "Unauthenticated."}` but a forgotten route returns `Unauthenticated` as a plain string (not JSON). Auth-failure tests only check `assertStatus(401)`, so all pass. A mobile client parses the JSON error body and crashes on the plain string response. The bug is discovered by user crash reports.

**Preferred Alternative**: Assert the error response body structure alongside the 401 status code.

**Refactoring Strategy**: Add `assertJson(['message' => 'Unauthenticated.'])` or error shape assertion to all auth-failure tests, verify consistent format across all endpoints, create a global error shape test if applicable.

**Detection Checklist**:
- `[ ]` Do auth-failure tests assert the error body, not just status?
- `[ ]` Is the 401 error format consistent across all endpoints?
- `[ ]` Would a plain-string 401 response be caught by tests?
- `[ ]` Do all 401 responses return valid JSON?

**Related**: 05-rules.md (Assert Error Body, Not Just Status), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Grouping All Auth Failures Into One Test
**Category**: Testing

**Description**: Testing missing token, invalid token, expired token, and revoked token in a single test method. Different auth-failure modes follow different code paths, and grouping them masks behavioral differences.

**Warning Signs**:
- Single test method covers "all bad token scenarios"
- Missing token and expired token are tested in sequence in one test
- Revoked token scenario is omitted entirely
- Test passes but certain token states return non-401 responses
- No separate test for expired or revoked tokens

**Harms**:
- Expired or revoked tokens may return non-401 responses (500, redirect)
- Different auth-failure modes masked by in-group testing
- Revoked token scenario most commonly omitted
- Inconsistent user experience across auth failure modes
- Security gap — expired tokens may grant access

**Real-World Consequence**: A test groups missing, invalid, and expired token tests in sequence. Expired token returns 200 (token validation bug) but the test continues after asserting `assertStatus(401)` on the first scenario. The 200 response for expired tokens goes undetected. In production, expired tokens are still accepted. Attackers can use stolen tokens indefinitely.

**Preferred Alternative**: Write separate tests for missing Authorization header, malformed token, expired token, and revoked token scenarios.

**Refactoring Strategy**: Create separate test methods for each auth-failure scenario, use PestPHP datasets for parameterization if needed, include expired and revoked token tests explicitly, verify each scenario independently.

**Detection Checklist**:
- `[ ]` Are missing, invalid, expired, and revoked tokens tested separately?
- `[ ]` Is the revoked token scenario tested?
- `[ ]` Is the expired token scenario tested?
- `[ ]` Would an expired token returning 200 be caught by tests?

**Related**: 05-rules.md (Separate Missing-Token From Invalid-Token Tests), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: Manual Per-Endpoint Auth Tests (No Parameterization)
**Category**: Maintainability

**Description**: Writing a separate auth-failure test method for every protected endpoint manually. The workload discourages thorough coverage, and new endpoints are added without auth-failure tests.

**Warning Signs**:
- Each protected endpoint has its own manually-written auth-failure test
- Adding a new endpoint requires writing a new auth test method
- Some endpoints have auth-failure tests, others don't
- Test file has 20+ nearly identical auth-failure methods
- Auth test coverage is inconsistent across endpoints

**Harms**:
- New endpoints added without auth-failure tests
- Coverage gaps grow silently over time
- High maintenance cost for repetitive tests
- Developers skip auth tests due to boilerplate
- Auth regression detection degrades

**Real-World Consequence**: A team manually wrote auth-failure tests for 15 endpoints. Over 6 months, 7 new endpoints were added. Only 2 of the 7 have auth-failure tests — the team "forgot" because the process requires 5+ lines of boilerplate per endpoint. 5 endpoints have no auth regression detection.

**Preferred Alternative**: Use PestPHP `with()` datasets or PHPUnit `@dataProvider` to test authentication failure against all protected endpoints with minimal code.

**Refactoring Strategy**: Collect all protected routes into a dataset array, create a single parameterized test method, ensure the dataset is updated when new endpoints are added, add CI check validating dataset completeness.

**Detection Checklist**:
- `[ ]` Are auth-failure tests parameterized or manual per-endpoint?
- `[ ]` Would adding a new endpoint automatically get auth-failure coverage?
- `[ ]` Is there a single place listing all protected endpoints?
- `[ ]` Are there endpoints without auth-failure tests?

**Related**: 05-rules.md (Parameterize Protected Endpoints), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: No Wrong-Guard Testing
**Category**: Security

**Description**: Testing auth failure only with missing tokens, not with tokens from a different authentication guard. A token issued for `auth:web` may be accepted by `auth:api` middleware, bypassing API authentication.

**Warning Signs**:
- API uses multiple auth guards (web, api, sanctum)
- No test sends a web session token to an API endpoint
- Wrong-guard acceptance has never been tested
- Authentication uses different guards for different route groups
- Multi-guard configuration exists but is untested

**Harms**:
- Web session tokens may be accepted by API endpoints
- Cross-guard authentication bypass
- Session hijacking grants API access
- Security vulnerability in multi-guard setups
- No regression detection for guard isolation

**Real-World Consequence**: An API uses both `auth:web` (for SPA session) and `auth:sanctum` (for mobile token) guards. A misconfiguration in the authentication middleware causes `auth:sanctum` to also accept `auth:web` session cookies. An attacker who steals a session cookie (via XSS on the web app) can also access the entire API. No tests verify guard isolation.

**Preferred Alternative**: Test that tokens from one guard are rejected by another guard's middleware. Verify guard isolation for every multi-guard setup.

**Refactoring Strategy**: Create tests that send tokens from each guard to endpoints protected by other guards, verify 401 rejection for cross-guard requests, document guard configuration and test coverage.

**Detection Checklist**:
- `[ ]` Does the API use multiple authentication guards?
- `[ ]` Are cross-guard token acceptance scenarios tested?
- `[ ]` Would a web session token accessing API endpoints be detected?
- `[ ]` Is guard isolation verified by tests?

**Related**: 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
