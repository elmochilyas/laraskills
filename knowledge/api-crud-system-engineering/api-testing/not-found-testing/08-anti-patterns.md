# Anti-Patterns — Not Found Testing

## Anti-Pattern 1: Status-Only 404 Assertion

**Category**: Testing completeness

**Description**: Asserting only `assertNotFound()` without verifying the error response body structure.

**Warning Signs**:
- Tests use `->assertNotFound()` with no `->assertJson(...)` chained call
- Error response shape is never explicitly validated

**Why It's Harmful**: A 404 status without a consistent error body means the endpoint may be returning HTML, a generic string, or a malformed JSON structure that client error-handling code cannot parse.

**Real-World Consequence**: API clients silently swallow errors or crash because they expect `{"message": "Not Found."}` but receive raw HTML or `null`.

**Preferred Alternative**: Always chain error body assertion: `->assertNotFound()->assertJson(['message' => 'Not Found.'])`.

**Refactoring Strategy**:
1. Add `->assertJson(['message' => 'Not Found.'])` to every existing 404 test
2. Extract a helper `assertNotFoundJson()` if the pattern repeats

**Detection Checklist**:
- [ ] Every `assertNotFound()` call has a matching body assertion

**Related Rules**: Assert Error Body On 404
**Related Skills**: Test Not Found Responses
**Related Decision Trees**: Tree 1 — 404 Coverage per Endpoint

---

## Anti-Pattern 2: Missing Soft-Delete 404 Coverage

**Category**: Testing completeness

**Description**: Testing only non-existent IDs (e.g., `999999`) without verifying that soft-deleted resources return 404.

**Warning Signs**:
- Only `999999` or similar sentinel IDs appear in 404 tests
- No test creates a record, deletes it, and then requests it via the API
- Soft-delete models exist but are not part of the 404 test suite

**Why It's Harmful**: Soft-deleted records exist in the database but are excluded by Eloquent's default query scope. Route model binding may resolve the ID (record exists) but the controller may unexpectedly return data, or worse, the binding itself may bypass the global scope and expose deleted data.

**Real-World Consequence**: Soft-deleted records remain accessible via API after deletion, violating data retention policies and user expectations of deletion.

**Preferred Alternative**: For each soft-deletable resource, write a test that: (1) creates a record, (2) soft-deletes it, (3) requests it via the API, (4) asserts 404.

**Refactoring Strategy**:
1. Identify all soft-deletable models
2. Add a dedicated test per model: `it('returns 404 for soft-deleted post', ...)`
3. Verify that the response does not include the soft-deleted record's data

**Detection Checklist**:
- [ ] All soft-deletable models have a soft-delete 404 test
- [ ] Tests cover the exact ID of the soft-deleted record

**Related Rules**: Test Soft-Deleted Resource Access
**Related Skills**: Test Not Found Responses
**Related Decision Trees**: Tree 1 — 404 Coverage per Endpoint

---

## Anti-Pattern 3: Skipping Invalid ID Shape Tests

**Category**: Testing completeness

**Description**: Testing 404 only with valid-shaped but non-existent IDs (e.g., `999999` for integer keys), ignoring mismatched types like strings for integer bindings.

**Warning Signs**:
- All 404 tests use numeric IDs even though the route could receive arbitrary strings
- No test passes `"abc"` or `"not-a-number"` to an integer-keyed route
- UUID-keyed routes are tested only with valid UUIDs

**Why It's Harmful**: Laravel's route model binding casts URL parameters to the model key type. A string passed to an integer-keyed route may throw `UnexpectedValueException` (500) instead of the expected `ModelNotFoundException` (404). This produces a 5xx error that monitoring systems treat as a server failure.

**Real-World Consequence**: Production monitoring shows 5xx error spikes from crawlers or malicious requests; on-call engineers investigate false positives; API consumers receive 500 errors for what should be 404s.

**Preferred Alternative**: Test each unique route key type with mismatched shapes: string for integer keys, non-UUID for UUID keys, invalid slugs for slug keys.

**Refactoring Strategy**:
1. Identify the route key type for each resource model
2. Add tests: `it('returns 404 for non-integer ID', fn () => $this->getJson('/api/posts/abc')->assertNotFound())`
3. Include negative and zero IDs for integer keys

**Detection Checklist**:
- [ ] Integer-keyed routes tested with string IDs
- [ ] UUID-keyed routes tested with non-UUID strings
- [ ] Custom route keys tested with invalid formats

**Related Rules**: Test Invalid ID Shapes
**Related Skills**: Test Not Found Responses
**Related Decision Trees**: Tree 2 — Invalid ID Shape Handling

---

## Anti-Pattern 4: No Database Mutation Check On 404 Updates

**Category**: Testing correctness

**Description**: Asserting 404 on update or destroy requests without verifying that the database state remains unchanged.

**Warning Signs**:
- Update/Destroy 404 tests only check the HTTP response status
- No `assertDatabaseCount()` or count comparison is performed
- Factory-created records are not counted before and after the request

**Why It's Harmful**: A 404 HTTP response does not guarantee the database was untouched. The controller may have executed partial mutations before the binding check failed, or the endpoint may have unexpected side effects for non-existent resources.

**Real-World Consequence**: Accidental record creation or mutation occurs on requests that appear to fail safely. Data inconsistencies propagate silently.

**Preferred Alternative**: Compare database record counts before and after the 404 request, or use `assertDatabaseCount()` to confirm no changes.

**Refactoring Strategy**:
1. Capture `Model::count()` before the request
2. Assert the count is unchanged after the 404 response
3. Consider using `assertDatabaseHas()` / `assertDatabaseMissing()` for targeted checks

**Detection Checklist**:
- [ ] Every update/destroy 404 test includes a database state assertion
- [ ] Read-only (show) 404 tests are exempted

**Related Rules**: Verify No DB Mutation On Non-Existent Resource Updates
**Related Skills**: Test Not Found Responses

---

## Anti-Pattern 5: Inconsistent 404 Error Shape Across Endpoints

**Category**: API consistency

**Description**: Different endpoints return different JSON structures for 404 responses.

**Warning Signs**:
- Some endpoints return `{"message": "Not Found."}`, others `{"error": "Resource not found"}`
- Individual controllers override the exception handler's default 404 format
- Custom abort(404) calls use inconsistent array structures

**Why It's Harmful**: API clients typically parse 404 errors from a single error-handling code path. Inconsistent shapes force clients to implement multiple response parsers or, worse, fail to parse and silently hide errors.

**Real-World Consequence**: Client-side error handling breaks for specific endpoints; integration tests pass because they check only the status code; production bugs go undetected until users report unhandled error states.

**Preferred Alternative**: Centralize 404 response formatting in the exception handler via `render()` or a dedicated error response class. Test the global shape once and trust it.

**Refactoring Strategy**:
1. Move all 404 response formatting to `App\Exceptions\Handler::render()`
2. Remove per-controller 404 abort calls that customize the shape
3. Add one architecture test that enforces the global 404 format across all endpoints

**Detection Checklist**:
- [ ] No controller overrides the 404 response format
- [ ] A single test covers the global 404 shape
- [ ] Architecture tests fail if an endpoint deviates

**Related Rules**: Assert Error Body On 404
**Related Skills**: Test Not Found Responses, Test Error Response Shape

---

## Anti-Pattern 6: Treating Empty Collection as Not Found

**Category**: Testing knowledge

**Description**: Writing 404 tests for collection index endpoints or treating an empty `data: []` response as equivalent to a 404.

**Warning Signs**:
- Tests exist that assert 404 on index endpoints
- Documentation or tests refer to "no results" as "not found"
- Error handling conflates empty collections with missing resources

**Why It's Harmful**: Index endpoints with no results return 200 with an empty array, not 404. Applying 404 semantics to collections breaks standard REST conventions and confuses API consumers who expect empty results to be a valid, non-error state.

**Real-World Consequence**: Clients that distinguish between "no results" (empty array) and "not found" (404) break; front-end components show error states instead of empty states.

**Preferred Alternative**: Index endpoints must return 200 with `data: []` for empty collections. Reserve 404 exclusively for resource-member routes that target a specific identifier.

**Refactoring Strategy**:
1. Remove any 404 assertions from index endpoint tests
2. Ensure index endpoints return 200 with `data: []` when no records match
3. Update any client code that treats empty responses as errors

**Detection Checklist**:
- [ ] No index endpoint tests assert 404
- [ ] Empty collection responses return 200

**Related Rules**: Test Every Member Route For 404
**Related Skills**: Test Not Found Responses
