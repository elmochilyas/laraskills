# ECC Standardized Knowledge — Happy Path Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Happy Path Testing |
| Difficulty | Foundation |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Happy path tests validate that every API endpoint succeeds when given valid input under normal conditions. For each CRUD operation (index, store, show, update, destroy), the happy path asserts the correct HTTP status (200, 201, 204), presence of expected data, correct response shape, and database state changes. A complete happy path suite is the minimum viable test coverage for any API.

## Core Concepts

- **Per-endpoint success tests**: Each endpoint gets at least one test with valid input asserting success.
- **CRUD status codes**: POST -> 201 Created, GET -> 200 OK, PUT/PATCH -> 200 OK, DELETE -> 204 No Content.
- **Key assertions**: `assertStatus`, `assertJson`, `assertJsonStructure`, `assertExactJson`, `assertJsonFragment`, `assertJsonCount`.
- **Response shape verification**: Validate JSON structure (keys, nesting) on every happy path test.
- **Database mutation assertions**: After store/update/destroy, verify database state changed accordingly.
- **Chain assertions**: `$this->get('/api/posts')->assertOk()->assertJsonStructure([...])`.

## When To Use

- Every public API endpoint
- New endpoints added to the API
- CI pipeline early feedback stage
- Living documentation of API contract

## When NOT To Use

- Error/failure scenarios (covered by validation, auth, not-found testing KUs)
- Performance or load testing
- Edge cases requiring invalid input

## Best Practices

- **One test method per endpoint per outcome**: `test_guest_can_list_posts`, `test_user_can_create_post`.
- **Assert status + structure + content in that order**: Status first (fastest), then structure, then content.
- **Use `assertJsonFragment` for partial updates**: Avoid rewriting full expected payload.
- **Verify database state on mutating endpoints**: After store, assert database has the record; after destroy, assert it's gone.
- **Test index pagination structure on collection endpoints**.

## Architecture Guidelines

- Happy path tests use real database, real middleware, real controllers — no mocking.
- Every public API endpoint must have at least one happy path test. Enforce via architecture tests.
- Happy path tests serve as living documentation — a new developer should understand the API contract by reading them.
- Run happy path tests first in CI (early feedback).

## Performance Considerations

- Happy path tests boot the kernel and hit the database — the slowest part of the test suite.
- Mitigate: SQLite in-memory, transactional database resets, PestPHP parallel execution.
- Prioritize happy path tests in CI's early feedback pipeline before slower browser/E2E suites.

## Security Considerations

- Happy path tests should use authorized users to test realistic scenarios.
- Do not include real credentials or secrets in test data.

## Common Mistakes

- Testing only `assertOk()` without checking response content.
- Forgetting to assert database changed after mutating endpoints.
- Using `assertExactJson` when `assertJsonFragment` suffices (brittle tests).
- Not testing the index pagination structure on collection endpoints.

## Anti-Patterns

- **No response shape assertions**: Endpoint returns 200 but wrong keys — caught only by unhappy consumers.
- **Skipping happy path for "simple" endpoints**: Even simple endpoints need confirmation they work.

## Examples

- Store: `$response = $this->post('/api/posts', $data); $response->assertCreated()->assertJsonStructure(['id', 'title']); $this->assertDatabaseHas('posts', ['title' => $data['title']]);`.
- Destroy: `$response = $this->delete("/api/posts/{$post->id}"); $response->assertNoContent(); $this->assertDatabaseMissing('posts', ['id' => $post->id]);`.

## Related Topics

- **Prerequisites**: Feature Test Structure, Laravel HTTP Testing
- **Closely Related**: Response Shape Testing, Response Status Code Testing, Pagination Response Testing
- **Advanced**: Property-based testing for happy paths, Snapshot testing for response contracts, Mutation testing to validate happy path coverage

## AI Agent Notes

When writing happy path tests: one test per endpoint per outcome, assert status + structure + content, verify database state on mutations, use assertJsonFragment for partial checks, test index pagination structure, make tests serve as living documentation.

## Verification

Sources: `Illuminate\Testing\TestResponse` assertion methods, PestPHP assertion wrappers, domain-analysis.md.
