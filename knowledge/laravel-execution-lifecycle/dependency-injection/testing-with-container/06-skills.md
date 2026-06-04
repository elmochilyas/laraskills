# Skill: Test Container-Dependent Code with Instance Binding

## Purpose
Use the container's binding replacement methods — `instance()`, `shouldReceive()`, `forgetScopedInstances()`, and `refreshApplication` — to substitute real services with test doubles (mocks, fakes, stubs) for clean, isolated testing.

## When To Use
- Testing code that uses facades — replace with mocks via `shouldReceive()`
- Testing code bound to interfaces — replace the binding with a mock via `instance()`
- Testing scoped bindings — reset scoped instances between tests
- Testing service providers — verify expected bindings are registered
- When constructor injection makes tests cleaner than service locator access

## When NOT To Use
- When testing pure business logic without container dependencies — simple unit tests with `new` suffice
- When Laravel's built-in fakes (Event::fake(), Bus::fake(), Queue::fake()) are available
- When over-mocking — replacing every dependency with a mock instead of testing real interactions
- When testing container internals (`bound()`, `isShared()`) — test behavior, not implementation

## Prerequisites
- Understanding of `instance()`, `forgetInstance()`, `forgetScopedInstances()` on the container
- Knowledge of facade faking: `shouldReceive()`, `swap()`, `Facade::clearResolvedInstances()`
- Familiarity with Mockery expectations and Laravel's built-in fakes

## Inputs
- Service class or facade to replace with a test double
- Mock/fake implementation (Mockery mock, hand-rolled fake, Laravel built-in fake)
- Test class with setUp/tearDown for state cleanup

## Workflow
1. Determine which services need test doubles for the current test
2. For interface-bound services, use `$this->app->instance(Interface::class, $mock)`
3. For facades, use `Facade::shouldReceive('method')->andReturn(value)` (or `Facade::fake()`)
4. For scoped bindings, ensure `$this->app->forgetScopedInstances()` is called in `setUp()`
5. Clear facade resolved instances with `Facade::clearResolvedInstances()` in `setUp()`
6. Prefer Laravel built-in fakes over Mockery mocks when available (`Event::fake()`, `Bus::fake()`, `Http::fake()`)
7. For full isolation, use `RefreshApplication` trait (rebuilds container per test)
8. Never override core framework bindings (app, events, config, router) — use targeted fakes instead
9. Reset all overrides in `tearDown()` or use `refreshApplication`

## Validation Checklist
- [ ] Tests that mock container bindings use `instance()` or `shouldReceive()`
- [ ] Facade fakes are cleared between tests (in `setUp()` or `tearDown()`)
- [ ] Scoped bindings are reset between tests where relevant
- [ ] No stale container state causes inter-test contamination
- [ ] Core framework bindings are not overridden in tests
- [ ] Laravel built-in fakes are preferred over manual mocks where available
- [ ] Mock expectations are verified (Mockery assertion check runs in `tearDown()`)

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Inter-test contamination | Stale `instance()` or facade state persists | Clear in `setUp()` or use `refreshApplication` |
| `shouldReceive()` silently not working | Facade root resolved before mock installed | Clear resolved instances before setting expectation |
| Test passes but code coverage missing | No expectations on mock — method not called | Add call-count expectations to mocks |
| Mockery exception at end of test | Expected method not called or unexpected call | Adjust mock expectations or use `shouldReceive()->byDefault()` |
| Framework internal operations broken | Core binding (`events`, `app`) overridden with mock | Use targeted `Event::fake()` instead of replacing dispatcher |

## Decision Points
- **`instance()` vs `shouldReceive()`**: Use `instance()` for interface-bound services that use constructor injection; use `shouldReceive()` for facade-based services
- **Laravel fakes vs Mockery mocks**: Prefer Laravel fakes (Event::fake(), Bus::fake(), Queue::fake(), Http::fake()) for resilience — fakes implement real interfaces; mocks break on signature changes
- **`refreshApplication` vs targeted cleanup**: Use `refreshApplication` when numerous overrides are needed (guarantees isolation, costs 30-100ms per test); use targeted `forgetScopedInstances()` + `clearResolvedInstances()` for minimal performance impact

## Performance Considerations
- Container overrides in tests add negligible overhead (~0.001ms per override)
- `refreshApplication` recreates the entire application — adds 30-100ms per test but guarantees isolation
- `instance()` is O(1) — direct array store and retrieve
- `forgetScopedInstances()` is O(n) on scoped binding count — typically <0.01ms
- Balance isolation vs speed: use targeted cleanup for most tests, `refreshApplication` for container-heavy tests

## Security Considerations
- Using `instance()` to bypass authentication services in tests is common — ensure tests don't accidentally test with bypassed security
- Reset all overrides between tests — stale overrides leak sensitive behavior between tests
- Mocked services that throw or return incorrect values may produce false negatives — verify mock behavior matches real service contracts
- Never override core framework bindings (events, config, router) — can mask real behavior and break internal framework operations

## Related Rules
- Use instance() to Mock Interface Bindings in Tests
- Use shouldReceive() for Facade Faking
- Reset Scoped Instances Between Tests
- Prefer Fakes Over Mocks
- Clear Facade Resolved Instances Between Tests
- Use refreshApplication for Full Container Reset
- Never Override Core Framework Bindings

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Apply Facade Pattern for Static Proxy Access
- Replace Service Locator with Constructor Injection

## Success Criteria
- Interface-bound services are mocked via `$this->app->instance()` in tests
- Facade-backed code is tested via `shouldReceive()` with proper cleanup
- Scoped bindings and facade state are cleared between tests
- Laravel built-in fakes are used when available (Event, Bus, Queue, Http)
- Core framework bindings are never overridden
- Tests have clean container state across the test suite
