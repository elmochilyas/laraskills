# ECC Standardized Knowledge — Layer Isolation in Tests

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Layer Isolation in Tests |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Layer isolation in tests means testing each architectural layer in isolation — controllers (via feature tests), form requests (via unit tests), actions/services (via unit tests), DTOs (via unit tests), and models (via model tests). The principle is: each test type tests exactly one layer of the onion, mocking or stubbing the layers below it. Integration tests test the whole stack but are fewer in number. Well-layered tests provide fast, targeted feedback: a failing unit test points directly to the buggy layer without ambiguity.

## Core Concepts

- **HTTP/Feature tests**: Test the full stack (controller → middleware → routes)
- **Controller tests with mocked services**: `$this->mock(Service::class)->shouldReceive('create')->once()`
- **FormRequest unit tests**: Instantiate request, call `rules()`, `authorize()`, `messages()` directly
- **Action/Service unit tests**: Mock repository boundaries, test business logic orchestration
- **DTO unit tests**: Pure PHP assertions — no mocking, no database, no framework
- **Model tests**: Test scopes, accessors, mutators, relationships with database
- **Test pyramid**: Many unit tests (fast, isolated), fewer integration tests, few E2E tests

## When To Use

- Large Laravel API projects with clear architectural layers
- Teams practicing Domain-Driven Design or Hexagonal Architecture
- Projects where debugging time is a significant cost
- APIs with complex business logic requiring targeted test coverage

## When NOT To Use

- Small projects or prototypes (feature-test-only is sufficient)
- Teams without dependency injection patterns (mocking is difficult)
- APIs with thin business logic (controllers delegate entirely to Eloquent)

## Best Practices

- **Mock repository boundaries, not domain logic**: Mock `PostRepositoryInterface`, not `PostFactory` or `Exporter`.
- **Use `Bus::fake()`, `Event::fake()` for side-effect assertions**: Capture dispatched jobs/events without executing real side effects.
- **DTOs need zero mocking**: Test with `new PostDTO([...])` and plain assertions.
- **FormRequest unit tests**: Call `$request->setContainer(app())` before `$request->validator()`.
- **70/30 split**: 70% feature-level API tests + 30% isolated unit tests for complex business logic.
- **Avoid over-mocking**: Mock the boundary (interface), not the internals.

## Architecture Guidelines

- Layer isolation is an intentional deviation from Laravel's default feature-test-only approach.
- Benefits scale with team size: small teams benefit from feature-test simplicity; larger teams benefit from isolated test debugging speed.
- Use architecture tests to enforce dependency rules: services cannot call controllers, DTOs cannot call services.
- Dependency injection is required for mocking — if controllers call `new Service()`, mocking is impossible.

## Performance Considerations

- Isolated unit tests are 10-100x faster than feature tests.
- Run unit tests in a pre-CI stage before feature tests to fail fast on logic errors.
- Mock-heavy suites don't boot the framework — extremely fast execution.
- Use `RefreshDatabase` only for integration tests; unit tests of DTOs, form requests, and plain PHP actions don't need the database.

## Security Considerations

- Layer isolation prevents security-sensitive code (authorization logic) from being tested only at the feature level — unit-test authorization in form requests and services.
- Ensure mocked security boundaries (auth checks, permissions) are covered by integration tests too, since mocks may differ from real behavior.
- Security-critical validations should have both isolated unit tests and integration tests.

## Common Mistakes

- **Over-mocking**: Mocking the same class in every test instead of using a fake or real implementation.
- **Testing implementation details**: Asserting `$service->create()` called `$repository->save()` — makes tests brittle to refactoring.
- **Mocking what you don't own**: Mocking Eloquent models, Query Builder, or third-party SDKs — test in integration instead.
- **No integration layer**: Having only isolated unit tests but no tests verifying real interactions between layers.

## Anti-Patterns

- **100% isolation**: No integration tests — mocks may mismatch real behavior, causing production failures despite passing unit tests.
- **Mocking value objects**: Creating mocks for DTOs, collections, or primitives — use real instances instead.
- **Identical test coverage at every layer**: Testing the same logic (e.g., validation rules) at the form request level, service level, and feature level — choose one primary layer per concern.

## Examples

```php
// Controller test with mocked service
it('creates a post via service', function () {
    $this->mock(PostService::class)
        ->shouldReceive('create')
        ->once()
        ->andReturn(new PostDTO(['id' => 1, 'title' => 'Test']));

    $response = $this->actingAs($user)->postJson('/api/posts', ['title' => 'Test']);
    $response->assertStatus(201);
});

// Service unit test with mocked repository
it('creates post and dispatches event', function () {
    Event::fake();
    $repo = $this->createMock(PostRepositoryInterface::class);
    $repo->expects($this->once())->method('save')->willReturn($post);
    $service = new PostService($repo);

    $service->create(new PostDTO(['title' => 'Test']));

    Event::assertDispatched(PostCreated::class);
});
```

## Related Topics

- **Prerequisites**: PHPUnit Mocking, Laravel Service Container mocking, Dependency Injection in Laravel
- **Siblings**: architecture-tests-for-apis, action-service-unit-testing, form-request-unit-testing, dto-unit-testing
- **Advanced**: Hexagonal architecture testing, Contract testing between layers, Fakes vs mocks vs stubs

## AI Agent Notes

- Layer isolation is the Laravel testing community's biggest divergence from framework defaults (which favor feature tests).
- The optimal balance is 70% feature-level API tests + 30% isolated unit tests for complex business logic.
- When a production bug occurs, identify which layer should have caught it and add a targeted test at that layer.

## Verification

- [ ] Each architectural layer has at least one dedicated test type
- [ ] DTO tests require zero mocking and zero database
- [ ] Action/service tests mock repository boundaries, not internals
- [ ] Integration tests verify that mocked boundaries work with real implementations
- [ ] Feature tests cover the full HTTP stack for critical paths
