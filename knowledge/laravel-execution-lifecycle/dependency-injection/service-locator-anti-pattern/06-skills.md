# Skill: Replace Service Locator with Constructor Injection

## Purpose
Identify and eliminate service locator usage (`app()`, `resolve()`, `App::make()`) in business logic classes by moving dependencies to explicit constructor injection, making all class requirements visible and testable.

## When To Use
- Refactoring classes that use `app()` or `resolve()` in method bodies
- Code review when finding hidden dependencies
- Replacing facade usage in domain services and repositories
- Eliminating `Container $container` as a constructor parameter

## When NOT To Use
- In service provider `register()` methods — container access is the class's purpose
- In top-level route closures for rapid prototyping (refactor before merging)
- In Blade directives where constructor injection is unavailable
- In testing utilities where explicit container access is needed

## Prerequisites
- Understanding that `app()`, `resolve()`, and `App::make()` are all service locator patterns
- Knowledge of constructor injection as the correct alternative
- Familiarity with facade faking (`shouldReceive()`) vs explicit injection testing

## Inputs
- Class containing `app()`, `resolve()`, or facade calls in method bodies
- List of dependencies hidden behind service locator calls
- Test class that currently requires container configuration for testing

## Workflow
1. Scan the class for `app()`, `resolve()`, `App::make()`, and facade calls (`Cache::get()`, `Log::info()`)
2. For each hidden dependency, determine the interface or class being resolved
3. Add each as a type-hinted constructor parameter with an interface type-hint where possible
4. Replace `app(Service::class)` calls with `$this->service->method()` using the injected dependency
5. Replace facade calls (`Cache::get()`) with injected interface calls (`$this->cache->get()`)
6. Ensure no `app()` calls remain in the class body
7. Register the necessary interface bindings in a service provider
8. Update tests: use `$this->app->instance()` for mocks instead of `app()` in test methods
9. Verify CI tools (PHPStan, Larastan) no longer flag the class

## Validation Checklist
- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] No class accepts `Container $container` as a constructor dependency
- [ ] CI pipeline (PHPStan/Larastan) flags service locator usage in domain code
- [ ] No mixed pattern (some deps injected, others pulled via app())
- [ ] No `app()` inside loops — pre-resolved via constructor

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Still using app() after refactor | Missed some app() calls in method bodies | Full grep scan for app(, resolve(, App::make( |
| Facade still in domain service | `Cache::get()` in repository | Inject `CacheInterface` instead |
| Test setup more complex | Test needs container config for injected deps | Use `$this->app->instance()` for cleaner test setup |
| Mixed injection pattern | Some deps injected, others still pulled via app() | Eliminate all app() calls — be consistent |
| Circular dependency introduced | Moving app() to constructor creates cycle | Extract shared dependency to break the cycle |

## Decision Points
- **Constructor injection vs facade**: Always use constructor injection for business logic; facades are acceptable only in controllers/views
- **`instance()` vs `shouldReceive()` in tests**: Use `$this->app->instance()` for interface-based services; use `shouldReceive()` for facade-based services (only when facade is appropriate)
- **Incremental vs full refactor**: Incrementally move dependencies to constructor as you touch files; full refactor for critical domain services

## Performance Considerations
- `app()` calls add negligible direct overhead (~0.001ms per call)
- Hidden dependencies may be resolved multiple times in different methods if not cached
- Constructor injection ensures dependencies are resolved once at construction time
- Service locator usage prevents the container from optimizing resolution order
- In Octane, `app()` calls still work but may return stale instances if scoped bindings not flushed

## Security Considerations
- Service locator access to the container bypasses access controls — any code can resolve any bound service
- Classes using service locators are harder to audit for security — dependencies not visible in class signature
- Security-critical code (auth, middleware) should use explicit injection, never service locators
- `app()` in a loop can be used to repeatedly instantiate sensitive services — pre-resolve via injection

## Related Rules
- Never Call app() in Business Logic Classes
- Never Inject Container into Business Logic Classes
- Declare Every Dependency in the Constructor Signature
- Use Facades Sparingly and Only in Presentation Layer
- Never Use app() Inside a Loop
- Do Not Mix Injection Patterns — Use One Consistent Approach

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Apply Facade Pattern for Static Proxy Access
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- Zero `app()` or `resolve()` calls in business logic classes
- All dependencies visible as type-hinted constructor parameters
- No class injects `Container $container` as a dependency
- Facades appear only in controllers, views, and route files
- Tests use `instance()` for mocks, not `app()` calls
- CI pipeline detects and flags any new service locator usage
