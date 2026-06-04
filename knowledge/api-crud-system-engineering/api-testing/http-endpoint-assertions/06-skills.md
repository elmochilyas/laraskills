# Skill: Write HTTP Endpoint Assertions

## Purpose
Write comprehensive HTTP endpoint tests covering status codes, response structure, header validation, error envelopes, and boundary conditions using Laravel's test assertions.

## When To Use
- Every API endpoint test
- Integration test suite for HTTP layer
- Before deployment for regression prevention

## When NOT To Use
- Unit testing models or services — plain PHPUnit assertions suffice
- Simple validation tests already covered by Form Request tests

## Prerequisites
- Laravel TestResponse API familiarity
- HTTP status code knowledge

## Inputs
- Test scenarios per endpoint (happy path, errors, edge cases)

## Workflow
1. Start with happy path — assert status code, JSON structure, and required headers
2. Assert response structure matches envelope design: `$response->assertJsonStructure(...)`
3. Validate specific response data: `$response->assertJsonFragment(['name' => 'Alice'])`
4. Assert exact status codes — never general 2xx/4xx; use specific 201, 422, 401, 403
5. Check error envelopes: `$response->assertJson(['errors' => [...]])`
6. Verify response headers: `$response->assertHeader('Content-Type', 'application/json')`
7. Include boundary conditions — empty collections, pagination edges, sort orders
8. Test content negotiation: `$response->assertHeaderMissing('X-Deprecated')`
9. Use `assertJsonCount()` for collection sizes and pagination metadata
10. Test concurrent scenarios with `Http::pool()` or `Bus::fake()` where applicable

## Validation Checklist
- [ ] Happy path tests include status, structure, and data assertions
- [ ] Error path tests verify error envelope structure
- [ ] Status codes are specific (201, 422, etc.)
- [ ] Response headers verified where contract-relevant
- [ ] Boundary conditions covered (empty, max, edge values)
- [ ] JSON structure assertions cover envelope and data
- [ ] Content negotiation assertions for versioning/deprecation
- [ ] Pagination metadata assertions for list endpoints

## Common Failures
- Testing only `assertJson()` without structure validation — shape changes silently break consumers
- Asserting only 200 — 404/422/500 untested
- Missing boundary cases — paginated endpoint only tested with 1 element
- Over-reliance on `assertExactJson()` — fragile to response changes
- No header assertions — versioning, deprecation, CORS headers untested
- Testing response structure only in happy path — error structure often different

## Decision Points
- Assert exact JSON vs structure vs fragment — structure for contract, fragment for data, exact only for stable responses
- Test every error response vs representative sample — representative for 4xx/5xx, every for business logic
- Schema validation vs manual assertions — schema for large responses, manual for focused tests

## Performance Considerations
- Focus assertions on contract-critical fields rather than full response
- `assertJsonStructure()` with nested trees can be slow — test structure depth carefully
- Paginated assertions add per-test overhead — test pagination metadata but not all pages

## Security Considerations
- Never assert sensitive data (tokens, secrets) in response body
- Test that security headers (`X-Frame-Options`, `Strict-Transport-Security`) are present
- Test that error responses don't leak stack traces or internal paths
- Verify rate limit headers in authenticated endpoint tests

## Related Rules
- Test Happy Path First, Then Error Conditions
- Assert Exact HTTP Status Codes
- Assert JSON Structure and Specific Data
- Verify Error Envelope Structure
- Test Boundary Conditions
- Assert Response Headers Where Contractual

## Related Skills
- Feature Test Structure — for test file organization
- Authentication/Authorization Test Patterns — for auth-specific assertions
- Pagination Testing Patterns — for pagination-specific assertions
- Error Response Testing Patterns — for error-specific assertions

## Success Criteria
- Each endpoint has happy path test asserting status, structure, and data
- Each endpoint has error tests for expected 4xx responses
- Response structure and headers match documented API contract
- Boundary conditions prevent regressions at data extremes
- Test failures clearly indicate which endpoint and assertion failed
