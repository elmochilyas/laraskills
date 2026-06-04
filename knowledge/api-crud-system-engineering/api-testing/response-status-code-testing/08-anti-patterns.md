# Anti-Patterns — Response Status Code Testing

## Anti-Pattern 1: Status Assertion After Body Assertions

**Category**: Testing methodology

**Description**: Asserting response body content (shape, values) before asserting the HTTP status code.

**Warning Signs**:
- `assertJsonStructure` or `assertJson` appears before `assertOk` in the assertion chain
- Failure messages report missing keys when the actual error is a 422 or 500 status

**Why It's Harmful**: If the status is wrong, body assertions either fail with confusing messages (e.g., "expected key 'title' but got null") or pass accidentally against an error response body. Developers waste time debugging body structure when the real problem is a status code regression.

**Real-World Consequence**: A middleware change accidentally returns 500 for all requests. The test suite fails with 100+ confusing "expected key" errors instead of clear "expected 200 but got 500" failures.

**Preferred Alternative**: Always assert the status code as the first assertion in every test chain.

**Refactoring Strategy**:
1. Review every test file; move the status assertion before all body/header assertions
2. Use chained methods: `$response->assertOk()->assertJsonStructure([...])`

**Detection Checklist**:
- [ ] No body assertion precedes a status assertion in any test
- [ ] All tests use `$response->assertOk()->...` or equivalent chaining

**Related Rules**: Assert Status First In Every Test Chain
**Related Skills**: Test Response Status Codes
**Related Decision Trees**: Tree 1 — Status Code Assertion Strategy

---

## Anti-Pattern 2: Non-Canonical CRUD Status Codes

**Category**: API design

**Description**: Returning 200 for resource creation (instead of 201) or 200 for deletion (instead of 204).

**Warning Signs**:
- Store endpoint tests assert `assertOk()` instead of `assertCreated()`
- Destroy endpoint tests assert `assertOk()` or `assertStatus(200)` instead of `assertNoContent()`
- The response body contains serialized model data for delete operations

**Why It's Harmful**: API consumers rely on canonical status codes to determine operation outcomes without parsing the response body. A 200 on creation forces clients to check the Location header or response body, increasing complexity. A 200 on deletion wastes bandwidth serializing a deleted model.

**Real-World Consequence**: Client SDKs treat 200 for store as a read operation; caching layers misunderstand the response; mobile apps show stale data because the 201 "created" semantic was missing.

**Preferred Alternative**: Use `assertCreated()` (201) for store endpoints and `assertNoContent()` (204) for destroy endpoints.

**Refactoring Strategy**:
1. Change store endpoint controllers to return `response()->json($resource, 201)` or `->response()->setStatusCode(201)`
2. Change destroy endpoints to return `response()->noContent()` (204)
3. Update all tests to use `assertCreated()` and `assertNoContent()`

**Detection Checklist**:
- [ ] All store tests use `assertCreated()` (201)
- [ ] All destroy tests use `assertNoContent()` (204)
- [ ] No delete endpoint returns a response body

**Related Rules**: Use Canonical CRUD Status Codes, Assert 204 For Delete
**Related Skills**: Test Response Status Codes

---

## Anti-Pattern 3: 401/403 Confusion

**Category**: Testing correctness

**Description**: Returning 401 for unauthorized (authenticated but not permitted) requests, or 403 for unauthenticated requests.

**Warning Signs**:
- `assertForbidden()` is used when the test does not authenticate the user
- `assertUnauthorized()` is used when the test acts as an authenticated user
- The same error code is used for both missing authentication and missing permissions

**Why It's Harmful**: 401 means "identify yourself" — the client can retry with credentials. 403 means "you are identified but not allowed" — retrying won't help. Returning the wrong code causes clients to loop forever (retrying on 403) or give up prematurely (not retrying on 401).

**Real-World Consequence**: Mobile apps retry authentication indefinitely on endpoints that truly return 403, draining battery and confusing users with repeated login prompts.

**Preferred Alternative**: Always use `assertUnauthorized()` (401) for unauthenticated requests and `assertForbidden()` (403) for authenticated-but-denied requests.

**Refactoring Strategy**:
1. Audit all 401/403 assertions in tests
2. Ensure unauthenticated tests (no `actingAs`) assert `assertUnauthorized()`
3. Ensure unauthorized access tests (with `actingAs` but wrong permissions) assert `assertForbidden()`
4. Fix controllers that return the wrong code

**Detection Checklist**:
- [ ] Unauthenticated tests use `assertUnauthorized()` (401)
- [ ] Authorization failure tests use `assertForbidden()` (403)
- [ ] No controller returns 401 when the user is authenticated

**Related Rules**: Don't Confuse 401 With 403
**Related Skills**: Test Response Status Codes, Test Authentication Failures, Test Authorization Failures

---

## Anti-Pattern 4: Missing Status Code Tests for Error Conditions

**Category**: Testing completeness

**Description**: Testing only the happy path status codes without covering error conditions (validation failures, not found, unauthorized, rate limited).

**Warning Signs**:
- Test files contain only `assertOk()`, `assertCreated()`, `assertNoContent()` — no error status assertions
- Validation failure tests don't assert 422
- NotFound tests don't assert 404

**Why It's Harmful**: Error conditions are the most likely path for wrong status codes. An uncaught `ValidationException` returns 500 instead of 422. A misconfigured route model binding returns 500 instead of 404. These silently degrade API reliability because the tests pass without checking error paths.

**Real-World Consequence**: Production validation errors return 500; monitoring systems page on-call engineers for every invalid form submission; the team desensitizes to 5xx alerts.

**Preferred Alternative**: For each endpoint, test every condition that returns a distinct status code: success, validation error, not found, unauthorized, forbidden, rate limited.

**Refactoring Strategy**:
1. For each endpoint, enumerate all possible response conditions
2. Add a test for each condition asserting the expected status code
3. Use PestPHP datasets to parameterize across multiple endpoints

**Detection Checklist**:
- [ ] Each endpoint has a test for every status code it can return
- [ ] Error conditions (422, 404, 401, 403, 429) are all covered
- [ ] 500 is tested only for truly exceptional cases (not for expected errors)

**Related Rules**: Map Every Condition To Expected Status
**Related Skills**: Test Response Status Codes

---

## Anti-Pattern 5: Wrong Status Code for Delete (200 Instead of 204)

**Category**: Testing correctness

**Description**: Delete endpoints return 200 with a JSON body instead of 204 No Content with an empty body.

**Warning Signs**:
- `$response->assertOk()` or `$response->assertStatus(200)` is used for delete endpoints
- Delete endpoint responses include a JSON body with the deleted resource data
- Controller deletes the model and then returns `$this->resourceResponse($model)` instead of `response()->noContent()`

**Why It's Harmful**: Returning 200 with a serialized model wastes database queries (re-fetching the deleted model), response bandwidth, and client processing time. It also implies the deleted resource still exists (it was just serialized), confusing consumers.

**Real-World Consequence**: Mobile apps display deleted resources because the serialized response body is cached or processed as an active resource. Database logs show unnecessary SELECT queries after DELETE statements.

**Preferred Alternative**: Always assert `assertNoContent()` (204) for destroy endpoints, and verify an empty response body.

**Refactoring Strategy**:
1. Change controller destroy method to `return response()->noContent();`
2. Remove model serialization from destroy responses
3. Update tests to use `assertNoContent()` and verify no body

**Detection Checklist**:
- [ ] Every delete endpoint test uses `assertNoContent()` (204)
- [ ] No delete endpoint returns a response body
- [ ] No model serialization occurs in destroy methods

**Related Rules**: Assert 204 For Delete
**Related Skills**: Test Response Status Codes
