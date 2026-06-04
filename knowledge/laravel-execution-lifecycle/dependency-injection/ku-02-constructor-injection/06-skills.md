# Skill: Apply Constructor Injection for Dependency Contracts

## Purpose
Declare class dependencies through type-hinted constructor parameters that the container automatically resolves, creating explicit, immutable, and testable dependency contracts for all resolvable classes.

## When To Use
- All classes that need dependencies: controllers, services, repositories, jobs, listeners, middleware
- When dependencies are required for the class to function
- For shared services that should be resolved once and reused (paired with singleton)

## When NOT To Use
- For DTOs and value objects — instantiate with `new` directly
- For Eloquent models — they are hydrated by Eloquent, not the container
- For classes with 7+ constructor parameters — signals over-injection; refactor instead
- When a dependency is used in only one method — use method injection

## Prerequisites
- Understanding of `Container::build()` and Reflection-based parameter resolution
- Knowledge of type-hinting syntax and PHP 8+ promoted properties
- Familiarity with optional dependencies (`?Type $dep = null` pattern)

## Inputs
- Class definition with constructor
- List of required dependencies (services, repositories, utilities)
- Interface or concrete class names for type-hints

## Workflow
1. Identify all dependencies the class requires to function
2. Add each as a type-hinted constructor parameter — prefer interface type-hints
3. Use PHP 8+ promoted properties with `readonly`: `__construct(readonly LoggerInterface $log)`
4. Keep parameter count to 4 or fewer — group related deps or split the class
5. Mark optional dependencies as nullable with `= null` default
6. Keep constructor pure — only assign dependencies, no I/O or side effects
7. Bind interfaces to concretes in service provider `register()` methods
8. Test that the container resolves the class with all dependencies injected

## Validation Checklist
- [ ] All dependencies declared as type-hinted constructor parameters
- [ ] No `app()` or `resolve()` calls exist in business logic
- [ ] Constructor parameter count is ≤ 4 for most classes
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] Interface type-hints are preferred where implementations should be swappable
- [ ] Readonly promoted properties are used for injected dependencies
- [ ] Optional dependencies use `?Type $dep = null` syntax
- [ ] Circular dependencies are avoided (DAG structure)

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface type-hinted without binding | Register explicit `bind()` for the interface |
| `BindingResolutionException` for nullable | `?Type $dep` without `= null` | Change to `?Type $dep = null` |
| Circular dependency during resolution | A injects B, B injects A | Extract shared dependency into third class |
| Hidden deps via app() | `app()->make()` called inside constructor/methods | Inject explicitly via constructor |
| Side effects on resolution | Constructor performs I/O at build time | Move to dedicated methods |

## Decision Points
- **Interface vs concrete type-hint**: Use interface for swappable deps; use concrete for stable utilities
- **Constructor vs method injection**: Constructor for shared multi-method deps; method injection for single-use deps
- **Promoted vs traditional properties**: Always use promoted properties (PHP 8+); traditional only for pre-8.0 compatibility

## Performance Considerations
- Reflection-based resolution adds ~0.01-0.05ms per class
- Deep dependency chains multiply cost linearly
- Singleton dependencies resolve constructor once, then cache the instance
- No built-in caching of Reflection — each `make()` re-inspects
- Pre-resolve hot-path services in Octane's `booted()` callback

## Security Considerations
- Constructor-injected deps resolved at construction time — access controls apply then
- Never accept untrusted data in constructor params of injected classes
- Over-injection (many parameters) violates SRP — security risk via complexity
- Avoid `Container $container` type-hints — disguised service locator

## Related Rules
- Type-Hint Interfaces Over Concrete Classes in Constructors
- Keep Constructors Pure — No Side Effects
- Limit Constructor Parameters to 4
- Never Use app() in Constructors
- Prefer Readonly Promoted Properties
- Use Default Values for Optional Dependencies
- Avoid Circular Dependencies via Constructor Injection

## Related Skills
- Apply Method Injection for Action-Specific Dependencies
- Register Interface Bindings in Service Providers
- Detect and Break Circular Dependencies

## Success Criteria
- All dependencies visible as type-hinted constructor parameters
- Class can be instantiated via container without manual wiring
- Tests can substitute dependencies via constructor arguments or `instance()`
- Constructor is pure (no side effects) with promoted readonly properties
- Parameter count ≤ 4 with no SRP violations
