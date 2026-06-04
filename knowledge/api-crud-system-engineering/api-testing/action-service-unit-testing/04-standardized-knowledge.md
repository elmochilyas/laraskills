# ECC Standardized Knowledge — Action / Service Unit Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Action / Service Unit Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Action and service unit tests validate the business logic layer of an API — orchestration in action classes and domain logic in service classes. Tests mock repository/persistence boundaries and assert that the service returns the correct DTOs, dispatches the correct events, and applies the correct business rules under various conditions. This is the core unit testing layer in a Laravel API: it covers the logic between the controller (thin) and the model/repository (data access). Testing these classes in isolation provides fast, targeted feedback on business logic correctness.

## Core Concepts

- **Actions**: Single-purpose classes with `__invoke` or `handle` — test orchestration
- **Services**: Multi-method classes with domain logic — test business rules
- **Mocked dependencies**: Replace repositories/persistence with mocks using `$this->mock()` or `createMock()`
- **Event assertions**: `Event::fake()` + `Event::assertDispatched()` — verify side effects
- **Bus assertions**: `Bus::fake()` + `Bus::assertDispatched()` — verify queued jobs
- **Repository boundary**: Mock at the interface level (`PostRepositoryInterface`), not the implementation

## When To Use

- Every action class (invokable or handle-based) with business logic
- Service classes that orchestrate multiple operations
- Business logic that dispatches events or queues jobs
- Domain logic with conditional rules and multiple output paths

## When NOT To Use

- Feature-level controller testing (use feature tests for HTTP assertions)
- DTO testing (pure data — no mocking needed)
- Repository/model testing (test with real database)
- Trivial pass-through logic (delegates entirely without transformations)

## Best Practices

- **Mock repository boundaries, not domain logic**: Mock `PostRepositoryInterface`, not `PostFactory` or internals.
- **Test all return paths**: Success → return DTO/response, failure → throw exception, conditional → different outputs.
- **Test event/job dispatch**: `Event::fake(); $action->handle(...); Event::assertDispatched(PostCreated::class)`.
- **Test exception scenarios**: Repository throws → action catches and re-throws domain exception or handles gracefully.
- **Use data providers for rule variants**: Different input combinations producing different business outcomes.
- **Integration tests for database services**: If action uses Eloquent directly (no repository), use `RefreshDatabase`.

## Architecture Guidelines

- The action/service pattern separates business logic from HTTP concerns and persistence concerns.
- This separation makes the logic testable — a controller test requires HTTP kernel, an action test requires only PHPUnit.
- Mock at the boundary you own (repository interfaces, event system) and use real implementations for value objects (DTOs).
- When a service has 8+ constructor parameters, it has too many responsibilities — refactor.

## Performance Considerations

- Action/service unit tests (with mocked repositories) are fast — <10ms per test.
- They should form the largest layer in the test pyramid.
- Run unit action tests with `--group=unit` in CI pre-stage; run integration tests with `--group=integration` in full suite.
- Use mutation testing (`infection` tool) to validate test quality — if mutations kill mocks but not business logic, tests are too mock-centric.

## Security Considerations

- The action/service layer is the most critical for production correctness — bugs here mean incorrect business logic.
- Ensure authorization checks in services are tested with both permitted and forbidden states.
- Test that sensitive data is not logged or exposed in error paths within service methods.
- Security-critical validations should have both isolated unit tests and integration tests to catch mock/reality mismatches.

## Common Mistakes

- **Over-mocking**: Mocking value objects (DTOs, collections), primitive values, or framework internals.
- **Mocking what you don't own**: Mocking `Model::query()` or `DB::table()` — use repository abstraction instead.
- **Testing implementation details**: Asserting exact call order or exact call count when it doesn't matter.
- **No integration layer**: All action tests use mocked repositories — SQL changes in real repository pass tests but break production.
- **Mocking without interfaces**: Using `Mockery::mock(ConcreteClass::class)` — works but couples to concrete implementation.

## Anti-Patterns

- **God services**: Services with 8+ dependencies doing everything — untestable and unmaintainable.
- **100% mock coverage**: No integration tests at all — mocks may mismatch real behavior.
- **Testing Eloquent queries in services**: Services that use `Model::where(...)` directly instead of repository methods — tightly coupled and hard to mock.
- **Identical test scenarios at feature level and unit level**: Duplicating exact same assertions across layers.

## Examples

```php
it('creates a post and dispatches created event', function () {
    Event::fake();
    $repo = $this->createMock(PostRepositoryInterface::class);
    $dto = new PostDTO(['title' => 'Hello', 'body' => 'World']);

    $repo->expects($this->once())
        ->method('save')
        ->with($dto)
        ->willReturn(new Post(['id' => 1]));

    $service = new PostService($repo);
    $result = $service->create($dto);

    expect($result->id)->toBe(1);
    Event::assertDispatched(PostCreated::class);
});

it('throws exception when post not found', function () {
    $repo = $this->createMock(PostRepositoryInterface::class);
    $repo->expects($this->once())
        ->method('findById')
        ->with(999)
        ->willReturn(null);

    $service = new PostService($repo);

    expect(fn() => $service->update(999, new PostDTO()))->toThrow(PostNotFoundException::class);
});
```

## Related Topics

- **Prerequisites**: PHPUnit Mocking, Laravel Events and Bus fakes, Action/Service Pattern in Laravel
- **Siblings**: layer-isolation-in-tests, dto-unit-testing, form-request-unit-testing
- **Advanced**: CQRS Command/Query bus testing, Domain events and event sourcing testing, Hexagonal architecture testing

## AI Agent Notes

- Action/service testing is where the highest-value unit testing happens — business logic bugs are the most expensive to fix in production.
- Laravel 11 introduced `php artisan make:action` — these follow the same testing pattern as services.
- Use PestPHP's `->andReturn()` for mock chaining and PHPUnit 10+ `#[Test]` attribute.

## Verification

- [ ] Every action/service class has unit tests for all return paths
- [ ] Mock dependencies at the boundary interface level, not implementation
- [ ] Event and job dispatch is verified via fakes
- [ ] Exception scenarios are tested (repository failures, validation errors)
- [ ] Integration tests exist for services with real database connection
- [ ] Services with excessive dependencies (>5) are identified for refactoring
