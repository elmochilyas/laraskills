# Skill: Test Classes with Dependency Injection

## Purpose
Test Laravel classes that receive dependencies through the constructor by substituting real implementations with test doubles, enabling isolated verification of business logic without running the full framework container.

## When To Use
- Testing service classes, actions, commands, and other DI-injected classes
- When substituting a real service with a controlled fake for deterministic testing
- For classes injected via Laravel's auto-resolution or manual `app()->make()`
- When testing conditional logic based on service responses

## When NOT To Use
- When the dependency is a simple data object (pass a real instance)
- When overriding the binding via `App::instance()` is simpler than constructor injection
- For testing the framework's container resolution itself (trust the framework)
- When the real dependency is faster and more reliable than a fake

## Prerequisites
- Understanding of Laravel's service container and dependency injection
- PHPUnit or Pest test class with `$this->app` access
- Knowledge of `$this->instance()`, `$this->swap()`, and `Mockery::mock()`

## Inputs
- Class under test and its constructor type-hints
- Real or fake implementations for each dependency
- Expected behavior of each dependency (return values, exceptions)
- Method arguments for the action under test

## Workflow
1. Identify all type-hinted constructor dependencies of the class under test
2. For each dependency, decide: real implementation, fake, or mock
3. Bind fakes to the container using `$this->instance(Contract::class, $fake)`
4. For mocking, use `$this->mock(Contract::class)` or `Mockery::mock()`
5. Instantiate the class via `app()->make()` or `new Class($dependency)` with explicit DI
6. Set up expectations on mocked dependencies (return values, call counts)
7. Invoke the method under test
8. Assert return values and verify expected interactions on mocks
9. Use `Mockery::close()` in tearDown or Pest's `->afterEach()` to verify mock expectations

## Validation Checklist
- [ ] All constructor dependencies are identified and provided
- [ ] Real implementations are preferred over mocks for fast, deterministic services
- [ ] Container bindings are properly set up before class instantiation
- [ ] Mock expectations verify interaction (arguments, call count)
- [ ] `Mockery::close()` is called in tearDown to verify mock expectations
- [ ] Tests pass when run in isolation and as part of the suite

## Common Failures
- Forgetting to bind a dependency before calling `app()->make()` — resolves to real implementation
- Not calling `Mockery::close()` — mock expectations silently pass without verification
- Over-mocking — mocking simple value objects or collections
- Mocking the class under test itself (testing the mock, not the real class)
- Container state leaking between tests — reset bindings in `setUp` or `beforeEach`

## Decision Points
- Real implementation vs mock — real for value objects and collections, mock for external services
- `$this->instance()` vs `$this->mock()` — instance for pre-built fakes, mock for expectation verification
- Constructor injection vs method injection — constructor for required deps, method for optional context

## Performance Considerations
- Container resolution is fast (<1ms) when bindings are simple
- Mocking dependencies adds negligible overhead (<0.5ms per mock)
- Avoid heavy service resolution in setUp — resolve only what the specific test needs

## Security Considerations
- Ensure mock expectations on authorization services return correct values for each test scenario
- Test with both authorized and unauthorized dependency configurations
- Verify that security-related services (auth, gate) are not over-mocked in security-critical tests

## Related Rules
- [Rule: Use Real Implementations When Possible](./05-rules.md)
- [Rule: Prefer Container Instance Over Mock for Fakes](./05-rules.md)
- [Rule: Reset Container Bindings Between Tests](./05-rules.md)

## Related Skills
- Test Doubles and Mocks
- Mockery Integration
- Laravel's Service Container

## Success Criteria
- [ ] Class under test can be instantiated with any combination of real/fake dependencies
- [ ] Mocks correctly verify that dependencies are called with the right arguments
- [ ] Container state is clean between tests (no leaking bindings)
- [ ] Tests verify business logic independently of real external services
