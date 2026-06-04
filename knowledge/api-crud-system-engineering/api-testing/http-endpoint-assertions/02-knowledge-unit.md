# HTTP Endpoint Assertions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** HTTP Endpoint Assertions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
HTTP Endpoint Assertions provide the vocabulary for verifying API behavior in tests — status codes, response structure, headers, and JSON content. Mastery of these assertions enables engineers to write precise, expressive tests that catch regressions early and serve as living documentation.

---

## Core Concepts
- **Status Code Assertions**: `assertStatus(200)`, `assertOk()`, `assertCreated()`, `assertNoContent()` — verifying HTTP response codes
- **JSON Structure Assertions**: `assertJson($exact)`, `assertJsonFragment()`, `assertJsonStructure()` — validating response shapes
- **Header Assertions**: `assertHeader('X-RateLimit', $value)`, `assertHeaderMissing()` — checking response metadata
- **Exact Match vs Fragment**: Exact match validates the entire JSON payload; fragment checks for a subset
- **Chained Assertions**: Pest's `expect($response)->toBeOk()` fluent API for readable test chains

---

## Mental Models
1. **Contract Verification Model**: Each assertion validates a clause in the API contract. The test suite is the executable contract.
2. **Layer-Cake Model**: Assert from outside-in — first the status code (outer layer), then headers, then JSON structure, then specific values.

---

## Internal Mechanics
When `get('/api/users')` is called in a test, Laravel instantiates the application kernel, processes the request through middleware and the router, dispatches to the controller, and returns a `TestResponse` object. Each assertion method on `TestResponse` inspects the underlying `Response` object's status code, headers, or decoded JSON content. `assertJson` uses `assertArraySubset` for fragment matching and `assertEquals` for exact matching.

---

## Patterns

### Pattern 1: Status-First Assertion Chain
**Purpose**: Always assert status code before inspecting body content
**Benefits**: Clear failure messages; early exit on wrong status
**Tradeoffs**: Adds an extra assertion line

### Pattern 2: JSON Structure Snapshot
**Purpose**: Validate the complete response shape using `assertJson` with a representative payload
**Benefits**: Catches unexpected structural changes
**Tradeoffs**: Fragile for endpoints with dynamic data; use `assertJsonStructure` instead

---

## Architectural Decisions
### When To Use
- Every API test that makes an HTTP request
- Contract testing for external consumers
- Regression prevention in CI pipelines

### When To Avoid
- Unit tests for business logic (use direct method assertions instead)
- Snapshot testing of large, dynamic responses (prefer structure matching)

### Alternatives
- Pest's `expect($response)->toMatchJson($expected)` for JSON:API responses
- Custom assertion macros for repeated domain-specific checks

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catch regressions before deployment | Tests require maintenance as API evolves | Balance assertion precision with flexibility |
| Executable API documentation | Fragile exact-match tests break on unrelated changes | Prefer fragment/structure assertions over exact |
| Fast feedback in CI | Over-assertion makes tests brittle | Assert only what you care about |

---

## Performance Considerations
- JSON assertions that decode large responses use memory proportional to response size
- Avoid asserting entire response bodies for paginated endpoints; assert structure and one item
- Use `assertJsonStructure` over `assertJson` for large collections to minimize comparison overhead

---

## Production Considerations
- Separate API contract tests from functional tests to allow different assertion granularity
- Use Pest's `arch` test files for structural assertions about controller responses
- Log assertion failures with enough context to debug without reproducing

---

## Common Mistakes
**Asserting exact JSON with timestamps**: Dynamic values cause spurious failures. Use `assertJsonStructure` or `assertJsonFragment` and validate timestamps separately.
**Skipping status code assertions**: A `200` response might return an error payload (misrouted request). Always assert status before body.
**Over-assertion in integration tests**: Testing every field in every test duplicates effort. Use one comprehensive test per endpoint and lighter assertion in scenario tests.

---

## Failure Modes
**False positive on empty response**: `assertJson([])` passes on an empty collection. Use `assertJsonCount(0)` for explicit empty checks.
**False positive on 500 errors in debug mode**: Laravel's debug mode returns 200 with error details. Always test with `APP_DEBUG=false` in API tests.

---

## Ecosystem Usage
Laravel's `TestCase` provides `get`, `post`, `put`, `delete`, and `json` helper methods that return `TestResponse`. Pest's `expect` API wraps these for more expressive assertions. Packages like `laravel-test-assertions` add domain-specific macros.

---

## Related Knowledge Units
### Prerequisites
- Pest test structure and test file organization
- Basic PHPUnit assertions

### Related Topics
- Validation error test patterns
- Authentication test patterns
- Response shape testing

### Advanced Follow-up Topics
- Custom test response macros
- Contract testing with OpenAPI specs
- Property-based testing for edge cases

---

## Research Notes
- Laravel's `TestResponse::assertJson` uses `assertArraySubset` which allows partial matching — this is the recommended default over exact match
- Pest 4's fluent `expect()` API offers better IDE autocompletion than traditional assertion methods
