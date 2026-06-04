# Anti-Patterns: Happy Path Testing

## AP-1: Status-Only Assertions
**Category**: Testing

**Description**: Asserting only `assertOk()` or `assertStatus(200)` on happy path responses without verifying response structure or content. The endpoint returns 200 but the response may have wrong keys, missing data, or incorrect values.

**Warning Signs**:
- Happy path tests only call `$response->assertOk()` with no further assertions
- Responses with wrong JSON structure pass tests
- API changes that break response shape go undetected
- Consumers report missing or incorrectly named fields that tests should have caught
- No `assertJsonStructure`, `assertJsonFragment`, or `assertJson` calls

**Harms**:
- False-positive test passes — API returns 200 but broken response
- Response shape changes undetected by tests
- Consumers break when response structure changes
- No living documentation of API contract
- API evolution without test feedback

**Real-World Consequence**: A refactoring accidentally removes the `meta.total` field from the paginated posts response. The happy path test calls `$response->assertOk()` and passes. Consumers break the next day when trying to parse `meta.total`. The test suite was green because it never verified response content.

**Preferred Alternative**: Assert status first, then response structure (using `assertJsonStructure`), then specific content values (using `assertJsonFragment`), and finally database state for mutations.

**Refactoring Strategy**: Review all happy path tests, add `assertJsonStructure` for every endpoint response, add `assertJsonFragment` for key data values, add `assertDatabaseHas`/`assertDatabaseMissing` for mutations.

**Detection Checklist**:
- `[ ]` Do happy path tests verify response structure?
- `[ ]` Do happy path tests verify specific data values?
- `[ ]` Would a shape change be caught by tests?
- `[ ]` Are database state assertions present for mutations?

**Related**: 05-rules.md (Assert Status Before Structure Before Content), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: Missing Database Assertions on Mutations
**Category**: Testing

**Description**: Testing that a POST endpoint returns 201 Created without verifying the record actually exists in the database. The controller may return success without persisting data.

**Warning Signs**:
- POST test uses `assertCreated()` but no `assertDatabaseHas()`
- PUT/PATCH test uses `assertOk()` but no `assertDatabaseHas()` for updated values
- DELETE test uses `assertNoContent()` but no `assertDatabaseMissing()`
- Controllers that silently fail to persist data pass tests
- Integration with queues/dispatches: record created in DB later, not in request

**Harms**:
- False-positive test passes when database write fails silently
- Data loss in production — API says success but nothing saved
- Developers trust the test and don't verify manually
- Hard to debug: "the API returned 201, where's my data?"

**Real-World Consequence**: A POST /posts endpoint has a bug: the controller creates the post but a `Model::create()` call uses wrong column names, silently failing (mass assignment protection). The happy path test asserts `assertCreated()` and passes. In production, every "successful" post creation actually saves nothing. Consumers think their data is saved but it disappears on page refresh.

**Preferred Alternative**: After every mutating endpoint (store, update, destroy), assert the database state changed accordingly.

**Refactoring Strategy**: Add `assertDatabaseHas('posts', ['id' => $post->id, 'title' => $data['title']])` after store, add `assertDatabaseHas('posts', ['title' => 'Updated'])` after update, add `assertDatabaseMissing('posts', ['id' => $post->id])` after destroy.

**Detection Checklist**:
- `[ ]` Do POST tests assert database has the created record?
- `[ ]` Do PUT/PATCH tests assert database has updated values?
- `[ ]` Do DELETE tests assert database no longer has the record?
- `[ ]` Are database assertions specific (check data values, not just existence)?

**Related**: 05-rules.md (Verify Database Mutation On Store, Update, Destroy), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-3: Brittle Exact JSON Matches
**Category**: Maintainability

**Description**: Using `assertExactJson` for happy path assertions. Tests break when unrelated fields are added or order changes, creating high maintenance costs for harmless API changes.

**Warning Signs**:
- `assertExactJson` used in happy path tests
- Tests fail when new fields are added to responses
- Tests fail because of timestamp differences
- Tests fail due to field ordering (JSON object key order)
- Developers avoid adding fields because "tests break"

**Harms**:
- Brittle tests — fail on unrelated changes
- High maintenance costs for harmless additions
- Developers discouraged from improving API responses
- CI red for non-breaking changes
- Time wasted updating test expectations

**Real-World Consequence**: A happy path test uses `assertExactJson(['id' => 1, 'title' => 'Hello', 'created_at' => '2026-01-01T00:00:00Z'])`. The API adds a `body` field to the response. The test fails. A developer must update 20 exact-match assertions across the test suite. Next sprint, they add `updated_at` — another 20 updates.

**Preferred Alternative**: Use `assertJsonStructure` for shape verification and `assertJsonFragment` for specific values. Reserve `assertExactJson` for when the entire response must be verified byte-for-byte.

**Refactoring Strategy**: Replace `assertExactJson` with `assertJsonStructure` + `assertJsonFragment` for most tests, keep `assertExactJson` only for contract/signed responses, use `assertJsonFragment` for partial data verification.

**Detection Checklist**:
- `[ ]` Are `assertExactJson` calls necessary or could they be replaced?
- `[ ]` Do tests fail when new fields are added to responses?
- `[ ]` Are timestamps or dynamic values causing test failures?
- `[ ]` Can the test survive a non-breaking API change?

**Related**: 05-rules.md (Use AssertJsonFragment Over AssertExactJson), 04-standardized-knowledge.md

---

## AP-4: Skipping Pagination Structure Assertions
**Category**: Testing

**Description**: Testing that a collection endpoint returns 200 without asserting the pagination structure. A broken pagination format (missing `meta.total`, wrong `links.next` format) breaks every consumer that parses paginated responses.

**Warning Signs**:
- Index/collection endpoint tests only assert `assertOk()` and JSON count
- No assertion of `meta` structure (current_page, last_page, per_page, total)
- No assertion of `links` structure (first, last, prev, next)
- Pagination format changed without test catching it
- Consumers complain about pagination parsing errors

**Harms**:
- Broken pagination reaches consumers undetected
- UI list views break silently
- Client SDKs cannot parse responses
- Debugging requires manual API inspection
- Pagination contract drifts without tests noticing

**Real-World Consequence**: A pagination refactoring changes `meta.total` to `meta.total_count`. The index endpoint test only asserts `assertOk()` and `assertJsonCount(3, 'data')` — both pass. The SPA consumer breaks because it parses `meta.total`. The change was deployed to production and caught by an end-user bug report 2 days later.

**Preferred Alternative**: Assert the pagination structure (`data`, `meta`, `links`) on every collection/index endpoint happy path test.

**Refactoring Strategy**: Add `assertJsonStructure` for `data`, `meta` (current_page, last_page, per_page, total), and `links` (first, last, prev, next) to all index endpoint tests, verify with different page sizes and page numbers.

**Detection Checklist**:
- `[ ]` Do index endpoint tests assert pagination structure?
- `[ ]` Are `meta` and `links` fields verified?
- `[ ]` Would a pagination format change be caught by tests?
- `[ ]` Do consumers parse pagination fields that tests don't check?

**Related**: 05-rules.md (Test Index Pagination Structure), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: Mixed Outcomes in One Test
**Category**: Testing

**Description**: Combining happy path and failure assertions in a single test method. The test fails for unclear reasons — it's impossible to tell whether the success path broke or the error handling broke.

**Warning Signs**:
- Test method creates a resource, then tests invalid input on the same endpoint
- Test name suggests "handles" rather than specific outcomes
- Multiple HTTP calls in one test with different expected status codes
- Assertions for both `assertOk()` and `assertStatus(422)` in the same test
- Test covers multiple scenarios in sequence

**Harms**:
- Unclear failure messages — hard to identify regression type
- One broken scenario masks others in the same test
- Tests become integration suites rather than targeted assertions
- Difficult to determine contract vs. error handling regression

**Real-World Consequence**: A test named `test_post_creation` creates a post successfully (asserts 201), then tries creating with empty title (asserts 422). The 201 step fails because a validation rule changed. The test reports `assertCreated()` failure, but the developer needs 5 minutes to realize the real issue is in the first assertion (creation), not the second (validation).

**Preferred Alternative**: Write separate tests for happy path and failure scenarios. One test per endpoint per outcome.

**Refactoring Strategy**: Split mixed-outcome tests into separate test methods, name each test by the specific outcome it validates, ensure each test has independent setup, keep one HTTP call per test method.

**Detection Checklist**:
- `[ ]` Do tests mix `assertOk()`/`assertCreated()` with `assertStatus(4xx)`?
- `[ ]` Are there tests making multiple HTTP calls with different expected outcomes?
- `[ ]` Is each test method focused on a single scenario?
- `[ ]` Would splitting the test improve failure clarity?

**Related**: 05-rules.md (One Test Per Endpoint Per Outcome, Separate Happy Path From Failure), 04-standardized-knowledge.md, 06-skills.md
