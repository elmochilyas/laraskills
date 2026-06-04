# Skill: Register Interface Bindings in Service Providers

## Purpose
Map interfaces to concrete implementations in service providers, enabling dependency inversion — high-level code depends on abstractions while the container resolves the correct concrete at runtime.

## When To Use
- Whenever a class depends on an interface (services, repositories, gateways)
- When implementations need to be swappable per environment or for testing
- When implementing the strategy pattern with different concretes for different contexts
- When third-party packages provide interfaces that need concrete mappings

## When NOT To Use
- For classes with a single concrete implementation and no planned alternatives — direct concrete type-hinting is simpler
- In controllers that directly call Eloquent — use repository interfaces or service classes instead
- When the binding adds complexity without value — not every class needs an interface

## Prerequisites
- Understanding of `Container::$bindings` structure (abstract → concrete mappings)
- Knowledge of service provider `register()` vs `boot()` timing
- Familiarity with `bind()`, `singleton()`, `instance()`, and Closure-based binding

## Inputs
- Interface namespace (the abstraction)
- Concrete class namespace (the implementation)
- Service provider class where the binding will be registered
- Optional: lifecycle requirement (shared singleton vs new instance per resolution)

## Workflow
1. Create or locate the interface that defines the abstraction contract
2. Implement the interface with one or more concrete classes
3. Open or create the appropriate service provider (grouped by domain/feature)
4. Register the binding in the provider's `register()` method:
   - Use `bind()` for stateful services (new instance per resolution)
   - Use `singleton()` for stateless services (shared instance)
   - Use `instance()` for pre-built objects
   - Use Closure for custom resolution logic
5. Verify the concrete class actually implements the interface
6. Test that `app(Interface::class)` returns an instance of the expected concrete
7. For consumer-specific implementations, use contextual `when()->needs()->give()` instead of global binding

## Validation Checklist
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers (not all in AppServiceProvider)
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies exist
- [ ] Closure bindings are kept in provider `register()` methods
- [ ] Concrete class implements the interface it is bound to
- [ ] No interface is bound to itself (`bind(I::class, I::class)`)
- [ ] Contextual bindings are used when different consumers need different implementations

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface type-hinted without binding | Register `bind()` for the interface |
| Runtime type error | Concrete doesn't implement the interface | Change concrete to implement the interface |
| Different consumer gets wrong impl | Global binding overrides contextual | Use `when()->needs()->give()` for contextual override |
| Late binding has no effect | Binding registered in `boot()` after consumer resolved | Move to `register()` method |
| Infinite loop on resolution | Interface bound to itself | Change to `bind(I::class, Concrete::class)` |

## Decision Points
- **`bind()` vs `singleton()`**: Use `bind()` for services with per-request mutable state; use `singleton()` for stateless services (loggers, HTTP clients, cache managers)
- **Closure vs class name**: Use class name string for simple `new Concrete()`; use Closure for custom construction logic or configuration
- **Global vs contextual binding**: Use global for the default implementation; use contextual `when()->needs()->give()` when specific consumers need different concretes

## Performance Considerations
- Binding lookup is O(1) — array index on `$bindings[Interface::class]`
- Singleton bindings resolve once — subsequent calls return cached instance
- Closure bindings execute the closure on every resolution (unless singleton)
- Contextual binding lookup adds O(n) on contextual bindings for that consumer
- Fat Closures with complex logic should be extracted to factory classes

## Security Considerations
- Interface bindings control which concrete is used — review third-party package bindings to ensure no malicious concrete substitution
- Binding interfaces to untrusted class names (user-provided) can lead to arbitrary code execution
- For auth/guard interfaces, ensure bound concrete implements proper access controls
- In multi-tenant apps, use contextual binding for tenant-specific implementations

## Related Rules
- Bind All Interfaces in Service Providers
- Use Singleton Binding for Stateless Services
- Use Contextual Binding for Consumer-Specific Implementations
- Do Not Create Concrete-to-Concrete Bindings
- Do Not Self-Bind Interfaces
- Avoid Fat Closure Bindings
- Validate That Bound Concrete Implements the Interface

## Related Skills
- Configure Auto-Resolution for Concrete Classes
- Apply Constructor Injection for Explicit Dependencies
- Apply Contextual Binding for Consumer-Specific Implementations

## Success Criteria
- Every interface type-hinted in a constructor has a corresponding binding in a service provider
- Bindings are organized by domain in dedicated service providers
- Stateless interface bindings use `singleton()` for shared instances
- No concrete-to-concrete redundant bindings exist
- Contextual bindings handle consumer-specific implementation requirements
- All bound concretes are validated to implement their respective interfaces
