# Anti-Patterns — Response Header Testing

## Anti-Pattern 1: Zero Header Assertions

**Category**: Testing completeness

**Description**: Writing API tests that assert status code and body but never check any HTTP headers.

**Warning Signs**:
- No test file contains `assertHeader` or `assertHeaderMissing`
- Content-Type is never explicitly asserted
- Location header is never checked on store responses

**Why It's Harmful**: Consumers depend on headers for caching, security, content negotiation, and redirect behavior. A misconfigured route returning HTML with a wrong Content-Type passes body assertions (Laravel gracefully handles JSON responses) but breaks every JSON client.

**Real-World Consequence**: A middleware misconfiguration causes all API routes to return `text/html`. Status and body tests pass (Laravel's `getJson` still parses the body). Production breaks as soon as any non-Laravel client connects.

**Preferred Alternative**: Assert `Content-Type: application/json` on every endpoint. Assert Location on store responses. Assert security headers in a dedicated suite.

**Refactoring Strategy**:
1. Add `->assertHeader('Content-Type', 'application/json')` to all endpoint tests
2. Add Location header assertions to all store endpoint tests
3. Create a parameterized security header suite covering all routes

**Detection Checklist**:
- [ ] Every endpoint test includes at minimum a Content-Type assertion
- [ ] Store endpoint tests include Location header assertion
- [ ] Security headers are tested in a global suite

**Related Rules**: Assert Content-Type On Every Endpoint, Test Location Header On Created Resources, Assert Security Headers In Dedicated Suite
**Related Skills**: Test Response Headers
**Related Decision Trees**: Tree 1 — Header Test Coverage Scope

---

## Anti-Pattern 2: Missing Location Header Assertion on Created Resources

**Category**: Testing completeness

**Description**: Testing only the 201 status and response body after resource creation without asserting the Location header.

**Warning Signs**:
- Store endpoint tests assert `assertCreated()` and check body but never `assertHeader('Location', ...)`
- No test validates that the response correctly points to the new resource URL

**Why It's Harmful**: The Location header is the standard REST mechanism for indicating where a newly created resource resides. A missing or incorrect Location header breaks consumer redirect logic, HATEOAS navigation, and any automated workflow that follows creation links.

**Real-World Consequence**: Mobile apps that navigate to the newly created resource after creation fail; integration tests pass because they only check status and body; users see blank screens after submitting forms.

**Preferred Alternative**: Always assert `$response->assertHeader('Location', '/api/posts/'.$post->id)` after a successful store endpoint call.

**Refactoring Strategy**:
1. For each store endpoint, capture the created resource's ID (from the response body or database)
2. Assert the Location header matches the expected resource URL
3. Include the assertion in the same test as the status and body checks

**Detection Checklist**:
- [ ] Every store endpoint test includes a Location header assertion
- [ ] The asserted URL correctly points to the show endpoint for the created resource

**Related Rules**: Test Location Header On Created Resources
**Related Skills**: Test Response Headers

---

## Anti-Pattern 3: Per-Endpoint Security Header Tests (Instead of Global Suite)

**Category**: Testing architecture

**Description**: Testing security headers (CSP, HSTS, X-Content-Type-Options) in individual endpoint tests rather than a single parameterized suite covering all routes.

**Warning Signs**:
- Security header assertions exist in individual endpoint test files
- No centralized security header test suite exists
- Adding a new route requires manually copying security header tests

**Why It's Harmful**: Per-endpoint security header tests are incomplete — a newly added route may miss security header coverage. Centralized tests ensure every route (including new ones) automatically passes security header assertions.

**Real-World Consequence**: A developer adds a new API endpoint; forgets to add security header tests; the endpoint lacks X-Frame-Options and X-Content-Type-Options; a security audit flags the omission.

**Preferred Alternative**: Create a parameterized test suite that iterates all API routes and asserts security headers in a single test method.

**Refactoring Strategy**:
1. Collect all API routes into a test dataset
2. Write a single parameterized test: `it('includes security headers')` iterating all routes
3. Remove redundant security header assertions from individual endpoint tests

**Detection Checklist**:
- [ ] Security headers are tested in a single parameterized suite
- [ ] No individual endpoint test contains security header assertions
- [ ] The suite covers all API routes

**Related Rules**: Assert Security Headers In Dedicated Suite
**Related Skills**: Test Response Headers
**Related Decision Trees**: Tree 1 — Header Test Coverage Scope

---

## Anti-Pattern 4: No Header-Absence Assertions

**Category**: Testing completeness

**Description**: Testing only that headers are present when expected, without asserting that headers are absent when they should not appear.

**Warning Signs**:
- No test uses `assertHeaderMissing`
- Debug headers (X-Debug-Bar) are not tested for absence in production-like environments
- Error responses are not checked for accidentally present headers (Location on 422)

**Why It's Harmful**: Header presence on error responses can be as harmful as header absence on success. A Location header on a validation error response may cause client auto-redirect. Debug headers in production expose internal state.

**Real-World Consequence**: A validation error response includes a Location header from a previous redirect middleware; the client automatically follows the redirect instead of displaying the validation errors to the user.

**Preferred Alternative**: Use `assertHeaderMissing` for debug headers in production environments, Location headers on error responses, and cache headers on authenticated endpoints.

**Refactoring Strategy**:
1. Identify headers that should only appear in specific contexts
2. Add `assertHeaderMissing` to error response tests (especially Location on 422)
3. Add a production-environment test that asserts `assertHeaderMissing('X-Debug-Bar')`

**Detection Checklist**:
- [ ] Error responses are tested for absent Location headers
- [ ] Production-like environment tests assert debug headers are missing
- [ ] Authenticated endpoint tests check for absent public cache headers

**Related Rules**: Assert Header Absence Where Expected
**Related Skills**: Test Response Headers
**Related Decision Trees**: Tree 2 — Header Absence Testing

---

## Anti-Pattern 5: Duplicated Common Header Assertions

**Category**: Maintainability

**Description**: Repeating the same header assertions (Content-Type, CORS) in every test method instead of using `beforeEach`.

**Warning Signs**:
- Every test method manually asserts `->assertHeader('Content-Type', 'application/json')`
- The same Content-Type assertion appears in 20+ test methods
- Adding a new common header requires editing every test

**Why It's Harmful**: Duplication creates maintenance burden. If the Content-Type changes (e.g., to `application/vnd.api+json`), every test must be updated. Missed updates cause inconsistent test coverage.

**Real-World Consequence**: A team changes the API Content-Type to `application/vnd.api+json`; they update 30 of 50 test files; the remaining 20 tests still pass (they only test status) but no longer validate Content-Type. New endpoints get no Content-Type coverage.

**Preferred Alternative**: Use PestPHP `beforeEach` or a shared test trait to assert common headers for all endpoints.

**Refactoring Strategy**:
1. Identify headers that are the same across all endpoints (Content-Type, common CORS headers)
2. Move these assertions into a `beforeEach` block or a shared trait
3. Remove redundant inline assertions from individual test methods

**Detection Checklist**:
- [ ] Content-Type assertion is centralized (not duplicated in each test)
- [ ] Common CORS assertions are centralized
- [ ] Per-endpoint tests only contain header assertions specific to that endpoint

**Related Rules**: Use BeforeEach For Common Header Assertions
**Related Skills**: Test Response Headers
