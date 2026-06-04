# Anti-Patterns — Pagination Response Testing

## Anti-Pattern 1: Single-Page-Only Testing

**Category**: Testing completeness

**Description**: Testing only the first page of paginated results without seeding enough records for multi-page scenarios.

**Warning Signs**:
- Tests seed fewer records than the default `per_page`, so only one page is ever tested
- No test requests `?page=2` or asserts `links.next` is non-null
- The `last_page` value is hardcoded as `1` in assertions

**Why It's Harmful**: The most common pagination bugs — incorrect `last_page`, broken `next` links, missing `prev` links — only surface when multiple pages exist. Single-page testing misses all of them.

**Real-World Consequence**: When the API grows past 15 records, the `next` link returns the same page as the current one; mobile app infinite scrolling duplicates items or loops forever.

**Preferred Alternative**: Seed at least `per_page + 1` records and assert multi-page behavior (correct `last_page`, non-null `next`, correct item count on last page).

**Refactoring Strategy**:
1. Find all paginated endpoint tests
2. Increase seed data to `default_per_page + 1` records
3. Add assertions for page 2, `last_page`, `links.next`, and `links.prev`

**Detection Checklist**:
- [ ] Every pagination test seeds at least `per_page + 1` records
- [ ] At least one test asserts behavior on page 2 or the last page
- [ ] `links.next` is asserted as non-null on page 1 (when multiple pages exist)

**Related Rules**: Seed Data For Multi-Page Scenarios, Test Boundary Pages
**Related Skills**: Assert Paginated Response Structure
**Related Decision Trees**: Tree 2 — Boundary Page Testing

---

## Anti-Pattern 2: Incomplete Pagination Shape Assertions

**Category**: Testing completeness

**Description**: Asserting only the `data` array count without validating the full `meta` and `links` structure.

**Warning Signs**:
- Pagination tests use only `assertJsonCount` without `assertJsonStructure` for `meta` and `links`
- The `meta.current_page`, `meta.last_page`, `meta.per_page`, `meta.total` keys are never explicitly asserted
- `links.first`, `links.last`, `links.prev`, `links.next` are never validated

**Why It's Harmful**: The pagination envelope is the most frequently parsed structure by API clients — list views, infinite scroll, and pagination controls depend on every meta and link key. A missing or renamed key breaks every consumer.

**Real-World Consequence**: A backend change renames `meta.items_per_page` to `meta.per_page`; the old key disappears; all mobile apps crash parsing the pagination metadata. Tests pass because they only check the data count.

**Preferred Alternative**: Assert the complete pagination structure: `assertJsonStructure(['data' => ['*' => [...]]], 'meta' => ['current_page', 'last_page', 'per_page', 'total'], 'links' => ['first', 'last', 'prev', 'next'])`.

**Refactoring Strategy**:
1. Add full `assertJsonStructure` assertions for the pagination envelope
2. Include `meta` and `links` in the shape check, not just `data`
3. Extract a reusable pagination shape helper if multiple endpoints share the same structure

**Detection Checklist**:
- [ ] Pagination tests assert the full `meta` structure
- [ ] Pagination tests assert the full `links` structure
- [ ] No pagination test relies solely on `assertJsonCount` for shape validation

**Related Rules**: Assert Full Pagination Shape
**Related Skills**: Assert Paginated Response Structure
**Related Decision Trees**: Tree 1 — Paginator Type Selection for Testing

---

## Anti-Pattern 3: Missing Boundary Page Tests

**Category**: Testing completeness

**Description**: Testing only the default page (page 1) without covering the last page or pages beyond the last.

**Warning Signs**:
- No test requests the last page explicitly
- No test requests a page beyond the last page
- No test verifies `links.next` is null on the last page

**Why It's Harmful**: The last page often has fewer items than `per_page` — testing it verifies the paginator correctly handles partial pages. A page beyond the last must return 200 with empty data and valid meta, not 404. Without these tests, both scenarios can break silently.

**Real-World Consequence**: Users scrolling to the last page see a blank error state because the API returns 404 for page 3 of 3. The mobile app shows "no results" instead of the actual last-page items.

**Preferred Alternative**: Test page 1 (full), last page (partial), and page beyond last (empty), asserting correct structure and links for each.

**Refactoring Strategy**:
1. Calculate `last_page` from seed data count
2. Add a test for the last page: assert fewer items, `links.next` is null
3. Add a test for page beyond last: assert empty `data`, same meta structure, `total` unchanged

**Detection Checklist**:
- [ ] Last page is tested (fewer items, no `next` link)
- [ ] Page beyond last is tested (empty data, valid meta)
- [ ] `links.next` is null on last page
- [ ] `links.prev` is null on page 1

**Related Rules**: Test Boundary Pages
**Related Skills**: Assert Paginated Response Structure
**Related Decision Trees**: Tree 2 — Boundary Page Testing

---

## Anti-Pattern 4: Missing Per_Page Boundary Tests

**Category**: Testing completeness

**Description**: Testing pagination only with the default `per_page` without testing parameter boundaries (zero, negative, exceeding max).

**Warning Signs**:
- No test requests `?per_page=0` or omits `per_page` entirely
- No test requests `?per_page=-1`
- No test requests `?per_page=100000` to verify the cap is enforced

**Why It's Harmful**: Without boundary tests, a client can request an arbitrarily large `per_page` (e.g., 100,000), causing memory exhaustion, slow responses, and potential denial of service. Negative `per_page` values may cause unexpected behavior or crashes.

**Real-World Consequence**: A malicious client sends `?per_page=1000000`; the API loads one million records into memory; the server runs out of memory and crashes.

**Preferred Alternative**: Test default `per_page`, max `per_page` (capped), and negative/invalid `per_page` (uses default or rejected).

**Refactoring Strategy**:
1. Add a test for default `per_page`: omit the parameter, assert the expected default count
2. Add a test for max `per_page`: request an excessive value, assert it's capped
3. Add a test for negative `per_page`: assert it uses the default or returns an error

**Detection Checklist**:
- [ ] Default `per_page` is tested
- [ ] Max `per_page` cap is tested (excessive value returns capped count)
- [ ] Negative `per_page` is handled gracefully

**Related Rules**: Test Per_Page Boundary
**Related Skills**: Assert Paginated Response Structure
**Related Decision Trees**: Tree 2 — Boundary Page Testing

---

## Anti-Pattern 5: No Empty Collection Pagination Test

**Category**: Testing completeness

**Description**: Never testing that a collection endpoint with zero records returns a properly structured empty paginated response.

**Warning Signs**:
- No test creates zero records and requests the collection endpoint
- Empty collection tests are absent from the test suite
- The team assumes the empty case "just works"

**Why It's Harmful**: Empty collections often trigger edge-case code paths: controllers may return 404 instead of 200, skip adding pagination meta, or return `data: null` instead of `data: []`. Clients expect `data: []` and may crash on null.

**Real-World Consequence**: The first user to visit an empty list page sees a 404 error instead of a friendly "no results yet" message. The entire feature appears broken on initial launch.

**Preferred Alternative**: Always include a test that creates zero records, requests the collection, and asserts 200 with `data: []`, `meta.total: 0`, `meta.last_page: 1`, and `links.next: null`.

**Refactoring Strategy**:
1. Add a test with zero records in the database
2. Assert `assertOk()`, `expect($response->json('data'))->toBe([])`, and full meta/links structure

**Detection Checklist**:
- [ ] Every collection endpoint has an empty-collection test
- [ ] Empty collection returns 200 with `data: []`
- [ ] Pagination meta (`total: 0`, `last_page: 1`) is present in empty response

**Related Rules**: Test Empty Collection
**Related Skills**: Assert Paginated Response Structure

---

## Anti-Pattern 6: Confusing Cursor Pagination With Length-Aware Pagination

**Category**: Testing correctness

**Description**: Using `LengthAwarePaginator` test patterns (asserting `last_page`, `total`) on cursor-paginated endpoints, or vice versa.

**Warning Signs**:
- Cursor pagination tests assert `meta.last_page` or `meta.total`
- Length-aware pagination tests assert `meta.next_cursor` or `meta.has_more`
- The same test helper is used for both paginator types

**Why It's Harmful**: Cursor pagination does not have `last_page` or `total` — asserting these keys fails on a correctly implemented cursor endpoint. Worse, if the endpoint incorrectly returns a length-aware paginator when cursor was expected, the tests pass (because the keys exist) but the client breaks parsing the wrong structure.

**Real-World Consequence**: An endpoint supposed to return cursor pagination returns length-aware pagination; the mobile app expects `meta.next_cursor` but finds `meta.last_page`; pagination is completely broken. Tests pass because they assert length-aware keys.

**Preferred Alternative**: Write separate tests for cursor pagination (asserting `next_cursor`, `prev_cursor`, `has_more`) and length-aware pagination (asserting `current_page`, `last_page`, `total`).

**Refactoring Strategy**:
1. Identify which paginator type each endpoint uses
2. Create separate test helpers for cursor vs length-aware pagination shape assertions
3. Ensure cursor tests assert cursor-specific keys and do NOT assert `last_page` or `total`

**Detection Checklist**:
- [ ] Cursor pagination tests assert cursor-specific keys (`next_cursor`, `has_more`)
- [ ] Cursor pagination tests do NOT assert `last_page` or `total`
- [ ] Length-aware pagination tests do NOT assert cursor-specific keys

**Related Rules**: Test Cursor Pagination Separately
**Related Skills**: Assert Paginated Response Structure
**Related Decision Trees**: Tree 1 — Paginator Type Selection for Testing
