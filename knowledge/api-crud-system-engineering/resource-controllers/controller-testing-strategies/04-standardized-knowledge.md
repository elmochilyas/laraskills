| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Testing Strategies |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | PHPUnit Basics, Resource Controller Pattern |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Testing resource controllers requires a strategy covering the full HTTP lifecycle: request construction, validation, authorization, controller execution, and response inspection. Laravel's HTTP test helpers (`getJson`, `postJson`, `putJson`, `deleteJson`, `patchJson`) provide a fluent interface for asserting status codes, JSON structure, database state, and authorization behavior. A comprehensive strategy includes happy path tests, validation failure tests, authorization tests (unauthenticated and unauthorized), edge case tests (404, empty collections), and database assertions for mutating actions.

## Core Concepts

- **HTTP Test Methods**: `$this->getJson()`, `$this->postJson()`, `$this->putJson()`, `$this->deleteJson()`, `$this->patchJson()` simulate full HTTP requests through the kernel.
- **Status Code Assertions**: `assertOk()` (200), `assertCreated()` (201), `assertNoContent()` (204), `assertNotFound()` (404), `assertUnauthorized()` (401), `assertForbidden()` (403), `assertStatus()`.
- **JSON Assertions**: `assertJson()` (exact match), `assertJsonStructure()` (shape validation), `assertJsonFragment()` (subset), `assertJsonCount()` (array size), `assertExactJson()` (deep equality).
- **Database Assertions**: `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertSoftDeleted()`, `assertModelExists()`.
- **Validation Assertions**: `assertJsonValidationErrors()`, `assertJsonMissingValidationErrors()`.
- **Database Transactions**: `RefreshDatabase` (migrate + truncate) or `DatabaseTransactions` (rollback) traits for test isolation.

## When To Use

- Every resource controller action (minimum 5-7 HTTP tests per controller).
- New API endpoints before they are deployed to production.
- Authorization-sensitive actions (unauthenticated, unauthorized, different roles).
- Validation-heavy endpoints (missing fields, invalid formats, unique constraints).
- Refactoring or restructuring controller logic (regression safety net).

## When NOT To Use

- Unit testing service/action classes — use plain PHPUnit tests without HTTP stack.
- Testing the framework's routing or binding mechanics — assume Laravel works correctly.
- Browser/UI testing — use Laravel Dusk for JavaScript-rendered interactions.
- External API integration testing — use dedicated integration test suites.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Write HTTP tests (not unit tests) for controllers | HTTP tests exercise the full stack: routing, middleware, validation, controller, response — providing highest confidence |
| Always test failure paths (auth, validation, not-found) per action | Happy-path-only testing misses error responses that crash clients |
| Use `assertJsonStructure()` over `assertJson()` for shape validation | `assertJson()` with hardcoded IDs makes brittle tests that break on unrelated data changes |
| Add `assertDatabaseHas()`/`assertDatabaseMissing()` for mutating actions | A controller could return 201 but not actually persist data — response assertion alone is insufficient |
| Use factories with `raw()` for request data | Avoids hardcoding test values and keeps test data maintainable |
| Keep tests independent — each test creates its own data | Shared state causes intermittent failures depending on execution order |

## Architecture Guidelines

- One test class per resource controller: `PhotoControllerTest` for `PhotoController`.
- Group tests by action: `can_list_photos`, `can_create_a_photo`, `can_show_a_photo`, `can_update_a_photo`, `can_delete_a_photo`.
- Add authorization tests: `guests_cannot_create_photos`, `non_owners_cannot_update_photos`.
- Add validation tests: `store_validates_required_fields`, `store_validates_unique_constraint`.
- Use `RefreshDatabase` for test isolation when schema is unchanged; `DatabaseTransactions` when it is.
- Mark slow controller test groups with `@group controller` for selective execution.

## Performance Considerations

- HTTP tests are 10-50x slower than unit tests due to full-stack execution and database round-trips.
- Use in-memory SQLite (`DB_CONNECTION=sqlite DB_DATABASE=:memory:`) for faster test runs.
- Use `DatabaseTransactions` over `RefreshDatabase` when tests don't modify schema (avoids re-migrating).
- Use parallel testing (`php artisan test --parallel`) in CI for significant speedups.
- Group slow tests and run them separately from fast unit tests in CI.

## Security Considerations

- Never test with production credentials or real API keys — use environment-specific `.env.testing`.
- Ensure authorization tests cover the correct role/permission boundaries.
- Test that soft-deleted resources return 404 (not accessible via show/update/destroy).
- Test that users cannot access resources belonging to other users (cross-tenant isolation).
- Verify that validation errors don't leak sensitive schema information.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Only testing the happy path | Happy path is easier to write | Error handling untested; validation/auth bugs unnoticed | Write at least one failure test per action |
| Using `assertJson` for structural validation | `assertJson` is the first method developers find | Brittle tests break on unrelated data changes | Use `assertJsonStructure` for shape, `assertJsonFragment` for specific values |
| Not testing database state | Focusing only on HTTP response | Controller could return 201 but not persist | Always add database assertions for mutating actions |
| Test pollution from shared state | Not using transaction traits | Intermittent failures depending on test order | Use `RefreshDatabase` or `DatabaseTransactions` always |
| Over-mocking controller dependencies | Trying to isolate controller from framework | Mocks hide integration bugs that surface in production | Prefer HTTP tests over unit tests for controllers |

## Anti-Patterns

- **Testing every validation rule individually in HTTP tests**: Test happy path + common failure paths only; full rule coverage belongs in form request unit tests.
- **Shared fixtures across tests**: One test modifies shared data, breaking another test's assertions.
- **HTTP tests with hardcoded IDs**: `assertJson(['id' => 1])` fails when test order changes or factory sequences reset.
- **Mocking the entire controller**: If you mock the controller, you're testing the mock framework, not the controller.
- **No authorization tests**: Skipping "what if unauthenticated" scenarios leaves auth gaps undetected.

## Examples

- **List test**: `Photo::factory()->count(3)->create(); $this->getJson('/api/photos')->assertOk()->assertJsonCount(3, 'data');`
- **Create test**: `$data = Photo::factory()->raw(); $this->postJson('/api/photos', $data)->assertCreated()->assertJsonStructure(['data' => ['id', 'title']]); $this->assertDatabaseHas('photos', ['title' => $data['title']]);`
- **Update test**: `$photo = Photo::factory()->create(); $this->putJson("/api/photos/{$photo->id}", ['title' => 'Updated'])->assertOk(); $this->assertDatabaseHas('photos', ['title' => 'Updated']);`
- **Delete test**: `$photo = Photo::factory()->create(); $this->deleteJson("/api/photos/{$photo->id}")->assertNoContent(); $this->assertDatabaseMissing('photos', ['id' => $photo->id]);`
- **Auth test**: `$this->postJson('/api/photos', Photo::factory()->raw())->assertUnauthorized();`
- **Validation test**: `$this->postJson('/api/photos', [])->assertStatus(422)->assertJsonValidationErrors(['title']);`

## Related Topics

- Controller Form Request Integration — Testing form request validation independently
- Controller Response Selection — Asserting correct response types and shapes
- Thin Controller Enforcement — Architecture tests ensuring controller structure
- API Integration Testing — Broader testing beyond individual controllers

## AI Agent Notes

- Generate test classes with `RefreshDatabase` trait and factory-based data setup.
- Write one HTTP test method per controller action including happy path and failure path.
- Use `assertJsonStructure()` for response shape verification; use `assertDatabaseHas()` for mutation assertions.
- Include authorization tests for every protected action.
- Use in-memory SQLite and parallel testing for performance in CI.

## Verification

- [ ] Every controller action has at least one happy-path HTTP test
- [ ] Every protected action has authorization failure tests (unauthenticated + unauthorized)
- [ ] Mutating actions include `assertDatabaseHas()` or `assertDatabaseMissing()` assertions
- [ ] `assertJsonStructure()` used for shape validation (not `assertJson` with hardcoded IDs)
- [ ] `RefreshDatabase` or `DatabaseTransactions` trait applied for test isolation
- [ ] Tests are independent — each creates its own data, no shared state
