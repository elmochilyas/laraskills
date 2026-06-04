# Skill: Test Actions And Services Unit

## Purpose
Write isolated unit tests for action and service classes — mocking repository/persistence boundaries, testing all return paths (success, failure, exception), verifying event/job dispatch via fakes, using datasets for rule variants, and writing integration tests for database-bound services.

## When To Use
- Every action class (invokable or handle-based) with business logic
- Service classes orchestrating multiple operations
- Business logic that dispatches events or queues jobs
- Domain logic with conditional rules and multiple output paths

## When NOT To Use
- Feature-level controller testing (use feature tests for HTTP assertions)
- DTO testing (pure data — no mocking needed)
- Repository/model testing (test with real database)

## Prerequisites
- PHPUnit Mocking
- Laravel Events and Bus fakes
- Action/Service pattern in Laravel

## Inputs
- Action/service class files with dependencies
- Repository/service interface contracts
- Event/job classes dispatched by actions

## Workflow
1. Mock at repository boundary interface level, not domain logic — mock `PostRepositoryInterface`, not internals
2. Test all return paths: success → return DTO/response, failure → throw exception, conditional → different outputs
3. Test event and job dispatch via fakes: `Event::fake()` + `Event::assertDispatched(PostCreated::class)`
4. Test exception scenarios: repository throws → action catches and re-throws domain exception
5. Use PestPHP datasets for rule variants — different input combinations producing different business outcomes
6. Write integration tests for database-bound services: if service uses Eloquent directly (no repository), use `RefreshDatabase`
7. Avoid over-mocking: never mock value objects (DTOs, collections), primitive values, or framework internals

## Validation Checklist
- [ ] Every action/service class has unit tests for all return paths
- [ ] Mock dependencies at boundary interface level, not implementation
- [ ] Event and job dispatch verified via fakes
- [ ] Exception scenarios tested (repository failures, validation errors)
- [ ] Datasets used for rule variants with multiple combinations
- [ ] Integration tests exist for database-bound services
- [ ] Value objects not mocked — real instances used

## Common Failures
- Over-mocking: mocking value objects, framework internals, or Eloquent queries
- Testing implementation details: asserting exact call order or call count
- No integration layer: all tests use mocked repositories — SQL changes in real repo pass tests but break production
- Mocking without interfaces: using `Mockery::mock(ConcreteClass::class)` — couples to concrete implementation
- God services: 8+ dependencies doing everything — untestable

## Decision Points
- Mock vs fake vs real: mocks for owned interfaces, fakes for Laravel facades, real for value objects
- Integration test scope: which boundaries need real implementation verification
- Dataset granularity: per-field vs per-scenario combinations

## Performance Considerations
- Action/service unit tests (with mocked repositories) are fast — <10ms per test
- Run unit action tests with `--group=unit` in CI pre-stage
- Use mutation testing to validate test quality — if mutations kill mocks but not business logic, tests are too mock-centric

## Security Considerations
- Ensure authorization checks in services are tested with both permitted and forbidden states
- Test that sensitive data is not logged or exposed in error paths within service methods
- Security-critical validations should have both isolated unit tests and integration tests

## Related Rules
- Mock Repository Boundaries, Not Domain Logic
- Test All Return Paths
- Test Event And Job Dispatch Via Fakes
- Test Exception Scenarios
- Use Data Providers For Rule Variants
- Use Integration Tests For Database-Bound Services

## Related Skills
- Isolate Test Layers
- Test DTOs Unit
- Test Form Requests Unit

## Success Criteria
- Every action/service class has unit tests covering all return paths
- Mocking confined to repository/persistence boundaries
- Event/job dispatch verified for all side-effect paths
- Exception scenarios handled and tested
- Business rule variants covered by datasets
- Integration tests verify database-bound services with real persistence
