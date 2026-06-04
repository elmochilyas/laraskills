# Skill: Leverage Automatic Injection for Concrete Classes

## Purpose
Use the container's auto-resolution (Reflection-based) to instantiate concrete classes without explicit bindings, reducing boilerplate while maintaining a fully resolvable dependency graph.

## When To Use
- Concrete classes with simple, resolvable dependency trees
- Rapid prototyping and simple applications
- Classes where all constructor parameters are concrete or have explicit bindings
- Classes without constructor parameters (simple `new Class()` via container)

## When NOT To Use
- For interfaces or abstract classes — auto-resolution throws `TargetInterfaceNotInstantiableException`
- For classes with primitive constructor parameters without defaults
- For hot-path resolution in high-throughput applications
- When a specific implementation must be guaranteed (use explicit binding instead)

## Prerequisites
- Understanding of `Container::build()` and `ReflectionClass` usage
- Knowledge of the resolution chain order: bindings → instances → contextual → auto-resolution
- Familiarity with `$buildStack` circular dependency detection

## Inputs
- Concrete class name to be auto-resolved
- Constructor signature with type-hinted dependencies
- Optional: default values for optional primitives

## Workflow
1. Identify concrete classes that have no explicit binding
2. Verify the class is concrete (not abstract or interface) so `ReflectionClass::isInstantiable()` passes
3. Check each constructor parameter: are they class/interface types (resolvable) or primitives?
4. For class-typed parameters, verify they are also resolvable (concrete or explicitly bound)
5. For primitive parameters without defaults, add a default value or register an explicit primitive binding
6. For hot-path classes, add explicit `singleton()` bindings to bypass per-request Reflection cost
7. Verify no circular dependencies exist in the auto-resolution chain via `$buildStack`
8. Test that `app(Concrete::class)` resolves without exception

## Validation Checklist
- [ ] All interfaces and abstract classes have explicit bindings (not relying on auto-resolution)
- [ ] No primitive constructor parameters exist without defaults or explicit bindings
- [ ] Circular dependency detection works (no infinite resolution loops)
- [ ] Hot-path classes use explicit `singleton()` bindings
- [ ] Auto-resolution behavior is documented and expected (not accidental)
- [ ] No concrete-to-concrete redundant bindings exist
- [ ] Constructor side effects are avoided in auto-resolved classes

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface/abstract without binding | Register explicit `bind()` |
| `BindingResolutionException` for primitive | Scalar param without default or binding | Add `= null` default or primitive binding |
| `CircularDependencyException` | A → B → A dependency chain | Extract shared dependency into third class |
| Silent wrong implementation | No binding for interface — class uses unexpected concrete | Always bind interfaces explicitly |
| Per-request Reflection overhead | Auto-resolution on every request | Register `singleton()` for hot-path classes |

## Decision Points
- **Auto-resolution vs explicit binding**: Use auto-resolution for concrete utility classes; use explicit binding for interfaces and architectural boundaries
- **Singleton vs bind for concretes**: Use `singleton()` if the concrete is stateless and resolved frequently; use `bind()` if fresh instance needed per resolution
- **Default value vs contextual binding**: Use `= null` default for simple fallbacks; use `when()->needs('$param')->give()` for consumer-specific primitive values

## Performance Considerations
- `ReflectionClass` construction: ~0.01-0.05ms per resolved class
- Deep dependency chains multiply cost: 3 levels = 3 Reflection calls
- No built-in caching — each `make()` triggers fresh Reflection
- Singleton-resolved classes pay auto-resolution cost once
- OpCache does NOT help Reflection — it is runtime introspection, not compiled opcode

## Security Considerations
- Auto-resolution gives the container access to any concrete class — never pass untrusted class names to `make()`
- Auto-resolution for interface types fails loudly — no silent fallback to wrong implementations
- The `$buildStack` prevents infinite loops from circular dependencies
- Auto-resolved classes have full container access — restrict via constructor injection

## Related Rules
- Always Bind Interfaces Explicitly — Never Rely on Auto-Resolution
- Provide Defaults for Primitive Constructor Parameters
- Use Explicit Singletons for Hot-Path Auto-Resolved Classes
- Avoid Over-Reliance on Auto-Resolution
- Design Dependency Graphs to Avoid Circular Chains
- Let Concrete Classes Auto-Resolve — Do Not Over-Bind

## Related Skills
- Configure Auto-Resolution for Concrete Classes
- Apply Constructor Injection for Explicit Dependencies
- Register Interface Bindings in Service Providers
- Detect and Break Circular Dependencies

## Success Criteria
- All interfaces have explicit bindings — no auto-resolution attempts on abstractions
- Concrete classes resolve via `app()` without registration in service providers
- Hot-path classes bypass auto-resolution via `singleton()` bindings
- Zero primitive parameters exist without defaults or bindings
- No `CircularDependencyException` during normal operation
