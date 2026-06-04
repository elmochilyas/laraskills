# Action / Service Unit Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Action / Service Unit Testing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Action and service unit tests validate the business logic layer of an API — orchestration in action classes and domain logic in service classes. Tests mock repository/persistence boundaries and assert that the service returns the correct DTOs, dispatches the correct events, and applies the correct business rules under various conditions. This is the core unit testing layer in a Laravel API: it covers the logic between the controller (thin) and the model/repository (data access). Testing these classes in isolation provides fast, targeted feedback on business logic correctness.

---

## Core Concepts
Actions (single-purpose classes with `__invoke` or `handle`) and Services (multi-method classes with domain logic) contain the API's business logic. They receive input (often DTOs), orchestrate operations (call repositories, dispatch events, apply rules), and return output (DTOs, responses, or models). Tests construct the action/service with mocked dependencies (using `$this->mock()` or constructor injection), call the method, and assert: correct return value, expected methods called on dependencies (via `shouldReceive`), correct events dispatched (via `Event::fake()`), and correct queue jobs dispatched (via `Bus::fake()`). For services that interact with the database, use `RefreshDatabase` for integration tests.

---

## Mental Models
Action/service testing is **testing the factory foreman** — the foreman (action/service) doesn't build everything himself (mocked dependencies), but he tells the right workers to do the right tasks in the right order. You test that: "when the foreman gets X input, he tells worker A to do task Y, worker B to do task Z, and reports result R."

---

## Internal Mechanics
Actions are typically invokable classes injected into controllers: `App\Actions\CreatePostAction`. Services are injectable classes: `App\Services\PostService`. Both use constructor injection for dependencies. PHPUnit mocking replaces these dependencies with `MockObject` instances. `$this->createMock(PostRepository::class)` creates a mock; `$mock->expects($this->once())->method('save')->with($dto)->willReturn($post)` defines expectations. `Event::fake()` captures all dispatched events; `Event::assertDispatched(CreatedEvent::class)` verifies. `Bus::fake()` captures queued jobs. The action/service is then instantiated with mocked dependencies, and its method called with test input.

---

## Patterns
- **Mock repository boundaries, not domain logic**: Mock `PostRepositoryInterface`, not `PostFactory` or `Exporter`.
- **Test all return paths**: Success → return DTO, failure → throw exception, conditional → different outputs per condition.
- **Test event/job dispatch**: `Event::fake(); $action->handle(...); Event::assertDispatched(PostCreated::class)`.
- **Test exception scenarios**: Repository throws, action catches and re-throws a domain exception or handles gracefully.
- **Use data providers for rule variants**: Different input combinations that produce different business outcomes.
- **Integration tests for database services**: If the action uses Eloquent directly (no repository interface), use `RefreshDatabase` and test against real DB — this is an integration test, not a unit test.

---

## Architectural Decisions
The action/service pattern separates business logic from HTTP concerns (controllers) and persistence concerns (models/repositories). This separation makes the logic testable — a controller test requires HTTP kernel, an action test requires only PHPUnit. The decision to use actions vs services is stylistic (actions for single-responsibility, services for cohesive operations), but both follow the same testing pattern. The key architectural test decision is: at what level do you mock? Mock at the boundary you own (repository interfaces, event system) and use real implementations for value objects (DTOs, Value Objects).

---

## Tradeoffs
| Tradeoff | Unit Test (Mocked Repo) | Integration Test (Real DB) |
|---|---|---|
| Speed | <10ms | ~100-500ms |
| Isolation | Complete | Requires database |
| Confidence | Medium (mocks may differ from real) | High (real queries) |
| Repository contract | Verified by mock expectations | Verified implicitly |

---

## Performance Considerations
Action/service unit tests (with mocked repositories) are fast and should form the largest layer in the test pyramid. Integration tests for the same services (with real database) should exist but be fewer. Run unit action tests with `--group=unit` in CI pre-stage; run integration service tests with `--group=integration` in the full suite.

---

## Production Considerations
The action/service layer is the most critical for production correctness — bugs here mean incorrect business logic, not just wrong HTTP responses. Comprehensive unit test coverage of this layer catches: wrong calculations, missed event dispatches, incorrect state transitions, and broken orchestration. Use mutation testing (`infection` tool) to validate action/service test quality — if mutation testing kills the mocks but not the business logic, the tests are too mock-centric.

---

## Common Mistakes
- Over-mocking: mocking value objects (DTOs, collections), primitive values, or framework internals.
- Mocking what you don't own: mocking `Model::query()` or `DB::table()` — use repository abstraction instead.
- Testing implementation details: asserting exact call order or exact number of calls when it doesn't matter.
- No integration layer: all action tests use mocked repositories, so a SQL query change in the real repository passes tests but breaks production.
- Mocking services that don't have interfaces — need `Mockery::mock(ConcreteClass::class)` which works but couples to the concrete implementation.

---

## Failure Modes
- **Mock mismatch with real repository**: Mock expects `findById()` but real repo uses `find()` — tests pass, production fails.
- **Event fake doesn't catch all dispatches**: `Event::fake()` only fakes events dispatched via `event()` helper or `Event::dispatch()` — direct listener calls bypass the fake.
- **Queue fake misses chained jobs**: `Bus::fake()` captures jobs dispatched via `dispatch()` but not jobs dispatched as a chain — test doesn't see chained jobs.
- **Service with too many dependencies**: 8+ constructor parameters — the action/service has too many responsibilities (violates Single Responsibility).

---

## Ecosystem Usage
Laravel's own action classes (introduced in Laravel 11 with the `make:action` artisan command) are testable via the same pattern. Spatie's packages use action/service patterns extensively with comprehensive test suites. Domain-Driven Design projects in Laravel use service classes as the domain layer and test them with mocked repository boundaries.

---

## Related Knowledge Units
### Prerequisites
- PHPUnit Mocking (expects, willReturn, with)
- Laravel Events and Bus (Event::fake, Bus::fake)
- Action / Service Pattern in Laravel

### Related Topics
- layer-isolation-in-tests (testing philosophy rationale)
- dto-unit-testing (DTOs as service input/output)
- form-request-unit-testing (validation layer before action)

### Advanced Follow-up Topics
- CQRS (Command/Query bus testing)
- Domain events and event sourcing testing
- Hexagonal architecture action/service testing

---

## Research Notes
### Source Analysis
PHPUnit `createMock()` for interface mocking. Laravel `$this->mock()` for container-bound mocking. `Illuminate\Support\Facades\Event::fake()` and `assertDispatched()`. `Illuminate\Support\Facades\Bus::fake()` and `assertDispatched()`.
### Key Insight
Action/service testing is where the highest-value unit testing happens in an API — business logic bugs are the most expensive to fix in production, and these tests catch them before they leave the developer's machine.
### Version-Specific Notes
Laravel 11 introduced `php artisan make:action`. PestPHP 2.x provides `->andReturn()` for mock chaining. PHPUnit 10+ requires `#[Test]` attribute instead of `@test` docblock annotation.
