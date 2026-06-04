# Anti-Patterns — Response Shape Testing

## Anti-Pattern 1: Value-First Assertion Ordering

**Category**: Testing methodology

**Description**: Asserting specific values (via `assertJson` or `assertJsonFragment`) before asserting the JSON structure with `assertJsonStructure`.

**Warning Signs**:
- Tests call `assertJsonFragment` before `assertJsonStructure`
- Failure messages appear as "expected 'Hello' but got null" instead of "expected key 'title' in structure"

**Why It's Harmful**: When the response shape is wrong (missing keys, renamed fields), value assertions produce confusing failure messages. Developers waste time debugging what appears to be a value bug when the root cause is a missing key.

**Real-World Consequence**: CI failures are misdiagnosed; developers spend minutes or hours tracing a missing-key issue that a preceding shape assertion would have caught instantly.

**Preferred Alternative**: Assert shape first with `assertJsonStructure`, then assert values with `assertJson` or `assertJsonFragment`.

**Refactoring Strategy**:
1. Review each test file; reorder assertions so `assertJsonStructure` comes before any `assertJson` or `assertJsonFragment` call
2. If both are adjacent, simply swap the lines
3. If value assertions are spread across multiple helpers, add a single shape assertion at the top of the test method

**Detection Checklist**:
- [ ] `assertJsonStructure` is the first JSON assertion in every test
- [ ] No `assertJson` / `assertJsonFragment` appears before a shape assertion

**Related Rules**: Assert Shape Before Content
**Related Skills**: Assert Response Shape Before Content

---

## Anti-Pattern 2: Missing `*` Wildcard on Collection Endpoints

**Category**: Testing completeness

**Description**: Using `assertJsonStructure` on collection responses without the `*` wildcard, which validates only the first array element.

**Warning Signs**:
- Collection endpoint shape assertions use `['data' => ['id', 'title']]` instead of `['data' => ['*' => ['id', 'title']]]`
- Empty collections pass shape validation silently

**Why It's Harmful**: Without `*`, `assertJsonStructure` validates only the first array element. An empty collection (`data: []`) passes validation because there are no elements to check. A collection with 3 items where only the first has correct structure also passes — the 2nd and 3rd items are never validated.

**Real-World Consequence**: A backend change that adds a required field to only the first resource returned (e.g., due to a join quirk) passes tests but breaks clients that parse subsequent resources.

**Preferred Alternative**: Always use `['data' => ['*' => [...]]]` for collection endpoints. The `*` wildcard ensures every element matches the expected structure.

**Refactoring Strategy**:
1. Find all `assertJsonStructure` calls on collection endpoints
2. Add `'*' =>` before the item structure array
3. Verify that empty collections still pass (they should)

**Detection Checklist**:
- [ ] Every collection endpoint test uses `*` wildcard in shape assertions
- [ ] Single-resource endpoints (show, store) correctly omit `*`

**Related Rules**: Use `*` Wildcard For Collection Endpoints
**Related Skills**: Assert Response Shape Before Content

---

## Anti-Pattern 3: Duplicated Inline Shape Definitions

**Category**: Maintainability

**Description**: Copying the same shape array across multiple test files instead of defining a reusable per-resource-type structure helper.

**Warning Signs**:
- The same array of keys appears in show, index, store, and update test files
- Adding a field to an API resource requires editing test files
- Shape definitions are scattered across 5+ test files for the same resource

**Why It's Harmful**: Duplication creates a maintenance burden. When a field is added to a resource, every inline shape must be updated. Missed updates cause false test failures or, worse, tests that pass but don't validate the complete shape.

**Real-World Consequence**: A team adds `author` to the Post API Resource; they update 4 out of 7 test files; the remaining 3 tests silently pass without validating the new field. A later refactor removes `author` from the tests that do validate it — no one notices because the other 3 pass.

**Preferred Alternative**: Define a single shape helper per resource type (e.g., `assertPostStructure($response, $collection = false)`) and reuse across all test files.

**Refactoring Strategy**:
1. Extract the common shape array into a helper function in a shared test file (e.g., `tests/Helpers/ResourceAssertions.php`)
2. Accept a `$collection` boolean parameter to add/omit `*`
3. Replace all inline shape assertions with calls to the helper

**Detection Checklist**:
- [ ] Each resource type has exactly one shape definition
- [ ] All tests for that resource type call the centralized helper

**Related Rules**: Define Per-Resource-Type Structure Helpers
**Related Skills**: Assert Response Shape Before Content

---

## Anti-Pattern 4: Shallow Shape Assertions on Nested Responses

**Category**: Testing completeness

**Description**: Asserting only the top-level keys of a response without validating nested structures (relations, pagination wrappers).

**Warning Signs**:
- Shape tests check `['data' => ['*' => ['id', 'title', 'author']]]` but not the nested `author` keys
- Paginated response tests check `['data' => [...], 'meta' => [...], 'links' => [...]]` without enumerating exact meta/links keys

**Why It's Harmful**: Nested structures represent the deepest contract surface. A flat shape test passes even if nested objects are missing critical keys. An `author` key could change from `author: { id, name }` to `author: { id, full_name }` without the shape test detecting it.

**Real-World Consequence**: A refactoring changes a nested relation's response structure; clients break parsing nested data; the test suite passes green because shape assertions are too shallow.

**Preferred Alternative**: Assert nested structures explicitly by specifying the full key tree for each nested object.

**Refactoring Strategy**:
1. For each nested `relation` key, expand the shape assertion to include the relation's expected keys
2. Use separate helpers for deeply nested structures if they grow complex
3. For conditionally-loaded relations, add separate tests with the relation loaded and unloaded

**Detection Checklist**:
- [ ] Every nested object in the response has its own key-level shape assertion
- [ ] Pagination wrappers (`meta`, `links`) have explicit key assertions

**Related Rules**: Test Deep Nesting Explicitly
**Related Skills**: Assert Response Shape Before Content
**Related Decision Trees**: Tree 1 — Shape Test Depth

---

## Anti-Pattern 5: Shared Shape Definitions Across API Versions

**Category**: Architecture

**Description**: Using the same shape helper for multiple API versions, causing false failures when versions diverge.

**Warning Signs**:
- A single `assertPostStructure` function is used by both V1 and V2 tests
- Version-specific field renames or structural changes require conditionals inside the shared helper

**Why It's Harmful**: A single shape definition forces all versions to conform to the same structure. When V2 renames `author_name` to a nested `author` object, the shared helper either breaks for V1 or V2, or becomes cluttered with version-checking conditionals.

**Real-World Consequence**: V2 response changes are blocked by V1 tests; teams resort to adding `if (version === 'v2')` branches inside helpers, increasing complexity and reducing confidence.

**Preferred Alternative**: Define version-specific shape helpers (e.g., `assertV1PostStructure`, `assertV2PostStructure`). If versions share a common base, extract a `assertBasePostStructure` and call it from version-specific helpers.

**Refactoring Strategy**:
1. Rename the shared helper with a version prefix
2. Create a new helper for each additional version
3. Extract common keys into a base helper if duplication is significant

**Detection Checklist**:
- [ ] Each API version has its own shape helper or a clean override mechanism
- [ ] No version-specific conditionals exist inside shared helpers

**Related Rules**: Version Shape Expectations Per API Version
**Related Skills**: Assert Response Shape Before Content
**Related Decision Trees**: Tree 1 — Shape Test Depth

---

## Anti-Pattern 6: No Unexpected-Key Assertions

**Category**: Security

**Description**: Validating that expected keys exist but never asserting that unexpected keys (sensitive or internal fields) are absent from the response.

**Warning Signs**:
- Shape tests use only `assertJsonStructure` without `assertJsonMissing`
- Tests pass even if responses include `password`, `remember_token`, `pivot`, or internal JSON:API fields
- No security-focused shape tests exist

**Why It's Harmful**: Shape tests verify key presence, not key absence. An accidental exposure of sensitive fields (due to a missing `$hidden` property or a lazy-loaded pivot) passes shape validation because shape tests only check that expected keys exist.

**Real-World Consequence**: Password hashes, internal flags, or pivot data are exposed via the API for months because the test suite never checked for their absence.

**Preferred Alternative**: After asserting the expected structure, call `assertJsonMissing(['password', 'remember_token', 'pivot'])` to confirm sensitive fields are absent.

**Refactoring Strategy**:
1. Identify all sensitive/internal model attributes across the codebase
2. Add `assertJsonMissing` calls to shape tests, particularly for models with `$hidden` properties
3. Include pivot data assertions for Many-to-Many relationships

**Detection Checklist**:
- [ ] Every resource model's shape test includes an unexpected-key assertion
- [ ] Sensitive fields are explicitly listed in `assertJsonMissing` calls
- [ ] Pivot data is checked for absence in Many-to-Many responses

**Related Rules**: Verify No Unexpected Keys Exposed
**Related Skills**: Assert Response Shape Before Content
