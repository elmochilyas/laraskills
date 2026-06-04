# Skill: Apply Constructor Injection for Explicit Dependencies

## Purpose
Declare class dependencies as type-hinted constructor parameters, enabling automatic resolution by the service container while maintaining explicit, testable dependency contracts.

## When To Use
- All classes managed by the container: controllers, services, repositories, jobs, listeners, middleware
- When dependencies are required for the class to function
- When you need immutable dependencies (set once, never reassigned)

## When NOT To Use
- For DTOs and value objects — `new UserData(...)` is sufficient without container involvement
- For Eloquent models — models are hydrated by Eloquent, not the container
- For classes with 7+ constructor parameters — indicates over-injection, refactor instead
- When a dependency is used in only one method — prefer method injection for single-use deps

## Prerequisites
- Understanding of `Container::build()` which drives constructor resolution via ReflectionClass
- Knowledge of type-hinting syntax and PHP 8+ promoted properties
- Familiarity with interface binding and auto-resolution strategy

## Inputs
- Class definition with constructor
- List of required dependencies (services, repositories, utilities)
- Interface bindings in service providers (if using interfaces as type-hints)

## Workflow
1. Identify all dependencies the class needs to function
2. Add each dependency as a type-hinted parameter in the constructor
3. Prefer interface type-hints over concrete classes (enables swapping implementations)
4. Use PHP 8+ promoted properties with `readonly` modifier: `__construct(readonly LoggerInterface $log)`
5. Keep parameter count to 4 or fewer — group related deps or split the class if exceeding
6. Provide `= null` defaults for optional dependencies: `?LoggerInterface $logger = null`
7. Keep the constructor pure — accept and assign dependencies only, no I/O or side effects
8. Test that the container resolves the class with all injected dependencies

## Validation Checklist
- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interface type-hints are preferred over concrete classes where swapping is needed
- [ ] No `app()` or `resolve()` calls exist in class bodies
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] Constructor parameter count is ≤ 4 for most classes
- [ ] Readonly promoted properties are used for injected dependencies
- [ ] Optional dependencies use `?Type $dep = null` syntax

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface type-hinted without binding | Register explicit `bind()` in service provider |
| `BindingResolutionException` for nullable param | `?Type $dep` without `= null` | Change to `?Type $dep = null` |
| Circular dependency during resolution | A injects B, B injects A | Extract shared dependency into third class |
| Hidden dependencies | `app()` called inside constructor or methods | Move all deps to constructor signature |
| Unexpected side effects on instantiation | Constructor performs I/O at build time | Move side effects to dedicated methods |

## Decision Points
- **Interface vs concrete type-hint**: Use interface when the implementation should be swappable (testing, different environments); use concrete for stable utilities with no alternatives
- **Constructor vs method injection**: Use constructor for deps used across multiple methods; use method injection for single-method deps
- **Promoted vs traditional properties**: Always prefer promoted properties (PHP 8+); traditional manual assignment only when pre-8.0 compatibility is needed

## Performance Considerations
- Reflection-based resolution adds ~0.01-0.05ms per class with dependencies
- Deep resolution chains multiply cost linearly
- Singleton dependencies resolve constructor only once — subsequent calls return cached instance
- Pre-resolve hot-path services in Octane's `booted()` callback
- No built-in caching of Reflection results — each `make()` re-inspects

## Security Considerations
- Constructor-injected deps are resolved at construction time — access controls apply then
- Never accept untrusted data in constructor arguments of injected classes
- Over-injection (many parameters) indicates a class with too many responsibilities — security risk via complexity
- Avoid wide type-hints like `Container $container` — this is a disguised service locator

## Related Rules
- Type-Hint Interfaces Over Concretions in Constructors
- Keep Constructors Pure — No Side Effects
- Limit Constructor Parameters to 4 or Fewer
- Never Use app() Inside Class Constructors
- Use Readonly Promoted Properties
- Provide Default Values for Optional Dependencies
- Avoid Wide Type-Hints Like Container

## Related Skills
- Configure Auto-Resolution for Concrete Classes
- Apply Method Injection for Action-Specific Dependencies
- Register Interface Bindings in Service Providers
- Detect and Break Circular Dependencies

## Success Criteria
- All dependencies are visible as type-hinted constructor parameters
- Class can be instantiated via container without manual wiring
- Tests can substitute dependencies via `$this->app->instance()` or constructor arguments
- Constructor is pure (no side effects) and uses promoted readonly properties
- Parameter count is ≤ 4 with no violations of Single Responsibility Principle
