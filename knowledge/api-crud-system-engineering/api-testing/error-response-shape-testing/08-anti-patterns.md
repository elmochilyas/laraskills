# Anti-Patterns — Error Response Shape Testing

## Anti-Pattern 1: Per-Endpoint Error Shape Testing Instead of Handler-Level

**Category**: Testing architecture

**Description**: Writing the same error shape assertion for every endpoint instead of testing the exception handler once per error type.

**Warning Signs**:
- The same error shape assertion (e.g., `->assertExactJson(['message' => 'Unauthenticated.'])`) appears in 10+ test files
- A handler change requires updating error shape assertions in every endpoint test
- Test suite has 80+ error shape tests that all validate the same handler logic

**Why It's Harmful**: Error shape is controlled by a single file (the exception handler). Testing it per-endpoint creates massive duplication, increases maintenance burden, and provides no additional assurance — if the handler is wrong, all 80 tests fail together anyway.

**Real-World Consequence**: A team customizes the error handler to add a `trace_id` field. They must update 50+ endpoint tests that assert the old shape. Three tests are missed; CI passes because those tests only check status code; production reveals inconsistent error shapes.

**Preferred Alternative**: Write one handler-level test per error status code (401, 403, 404, 422, 429, 500) against a single representative endpoint.

**Refactoring Strategy**:
1. Identify all per-endpoint error shape assertions
2. Remove them from individual endpoint tests
3. Create a dedicated error shape test suite with one test per error status code
4. Keep per-endpoint tests only for endpoints that intentionally override the handler

**Detection Checklist**:
- [ ] No error shape assertion appears in more than one test file
- [ ] Each error status code has exactly one handler-level test
- [ ] Endpoints that override the handler have documented per-endpoint tests

**Related Rules**: Test Handler-Level Consistency, Not Per-Endpoint
**Related Skills**: Test Error Response Shape
**Related Decision Trees**: Tree 1 — Error Shape Testing Approach

---

## Anti-Pattern 2: Partial Error Status Coverage

**Category**: Testing completeness

**Description**: Testing the error shape for only one or two status codes (e.g., only 422) while ignoring others (401, 403, 404, 429, 500).

**Warning Signs**:
- Test suite covers 422 shape but no test for 401, 403, 404, 429, or 500 shapes
- Error shape tests only exist for the most common error type (validation)
- Team assumes other error types follow the same shape without verification

**Why It's Harmful**: Each error status has a potentially different shape. 422 includes an `errors` dictionary, while 401/403/404/429 do not. 500 in production mode must strip stack traces. Testing only 422 misses structural differences and production-safety concerns.

**Real-World Consequence**: A framework upgrade changes the 404 error message from `"Not Found."` to `"Resource not found."`. No test catches this. Mobile apps parsing the error message for localization break silently.

**Preferred Alternative**: Write a dedicated shape test for each error status code the application can return.

**Refactoring Strategy**:
1. List all error status codes the application returns (401, 403, 404, 422, 429, 500)
2. Write one test per status code asserting the exact expected JSON shape
3. Use PestPHP datasets to parameterize: `it('returns :status shape', fn($status, $uri) => ...)->with('errorScenarios')`

**Detection Checklist**:
- [ ] 401 shape is tested
- [ ] 403 shape is tested
- [ ] 404 shape is tested
- [ ] 422 shape is tested
- [ ] 429 shape is tested (if rate limiting is configured)
- [ ] 500 shape is tested (production mode, no stack traces)

**Related Rules**: Test Each Error Status Code Shape
**Related Skills**: Test Error Response Shape

---

## Anti-Pattern 3: Testing Only Debug Mode, Never Production Mode

**Category**: Security

**Description**: Running error shape tests only with `APP_DEBUG=true` (or default), never asserting that production error responses exclude stack traces and debug information.

**Warning Signs**:
- Error shape tests don't set `config(['app.debug' => false])`
- No test asserts `assertJsonMissing(['file', 'line', 'trace', 'exception'])`
- The test environment runs with `APP_DEBUG=true` by default and no production-mode test exists

**Why It's Harmful**: In debug mode, error responses include stack traces, file paths, and SQL queries — all of which are security vulnerabilities in production. If `APP_DEBUG` is accidentally enabled in production, or if the handler doesn't strip debug info correctly, sensitive server internals are exposed to every API consumer.

**Real-World Consequence**: A deployment script accidentally sets `APP_DEBUG=true` on the production environment. Error responses include full stack traces with database credentials. An attacker exploits this to gain server access. No test caught the issue.

**Preferred Alternative**: Always test error shapes with `APP_DEBUG=false` and assert that `file`, `line`, `trace`, and `exception` keys are absent.

**Refactoring Strategy**:
1. Add `config(['app.debug' => false])` to error shape tests
2. Assert `assertJsonMissing(['file', 'line', 'trace', 'exception'])` in 500 error shape tests
3. Optionally add a debug-mode test that verifies stack traces are present (for development feedback)

**Detection Checklist**:
- [ ] Production-mode error shape tests exist for 500 errors
- [ ] `assertJsonMissing(['file', 'line', 'trace', 'exception'])` is present in production-mode tests
- [ ] No debug information leaks in production error responses

**Related Rules**: Test Both Debug And Production Error Shapes
**Related Skills**: Test Error Response Shape
**Related Decision Trees**: Tree 2 — Production vs Debug Error Shape

---

## Anti-Pattern 4: No Sensitive Data Absence Assertions

**Category**: Security

**Description**: Testing error response shape without verifying that sensitive data (emails, tokens, SQL queries) is absent.

**Warning Signs**:
- Error response tests use only `assertExactJson` or `assertJsonStructure` without `assertJsonMissing`
- No test checks that user input (like email addresses in validation errors) is excluded
- SQL queries or database error messages are not tested for absence in production error responses

**Why It's Harmful**: Error responses are a common vector for accidental data leaks. Stack traces may include query parameters with PII; validation error messages may repeat sensitive user input; database errors may expose table schemas.

**Real-World Consequence**: A validation error includes the submitted email in the error message; the email is logged and returned to the client; a compliance audit flags this as a PII exposure.

**Preferred Alternative**: Use `assertJsonMissing` to verify that sensitive patterns (specific emails, tokens, SQL fragments) do not appear in error responses.

**Refactoring Strategy**:
1. Identify sensitive data types that could appear in error responses (emails, tokens, SQL)
2. For each error shape test, add `assertJsonMissing` for representative sensitive values
3. Include tests that deliberately submit sensitive data (e.g., email in a body field) to confirm it's excluded from errors

**Detection Checklist**:
- [ ] Error response tests assert absence of sensitive data patterns
- [ ] PII (emails, tokens) is tested for exclusion in production-mode error responses
- [ ] SQL queries or database details are not exposed in error messages

**Related Rules**: Assert Absence Of Sensitive Data
**Related Skills**: Test Error Response Shape

---

## Anti-Pattern 5: Custom Error Fields Applied Inconsistently

**Category**: Testing completeness

**Description**: Adding custom error fields (trace_id, code, documentation_url) to some error types but not others, without testing for consistency.

**Warning Signs**:
- 422 responses include `trace_id` but 401 responses do not
- Custom error fields are added in the controller but not in the exception handler
- Only one exception type's render method is customized; others fall through to defaults

**Why It's Harmful**: Consumers that rely on custom error fields (e.g., `trace_id` for support tickets) must handle their absence in certain error types. Inconsistent application creates client-side complexity and unreliable error handling.

**Real-World Consequence**: A support system extracts `trace_id` from error responses to link support tickets to server logs. Some errors (401, 403) lack `trace_id`. Support tickets for authentication issues cannot be traced to server-side logs.

**Preferred Alternative**: Apply custom error fields uniformly in the exception handler and test that every error type includes them.

**Refactoring Strategy**:
1. Move all custom error field logic into the exception handler (not individual controllers)
2. Ensure every rendered exception type passes through the same customization code
3. Write a parameterized test that asserts custom field presence for every error status code

**Detection Checklist**:
- [ ] All error types include the same set of custom fields
- [ ] Custom field logic is centralized in the exception handler
- [ ] A parameterized test verifies custom field consistency across error types

**Related Rules**: Test Custom Error Fields Are Always Present
**Related Skills**: Test Error Response Shape
