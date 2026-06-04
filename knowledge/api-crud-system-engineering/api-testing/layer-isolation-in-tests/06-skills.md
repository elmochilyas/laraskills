# Skill: Isolate Test Layers

## Purpose
Structure tests so each architectural layer is tested in isolation — controllers via feature tests, form requests via unit tests, actions/services via unit tests with mocked boundaries, DTOs via pure PHP assertions — following a 70/30 split between integration and unit tests.

## When To Use
- Large Laravel API projects with clear architectural layers
- Teams practicing Domain-Driven Design or Hexagonal Architecture
- APIs with complex business logic requiring targeted test coverage

## When NOT To Use
- Small projects or prototypes (feature-test-only is sufficient)
- Teams without dependency injection patterns
- APIs with thin business logic

## Prerequisites
- PHPUnit Mocking
- Laravel Service Container mocking
- Dependency Injection in Laravel

## Inputs
- Architectural layer definitions (controllers, form requests, services, DTOs, models)
- Repository/service interface contracts
- Business logic complexity assessment

## Workflow
1. Mock at repository interface level, not Eloquent internals — decouples tests from persistence implementation
2. Use `Bus::fake()`, `Event::fake()`, `Notification::fake()`, `Mail::fake()` for side-effect assertions — capture dispatched events without real execution
3. Never mock DTOs — always use real instance creation and plain PHP assertions
4. Follow the 70/30 split: 70% feature-level integration tests + 30% isolated unit tests for complex business logic
5. Avoid over-mocking: never mock Eloquent models, Query Builder, or third-party SDKs — use integration tests instead
6. Use architecture tests to enforce dependency rules: services cannot call controllers, DTOs cannot call services
7. Ensure integration tests verify that mocked boundaries work with real implementations

## Validation Checklist
- [ ] Each architectural layer has at least one dedicated test type
- [ ] Repository boundaries mocked, not Eloquent internals
- [ ] DTO tests require zero mocking and zero database
- [ ] Bus/Event/Notification/Mail fakes used for side-effect assertions
- [ ] Action/service tests mock repository boundaries, not internals
- [ ] Integration tests verify mocked boundaries work with real implementations
- [ ] 70/30 split between feature-level and isolated unit tests
- [ ] Eloquent, Query Builder, and third-party SDKs not mocked

## Common Failures
- Over-mocking: mocking the same class in every test instead of using a fake or real implementation
- Testing implementation details: asserting service called repository::save — brittle to refactoring
- Mocking what you don't own: mocking Eloquent models, Query Builder, third-party SDKs
- 100% isolation: no integration tests — mocks may mismatch real behavior

## Decision Points
- Mock vs fake vs real: use mocks for owned interfaces, fakes for Laravel facades, real for value objects
- Integration test scope: which boundaries need real implementation verification
- Layer isolation depth: which layers get isolated tests vs integration-only coverage

## Performance Considerations
- Isolated unit tests are 10-100x faster than feature tests
- Run unit tests in pre-CI stage before feature tests to fail fast on logic errors
- DTO tests: no mocking, no database, no framework — fastest test type

## Security Considerations
- Layer isolation prevents security-sensitive code from being tested only at the feature level — unit-test authorization in form requests and services
- Ensure mocked security boundaries (auth checks, permissions) are covered by integration tests too
- Security-critical validations should have both isolated unit tests and integration tests

## Related Rules
- Mock Repository Boundaries, Not Internals
- Use Bus And Event Fakes For Side Effects
- DTOs Need Zero Mocking
- Follow The 70/30 Split
- Avoid Over-Mocking

## Related Skills
- Write Architecture Tests For APIs
- Test Action/Service Unit
- Test Form Request Unit
- Test DTO Unit

## Success Criteria
- Each layer has dedicated test type with correct isolation boundaries
- DTOs tested with real instances, zero mocking
- Feature tests cover full stack for critical paths
- Unit tests catch logic errors fast without framework boot
- Integration tests verify that mocked boundaries work with real implementations
- Architecture tests enforce layer dependency rules
