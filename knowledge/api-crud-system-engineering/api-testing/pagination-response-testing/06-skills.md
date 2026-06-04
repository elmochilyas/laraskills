# Skill: Assert Paginated Response Structure
## Purpose
Verify the full paginated response envelope — meta (current_page, last_page, per_page, total), links (first, last, prev, next), and data shape.
## When To Use
Every paginated endpoint test; after implementing a new pagination strategy; contract tests for index/list endpoints.
## When NOT To Use
Non-paginated endpoints; shape-only tests that don't need pagination envelope; cursor-pagination-specific envelope (use Cursor Pagination Metadata Testing).
## Prerequisites
Response Shape Testing; Pagination Strategies; Pest or PHPUnit.
## Inputs
Paginated endpoint URL; expected pagination structure keys; page count expectations.
## Workflow
1. Call paginated endpoint with known per-page
2. Assert `data` contains correct number of items (`assertCount`)
3. Assert pagination meta structure (`assertJsonStructure` with `meta`)
4. Assert pagination links (`first`, `last`, `prev`, `next`)
5. Assert edge pages (first page has no `prev`, last page has no `next`)
6. Assert single-page result has `null` for both `prev` and `next`
7. Assert zero-result sets return empty `data` and correct totals
## Validation Checklist
- [ ] `data` count matches requested `per_page` (except final page)
- [ ] `meta` contains `current_page`, `last_page`, `per_page`, `total`
- [ ] `links` contains `first`, `last`, `prev`, `next`
- [ ] First page asserts `prev` is `null`
- [ ] Last page asserts `next` is `null`
- [ ] Single-page result asserts `prev` and `next` are both `null`
- [ ] Zero results assert `total == 0` and `data` is `[]`
- [ ] Missing page (beyond `last_page`) returns 404
## Common Failures
- Testing only the first page, missing boundary behavior
- Not testing zero-result sets (empty collection)
- Forgetting `null` link assertions for edge pages
- Not confirming pagination envelope is absent on non-paginated endpoints
## Decision Points
- Use `assertJsonStructure` with partial pagination envelope vs full `assertExactJson`
- Extract pagination assertion helpers for reuse across test suites
## Performance/Security Considerations
Paginated endpoints should have configurable `per_page` with a hard upper limit. Test that excessive `per_page` values are rejected.
## Related Rules/Skills
Response Shape Testing; Offset Pagination Tests; Cursor Pagination Tests; Pagination Metadata Design.
## Success Criteria
All pagination scenarios (first/last/middle page, single page, zero results, missing page) are covered and assert the full envelope.
