# Happy Path Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Happy Path Testing
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Happy path tests validate that every API endpoint succeeds when given valid input under normal conditions. For each CRUD operation (index, store, show, update, destroy), the happy path asserts the correct HTTP status (200, 201, 204), the presence of expected data, and the correct response shape. Laravel's `assertStatus`, `assertJson`, `assertJsonStructure`, `assertExactJson`, and `assertJsonCount` are the primary tools. A complete happy path suite is the minimum viable test coverage for any API.

---

## Core Concepts
Happy path tests prove the endpoint works. Each endpoint gets at least one test that sends valid data and asserts success. For `store` (POST): assert `201 Created` and that the resource is returned with an `id`. For `show` (GET): assert `200` and matching structure. For `update` (PUT/PATCH): assert `200` with updated fields. For `destroy` (DELETE): assert `204 No Content` and verify database absence. For `index` (GET collection): assert `200` with a paginated structure. Use `assertJsonFragment` to verify a subset of fields, `assertExactJson` for exact match, and `assertJsonStructure` to validate keys without caring about values.

---

## Mental Models
Happy path testing is **walking the green line** — every endpoint gets one test that uses ideal inputs and expects ideal outputs. If the green line breaks, the API is fundamentally broken regardless of edge cases. Treat happy path tests as the **canary in the coal mine**: run them first in CI.

---

## Internal Mechanics
`TestResponse::assertStatus($code)` compares `$response->status()` to `$code`. `assertJson(array $data)` decodes the response body and asserts it contains the given subset. `assertExactJson(array $data)` requires exact match including key order. `assertJsonStructure(array $structure)` matches only key presence, not values. For `assertJsonCount($count, $key)`, it uses `assertCount` on the decoded array at the given key. Laravel's `TestResponse` normalizes JSON encoding differences (e.g., empty arrays vs objects) before comparison, so `assertExactJson` is tolerant of serialization quirks.

---

## Patterns
- **One test method per endpoint per outcome**: `test_guest_can_list_posts`, `test_user_can_create_post`.
- **Assert structure + status + content in that order**: Status first (fastest), then structure, then content.
- **Use `assertJsonFragment` for partial updates**: Avoid rewriting the full expected payload.
- **Chain assertions**: `$this->get('/api/posts')->assertOk()->assertJsonStructure(['data' => ['*' => ['id', 'title']]]);`
- **Verify database state on mutating endpoints**: After store, assert database has the record; after destroy, assert it's gone.

---

## Architectural Decisions
Happy path tests intentionally avoid mocking — they exercise the real database, real middleware, and real controllers. This acceptance-level coverage catches integration bugs that unit tests miss. The tradeoff is speed: happy path tests are slower than isolated unit tests but provide exponentially more confidence. Teams that skip happy path testing end up debugging production issues that could have been caught by a simple 201 assertion.

---

## Tradeoffs
| Tradeoff | Happy Path Test | Unit Test |
|---|---|---|
| Confidence | High (real stack) | Low (isolated) |
| Speed per test | ~100-500ms | <10ms |
| Debugging effort | Low (catch integration issues) | High (mock mismatches) |
| Maintenance | Stable (contract-based) | Fragile (mock coupling) |

---

## Performance Considerations
Happy path tests are the slowest part of the test suite because they boot the kernel and hit the database. Mitigate by using SQLite in-memory, transactional database resets, and PestPHP parallel test execution. Prioritize happy path tests in CI's early feedback pipeline — run them before slower browser or E2E suites.

---

## Production Considerations
Every public API endpoint must have at least one happy path test. Enforce this with architecture tests (see architecture-tests-for-apis) that scan for missing coverage. Happy path tests serve as living documentation — a new developer should understand the API contract by reading them. Include response shape assertions in happy path tests to prevent accidental contract breaks.

---

## Common Mistakes
- Testing only `assertOk()` without checking response content.
- Forgetting to assert the database changed after mutating endpoints.
- Using `assertExactJson` when `assertJsonFragment` suffices (brittle tests).
- Not testing the `index` pagination structure on collection endpoints.

---

## Failure Modes
- **Missing data in response**: Endpoint returns 200 but with wrong data — `assertJsonStructure` catches missing keys.
- **Wrong status code**: Endpoint returns 201 instead of 200, or 200 instead of 204 — `assertStatus` or `assertCreated`/`assertNoContent` catches.
- **Database not persisted**: Store returns 201 but record is missing — assert database has the record after the test.

---

## Ecosystem Usage
All major Laravel API packages (Laravel API Resource, Spatie Query Builder, Laravel Sanctum) use happy path tests as their primary validation mechanism. Taylor Otwell's shift to PestPHP in Laravel 11 emphasizes the pattern: `it('creates a post', fn() => ...)->assertStatus(201)`.

---

## Related Knowledge Units
### Prerequisites
- feature-test-structure (test class organization)
- Laravel HTTP Testing (request methods, TestResponse)

### Related Topics
- response-shape-testing (deep structure assertions)
- response-status-code-testing (status code enumeration)
- pagination-response-testing (paginated collection assertions)

### Advanced Follow-up Topics
- Property-based testing for happy paths (generating valid inputs)
- Snapshot testing for response contracts
- Mutation testing to validate happy path coverage

---

## Research Notes
### Source Analysis
`Illuminate\Testing\TestResponse` all assertion methods: `assertOk()`, `assertCreated()`, `assertNoContent()`, `assertJson($value)`, `assertExactJson($value)`, `assertJsonFragment($value)`, `assertJsonStructure($structure)`, `assertJsonCount($count, $key)`.
### Key Insight
Happy path tests are the most cost-effective tests in an API suite — they catch the highest-value bugs with the lowest maintenance burden. Skipping them is premature optimization.
### Version-Specific Notes
`assertJsonCount` was added in Laravel 5.5. `assertJsonFragment` accepts nested arrays. `assertExactJson` ignores key ordering starting Laravel 8.x. PestPHP's `assertOk()` is a direct wrapper over the same `TestResponse` method.
