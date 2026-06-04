# Skill: Test JSON API Responses

## Purpose
Write comprehensive JSON API tests that verify response structure, field types, specific values, error formats, and edge cases using `getJson()`/`postJson()` and `AssertableJson`.

## When To Use
- Testing every API endpoint (JSON responses)
- Validating API contracts (structure, types, values)
- Testing paginated response metadata
- Testing error response consistency

## When NOT To Use
- Testing HTML/Blade responses (use `get()` and `assertSee()`)
- Testing through a browser (use E2E tests)
- Testing non-JSON responses (file downloads, redirects)

## Prerequisites
- API routes using `Route::apiResource()` or manual JSON-returning controllers
- Understanding of `assertJsonStructure()`, `assertJsonPath()`, `AssertableJson`
- Eloquent API Resources configured (optional)

## Inputs
- API route definitions
- Expected response structures for success and error states
- Collection sizes for pagination tests

## Workflow
1. Use `getJson()`/`postJson()`/`putJson()`/`patchJson()`/`deleteJson()` for all API endpoint tests — these set proper JSON headers
2. Assert JSON structure with `assertJsonStructure()` for the minimum required shape — do not assert exhaustive field lists
3. Assert 1-3 specific values with `assertJsonPath()` to verify business logic
4. Assert field types with `AssertableJson` fluent API: `$json->whereType('data.id', 'integer')->etc()`
5. Use `assertJson()` (partial match) for most assertions — less brittle than `assertExactJson()`
6. Test collection endpoints with 0, 1, and multiple items — verify empty states return `{"data": []}`, not 404
7. Test all error response formats: 422 (validation), 401 (unauth), 403 (forbidden), 404 (not found), 500 (server error)
8. For paginated responses, assert pagination metadata structure (current_page, last_page, total, per_page, links)

## Validation Checklist
- [ ] Every API endpoint tests structure + values + types
- [ ] `getJson()`/`postJson()` used (not `get()`/`post()`)
- [ ] `assertJsonStructure()` validates minimum required shape
- [ ] Dynamic fields (IDs, timestamps) asserted by type, not hardcoded value
- [ ] Empty collections return `{"data": []}`, not 404
- [ ] All error response formats tested (422, 401, 403, 404, 500)
- [ ] Pagination metadata structure verified
- [ ] `assertJson()` (partial match) used for most tests

## Common Failures
- Using `get()` instead of `getJson()` — validation errors return HTML instead of JSON
- Hardcoding IDs in assertions — tests break when seeding order changes
- Asserting exact dates/timestamps — timezone or format differences break tests
- Not testing error response formats — inconsistent JSON error structure
- No empty collection test — returning 404 instead of empty array

## Decision Points
- `assertJson()` (partial match) for most tests vs `assertExactJson()` for idempotency/security tests
- `assertJsonPath()` for simple value checks vs `AssertableJson` fluent API for deeply nested structures
- `whereType()` for type assertions vs `where()` for value assertions

## Performance Considerations
- Large JSON responses (1000+ items) take longer to decode — paginate tests to 10-15 items
- `AssertableJson` chain overhead: each fluent call adds <0.5ms
- JSON assertions are faster than HTML assertions (no DOM parsing)

## Security Considerations
- Verify sensitive fields are excluded from JSON responses (passwords, tokens, PII)
- Test error responses don't leak stack traces or internal configuration
- Assert 404 for unauthorized resources (prevents enumeration) vs 403

## Related Rules (from 05-rules.md)
- Rule 1: Assert both structure and values for every API endpoint
- Rule 2: Prefer `assertJson()` (partial match) over `assertExactJson()`
- Rule 3: Assert types (not hardcoded values) for dynamic fields
- Rule 4: Test empty states and collection boundaries
- Rule 5: Use `AssertableJson` fluent API for deeply nested assertions
- Rule 6: Test all error response formats (422, 401, 403, 404, 500)

## Success Criteria
- Every API endpoint has tests for success + all applicable error formats
- Structure changes are caught by assertion failures
- Adding optional fields does not break existing tests
- API consumers receive consistent response shapes across all endpoints
