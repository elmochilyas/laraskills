# ECC Standardized Knowledge — Feature Test Structure

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Feature Test Structure |
| Difficulty | Foundation |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Feature tests are the backbone of API testing in Laravel — they simulate HTTP requests and assert against responses end-to-end. Each feature test class maps to one controller or resource endpoint group, following Arrange-Act-Assert (AAA) and mirroring the controller's responsibility boundary. Tests live in `tests/Feature/`, extend `Tests\TestCase`, and use `RefreshDatabase` for clean state. PestPHP `describe()` or PHPUnit `@group` annotations organize suites.

## Core Concepts

- **One class per controller**: `PostsFeatureTest` tests all `PostController` endpoints.
- **AAA layout**: Clear blank-line separation between arrange, act, and assert sections.
- **HTTP methods**: `get`, `post`, `put`, `patch`, `delete` return `TestResponse` for fluent assertions.
- **RefreshDatabase**: Wraps each test in a transaction (or fresh migration) for clean state.
- **withoutExceptionHandling**: Rethrows exceptions instead of converting to HTTP error responses (debugging).
- **Helper methods**: Extract common setup (auth headers, resource creation) to private methods or traits.

## When To Use

- Every API endpoint test — feature tests are the primary test type for HTTP APIs.
- Testing the full request-to-response pipeline (routing, middleware, controller, response).
- Regression testing for production-like scenarios.

## When NOT To Use

- Testing business logic in isolation (use action/service unit tests).
- Testing validation rules in isolation (use form request unit tests).
- Testing DTO construction/serialization (use DTO unit tests).

## Best Practices

- **One behavior per test method**: Don't combine multiple scenarios in one test.
- **Reset state between tests**: Use `RefreshDatabase` or manual cleanup in `tearDown()`.
- **Separate happy-path from failure**: Group by outcome; keep success and error tests in clearly named methods.
- **Use datasets for multiple inputs**: PestPHP `with()` or PHPUnit `@dataProvider` for repeating same endpoint with different inputs.
- **Directory mirrors API surface**: `tests/Feature/Api/V1/Posts/` for post-related endpoints.

## Architecture Guidelines

- Feature tests are kernel-bootstrapped integration tests — they couple to the framework intentionally.
- Run feature tests with `php artisan test --parallel` for speed.
- Exclude slow tests (external HTTP calls) into a separate PHPUnit suite with `@group external`.
- Use `.env.testing` for environment-specific configuration.

## Performance Considerations

- Each test bootstraps the framework kernel. Use `RefreshDatabase` with SQLite in-memory or transactional rollbacks.
- PestPHP `uses()` with `RefreshDatabase` per file (not per class) reduces overhead.
- Grouping related assertions in a single test reduces kernel boots.

## Security Considerations

- Feature tests can access the application container — don't expose sensitive credentials in test setup.
- Use `withoutMiddleware()` carefully — only for non-auth tests.
- Reset authenticated user state between tests to prevent session leakage.

## Common Mistakes

- Multiple scenarios in one test method (violates single-behavior-per-test).
- Not resetting state between tests — shared properties persist across methods.
- Using `withoutExceptionHandling()` in assertions meant to pass.
- Calling refresh routes without creating the resource first.

## Anti-Patterns

- **Over-reliance on `withoutMiddleware()`**: Skips authentication, defeating the purpose of integration testing.
- **No database assertions on mutating endpoints**: Store returns 201 but record may not exist.
- **Brittle selectors**: Using exact JSON matches when structure assertions suffice.

## Examples

- Test class: `class PostsFeatureTest extends TestCase { use RefreshDatabase; /** @test */ function guests_can_list_posts() { $posts = Post::factory()->count(3)->create(); $response = $this->get('/api/posts'); $response->assertOk()->assertJsonCount(3, 'data'); } }`.

## Related Topics

- **Prerequisites**: PHPUnit/PestPHP Fundamentals, Laravel HTTP Kernel & Routing, Database Migrations & Factories
- **Closely Related**: Happy Path Testing, Validation Failure Testing, Form Request Unit Testing
- **Advanced**: Parallel testing with Paratest, Custom TestResponse macros, Database-less feature testing with mocking

## AI Agent Notes

When structuring feature tests: one class per controller, AAA layout, use RefreshDatabase, group assertions by behavior, separate happy-path from failure tests, use helper methods for common setup, mirror API surface in test directory structure.

## Verification

Sources: `Illuminate\Foundation\Testing\TestCase`, `Illuminate\Testing\TestResponse`, domain-analysis.md.
