# Layer Isolation in Tests

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Layer Isolation in Tests
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Layer isolation in tests means testing each architectural layer in isolation — controllers (via feature tests), form requests (via unit tests), actions/services (via unit tests), DTOs (via unit tests), and models (via model tests). The principle is: each test type tests exactly one layer of the onion, mocking or stubbing the layers below it. Integration tests test the whole stack but are fewer in number. Well-layered tests provide fast, targeted feedback: a failing unit test points directly to the buggy layer without ambiguity.

---

## Core Concepts
The API architecture has layers: HTTP (feature tests) → Controller (feature tests with mocked services) → Form Request (unit tests with validator) → Action/Service (unit tests with mocked repositories) → DTO (unit tests with plain PHP) → Model (model tests with database). Each layer's tests isolate that layer by substituting dependencies with mocks, fakes, or stubs. Feature tests don't mock (they test integration). Unit tests mock everything below the layer under test. The test pyramid: many unit tests (fast, isolated), fewer integration tests (slower, coupled), few E2E tests (slowest, full stack).

---

## Mental Models
Layer isolation is **wiring a circuit board** — each component (layer) is tested individually before soldering it to the board. If the resistor fails, you know immediately it's the resistor, not the capacitor downstream. Testing the whole board without component-level tests means any failure requires checking all components.

---

## Internal Mechanics
PHPUnit's mocking framework (`createMock`, `getMockBuilder`) creates test doubles. Laravel's `Mockery` integration provides `shouldReceive()` for expressive stubs. `$this->partialMock()` replaces a container binding with a mock; `$this->mock()` registers a complete mock. `Bus::fake()`, `Event::fake()`, `Mail::fake()`, `Notification::fake()`, `Queue::fake()` provide Laravel-specific fakes that capture dispatched jobs/events/mail for assertion without executing real side effects. Layer isolation relies on dependency injection — if a controller directly calls `new Service()` instead of injecting via the constructor, mocking is impossible.

---

## Patterns
- **Controller tests with mocked services**: `$this->mock(PostService::class)->shouldReceive('create')->once()->andReturn($post)`.
- **Action tests with mocked repositories**: Inject a `PostRepositoryInterface` mock and test the action's orchestration logic.
- **FormRequest unit tests**: Instantiate the request with `$request = new StorePostRequest([...])` and call `$request->rules()` without hitting the controller.
- **DTO tests with plain assertions**: `new PostDTO(['title' => 'Test'])` and assert `$dto->title === 'Test'`.
- **Service tests with database (integration)**: Use `RefreshDatabase` and test the service against real database — these are the acceptance tests for the service layer.
- **Avoid over-mocking**: Mock the boundary (interface), not the internals. Mock the `PostRepositoryInterface`, not the `PostRepository`.

---

## Architectural Decisions
Laravel encourages feature-level testing (full stack) over isolated unit testing. Layer isolation is an intentional deviation from this default — it adds test count and maintenance burden but reduces debugging time. The decision to isolate should be driven by team size and bug rate: small teams benefit from the simplicity of feature-test-only; larger teams benefit from the faster feedback of isolated tests.

---

## Tradeoffs
| Tradeoff | Feature-Test Only | Layered (Isolated) Tests |
|---|---|---|
| Test count | Fewer | More (one per layer) |
| Debug speed | Slower (any layer could be at fault) | Faster (layer pinpointed) |
| Mock maintenance | None | Higher (mocks need updates) |
| Refactoring cost | Lower (don't touch mock expectations) | Higher (update mock expectations) |
| Confidence | High (real stack) | Medium (mocks may be wrong) |

---

## Performance Considerations
Isolated unit tests are 10-100x faster than feature tests. Run them in a pre-CI stage (before feature tests) to fail fast on logic errors. Mock-heavy test suites that validate orchestration (did the right method get called?) are fast because they don't boot the framework. Use `RefreshDatabase` only for integration tests in the service layer — unit tests of DTOs, form requests, and plain PHP actions don't need the database.

---

## Production Considerations
Layer isolation prevents brittle integration tests from being the only test layer. When a production bug occurs, the layer that should have caught it can be identified, and a targeted test at that layer is added. Use architecture tests to enforce dependency rules: services cannot call controllers, DTOs cannot call services, etc. This ensures the layer boundaries exist and are testable.

---

## Common Mistakes
- Over-mocking: mocking the same class in every test instead of using a fake or real implementation.
- Testing implementation details: asserting that `$service->create()` called `$repository->save()` — this makes tests brittle to refactoring.
- Mocking what you don't own: mocking Eloquent models, the Query Builder, or third-party SDKs — these should be tested in integration.
- No integration layer: having only isolated unit tests but no tests that verify the real interactions between layers.

---

## Failure Modes
- **Mock mismatch**: The mock expects `findById()` but the real interface uses `find()` — tests pass, production fails.
- **Brittle mocks**: A refactoring changes method signatures — all mocks break simultaneously, requiring massive `shouldReceive()` rewrites.
- **False confidence**: All isolated tests pass but the layers don't wire together correctly in production — no integration tests to catch connection failures.
- **Layer leakage**: Controller calls a repository method directly instead of going through the service — mock expectations on the service pass but the real code bypasses the service.

---

## Ecosystem Usage
Laravel's own test suite uses layered isolation — framework components are tested in isolation with mocked dependencies. Spatie's packages follow isolation patterns. Clean Architecture / Hexagonal Architecture projects in Laravel heavily rely on layer isolation for maintainability.

---

## Related Knowledge Units
### Prerequisites
- PHPUnit Mocking (`createMock`, `expects`, `willReturn`)
- Laravel Facades and Container Mocking
- Dependency Injection in Laravel

### Related Topics
- architecture-tests-for-apis (enforcing layer boundaries)
- action-service-unit-testing (testing business logic in isolation)
- form-request-unit-testing (testing validation rules in isolation)
- dto-unit-testing (testing data transfer objects in isolation)

### Advanced Follow-up Topics
- Hexagonal architecture testing in Laravel (ports and adapters)
- Contract testing between layers
- Testing with fakes vs mocks vs stubs

---

## Research Notes
### Source Analysis
PHPUnit's `MockObject` via `createMock()`. Laravel's `InteractsWithContainer` trait provides `mock()`, `partialMock()`, `instance()`, `swap()` for container-based mocking. `Illuminate\Support\Facades\Bus::fake()` provides job-dispatching fakes.
### Key Insight
Layer isolation is the Laravel testing community's biggest divergence from framework defaults (which favor feature tests). The optimal balance is 70% feature-level API tests + 30% isolated unit tests for complex business logic.
### Version-Specific Notes
Laravel 11's `Mockery` integration uses `Mockery::mock()` syntax. PHPUnit 10+ uses `createStub()` for simpler stubs. PestPHP provides `->andReturn()` chaining for mocks in its expectation API.
