# Skill: Configure Auto-Resolution for Concrete Classes

## Purpose
Leverage Laravel's auto-resolution mechanism to resolve concrete classes without explicit bindings, minimizing boilerplate while maintaining resolvable dependency graphs.

## When To Use
- Registering concrete classes with resolvable constructors (no interfaces/abstracts)
- Prototyping or simple applications where explicit bindings are over-engineering
- Classes whose constructor dependencies are all concrete or have existing bindings

## When NOT To Use
- For interfaces or abstract classes — auto-resolution throws `TargetInterfaceNotInstantiableException`
- For classes with primitive constructor parameters lacking defaults
- In production hot paths where Reflection cost on every `make()` is measurable
- When a specific concrete implementation must be guaranteed

## Prerequisites
- Understanding of `Container::build()` and `ReflectionClass` usage
- Knowledge of the resolution chain: bindings → instances → contextual → auto-resolution → exception
- Familiarity with `BindingResolutionException` and `TargetInterfaceNotInstantiableException`

## Inputs
- Class name(s) to be auto-resolved
- Constructor signatures with type-hinted dependencies
- Service provider `register()` method (for hybrid explicit + auto-resolution strategy)

## Workflow
1. Identify all concrete classes with type-hinted constructor parameters
2. Verify each parameter is either a concrete class (auto-resolvable), an interface with a binding, or a primitive with a default value
3. Exclude interfaces and abstract classes — register explicit bindings for those
4. Add default values (`= null`) for optional primitives to provide fallback
5. For hot-path classes, register explicit `singleton()` bindings to bypass Reflection overhead
6. Verify no circular dependencies exist in the auto-resolution chain
7. Test that `app(ConcreteClass::class)` resolves successfully without any explicit binding

## Validation Checklist
- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have fully resolvable constructors
- [ ] Hot-path classes are explicitly bound as singletons to avoid per-request Reflection
- [ ] No unresolved primitive parameters exist in auto-resolved constructors
- [ ] No constructor side effects (I/O, DB, API calls) in auto-resolved classes
- [ ] Circular dependency detection is verified (no infinite loops in `$buildStack`)

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface type-hinted without binding | Register explicit `bind()` for the interface |
| `BindingResolutionException` for scalar | Primitive parameter without default or binding | Add `= null` default or register primitive binding |
| `CircularDependencyException` | Class A → B → A dependency chain | Extract shared dependency into third class |
| Silent side effects on resolution | Constructor performs I/O/DB queries at build time | Move side effects to dedicated methods |
| Unexpected per-request latency | Deep auto-resolution chain resolved on every request | Register `singleton()` bindings for hot-path classes |

## Decision Points
- **Explicit binding vs auto-resolution**: Use auto-resolution for concrete utility classes (Logger, Cache); use explicit binding for architectural boundaries (repositories, gateways)
- **Singleton vs bind**: Use `singleton()` when the class is stateless and resolved frequently; use `bind()` when per-request mutable state exists
- **Default value vs contextual binding**: Use default values for simple fallbacks; use `when()->needs('$param')->give()` for consumer-specific primitive values

## Performance Considerations
- Auto-resolution costs ~0.01-0.05ms per class for Reflection inspection
- Resolution cost is NOT cached — each `make()` re-inspects the entire chain
- Deep chains (A → B → C → D) multiply cost linearly
- Pre-resolve with `singleton()` to pay Reflection cost once
- OpCache does not optimize Reflection — it is runtime introspection

## Security Considerations
- Auto-resolution can instantiate any concrete class — never pass untrusted class names to `make()`
- The `$buildStack` prevents infinite loops from circular dependencies
- Auto-resolved classes have full container access — restrict via constructor injection
- No silent fallback for interfaces — resolution fails loudly

## Related Rules
- Always Bind Interfaces Explicitly — Never Rely on Auto-Resolution
- Use Singleton Bindings for Hot-Path Classes
- Provide Defaults for Optional Primitive Parameters
- Avoid Constructor Side Effects in Auto-Resolved Classes
- Let Auto-Resolution Handle Concrete Classes (don't over-bind)

## Related Skills
- Register Interface Bindings in Service Providers
- Apply Constructor Injection for Explicit Dependencies
- Detect and Break Circular Dependencies

## Success Criteria
- Concrete classes resolve via `app()` without explicit registration in service providers
- Auto-resolution chain completes without exceptions for all expected resolution paths
- Hot-path classes bypass auto-resolution via explicit `singleton()` bindings
- Zero primitive parameters exist without defaults or bindings in auto-resolved classes
- No `CircularDependencyException` occurs during normal operation
