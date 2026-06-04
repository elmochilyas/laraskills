# Feature Test Structure

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Feature Test Structure
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Feature tests are the backbone of API testing in Laravel — they simulate HTTP requests and assert against responses end-to-end. A well-structured feature test follows Arrange-Act-Assert (AAA) and mirrors the controller's responsibility boundary. Laravel provides `TestCase` base class, `RefreshDatabase`, `withoutExceptionHandling`, and HTTP test methods (`get`, `post`, `put`, `delete`) that return `TestResponse` instances. Understanding file organization, test grouping, naming conventions, and the test suite configuration in `phpunit.xml` is essential for maintainable API test suites.

---

## Core Concepts
Each feature test class typically maps to one controller or one resource endpoint group. Tests live in `tests/Feature/` and extend `Tests\TestCase`. The `setUp()` method configures shared state (database migrations, authentication, headers). PHPUnit `#[Test]` attributes or PestPHP `it()` / `test()` functions define individual test cases. The `RefreshDatabase` trait ensures a clean database per test. HTTP methods return `Illuminate\Testing\TestResponse` which chains fluent assertions. PestPHP groups features under `describe()` blocks; PHPUnit uses `@group` annotations or directory-based `phpunit.xml` suites.

---

## Mental Models
Think of each feature test as a **curl command in code** — you construct the request (method, URI, headers, body), fire it, and inspect the response. The test file is a **contract enforcement document**: each method asserts one specific behavior of the endpoint. The directory structure mirrors the API surface: `tests/Feature/Api/V1/Posts/` for post-related endpoints.

---

## Internal Mechanics
When a feature test calls `$this->get('/api/posts')`, Laravel's `TestCase::call()` creates a `Request` instance, runs it through the HTTP kernel (including middleware pipeline — auth, throttle, bindings), and captures the `Response`. The `TestResponse` object wraps `Illuminate\Http\Response` and provides assertion methods that inspect status code, headers, JSON structure, and JSON content. `RefreshDatabase` wraps each test in a database transaction (or migrates fresh, depending on configuration). `withoutExceptionHandling()` rethrows exceptions instead of converting them to HTTP error responses, useful for debugging.

---

## Patterns
- **One class per controller**: `PostsFeatureTest` tests all `PostController` endpoints.
- **AAA layout**: Clear blank-line separation between arrange, act, and assert sections.
- **Helper methods**: Extract common setup (auth headers, resource creation) to private methods or shared traits.
- **PestPHP `beforeEach`**: Use for shared setup instead of constructor overrides.
- **Datasets**: Use PestPHP `with()` or PHPUnit `@dataProvider` for testing multiple inputs against the same endpoint.
- **Separate happy-path from failure**: Group tests by outcome; keep success tests and error tests in methods with clear naming.

---

## Architectural Decisions
Feature tests operate at the HTTP layer — they test the full stack from routing through middleware to controller response. This is a deliberate choice over HTTP-client-based integration tests because Laravel's `TestCase` avoids network overhead, preserves in-process state, and provides direct access to the application container. The tradeoff is that feature tests do not test network-level concerns (actual TCP, DNS, TLS). For those, dedicated contract or smoke tests against a deployed instance are needed.

---

## Tradeoffs
| Tradeoff | Feature Test | HTTP Client Test |
|---|---|---|
| Speed | Fast (no network) | Slower (real HTTP) |
| Stack coverage | Routing, middleware, controller | Full network + app |
| Debuggability | Direct exception access | Limited to HTTP responses |
| Realism | Simulated request | Real request/response |

---

## Performance Considerations
Feature tests are fast relative to browser tests but slow compared to unit tests. Each test bootstraps the framework kernel. `RefreshDatabase` with migrations is the main bottleneck — prefer `RefreshDatabase` with `--database=:memory:` for SQLite or transactional rollbacks. PestPHP's `uses()` with `RefreshDatabase` per file (not per class) reduces overhead. Grouping related assertions in a single test reduces kernel boots.

---

## Production Considerations
Feature tests should be the primary test type for API endpoints — target one feature test class per CRUD resource. Run feature tests in CI with `php artisan test --parallel` for speed. Exclude slow tests (those doing external HTTP calls) into a separate PHPUnit suite with `@group external`. Use `.env.testing` for environment-specific configuration.

---

## Common Mistakes
- Placing multiple scenarios in one test method (violates single-behavior-per-test).
- Not resetting state between tests — shared properties persist across methods within a class.
- Using `withoutExceptionHandling()` in assertions you want to pass (it breaks error-to-response conversion).
- Calling refresh routes (`/api/posts/1`) without creating the resource first.

---

## Failure Modes
- **Test pollution**: A test leaves state that breaks subsequent tests — use `RefreshDatabase` or manual cleanup in `tearDown()`.
- **Missing route**: Test uses wrong URI or HTTP method; Laravel returns 404 instead of the expected error.
- **Middleware interference**: Auth or throttle middleware blocks a test that expects success — explicitly pass tokens or use `withoutMiddleware()` for non-auth tests.

---

## Ecosystem Usage
Laravel's first-party packages (Cashier, Horizon, Nova) ship with feature tests. The ecosystem standard is `tests/Feature/` with PestPHP or PHPUnit. Spatie's Laravel packages follow the pattern religiously. Community packages like `laravel-test-assertions` extend `TestResponse` with domain-specific matchers.

---

## Related Knowledge Units
### Prerequisites
- PHPUnit / PestPHP Fundamentals (test case structure, assertions)
- Laravel HTTP Kernel & Routing (how requests are dispatched)
- Database Migrations & Factories (seeding test data)

### Related Topics
- happy-path-testing (positive case structure within feature tests)
- validation-failure-testing (negative case patterns)
- form-request-unit-testing (testing validation in isolation)

### Advanced Follow-up Topics
- Parallel testing with Paratest
- Custom TestResponse macros
- Database-less feature testing with mocking

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\Testing\TestCase` extends PHPUnit's `TestCase`. HTTP testing methods are defined in `Illuminate\Foundation\Testing\Concerns\MakesHttpRequests`. `TestResponse` is at `Illuminate\Testing\TestResponse`.
### Key Insight
Feature tests in Laravel are kernel-bootstrapped integration tests, not pure unit tests — they intentionally couple to the framework to test the full request-to-response pipeline without network overhead.
### Version-Specific Notes
Laravel 11 defaults to PestPHP for new projects and uses `phpunit.xml` with parallel test configuration. The `withoutExceptionHandling()` method is part of `Illuminate\Foundation\Testing\Concerns\HandlesExceptions` and was available since Laravel 5.0.
