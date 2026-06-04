# Skill: Map Interfaces to Concrete Implementations via Binding

## Purpose
Register interface-to-concrete mappings in service providers, enabling dependency inversion — consumers depend on abstractions while the container resolves the correct concrete at runtime, with lifecycle control (shared vs transient).

## When To Use
- Programming to interfaces for service and repository abstractions
- Swappable implementations for different environments or testing
- Strategy pattern with different concretes bound as needed
- Third-party packages providing interfaces that need concrete bindings
- Controlling lifecycle via singleton vs new instance per resolution

## When NOT To Use
- When the interface has one implementation with no foreseeable change — auto-resolution is simpler
- When the binding decision depends on runtime request data — use factory pattern
- For concrete-to-concrete bindings — redundant; auto-resolution handles it
- For classes that already work without binding (concrete type-hints with resolvable constructors)

## Prerequisites
- Understanding of `Container::$bindings` structure: `[Interface => ['concrete' => ..., 'shared' => bool]]`
- Knowledge of service provider `register()` vs `boot()` timing
- Familiarity with `bind()`, `singleton()`, `instance()`, and Closure binding patterns

## Inputs
- Interface namespace (the abstraction contract)
- Concrete class namespace (the implementation)
- Optional: lifecycle requirement (shared singleton vs new instance per resolution)
- Service provider class for registration

## Workflow
1. Create or identify the interface that defines the abstraction contract
2. Implement the interface with one or more concrete classes
3. Open the appropriate service provider (grouped by domain/feature)
4. Register the binding in `register()`:
   - `$this->app->bind(Interface::class, Concrete::class)` for transient
   - `$this->app->singleton(Interface::class, Concrete::class)` for shared
   - `$this->app->bind(Interface::class, Closure)` for custom resolution
5. Validate that the concrete class implements the interface
6. Use contextual binding when different consumers need different concretes
7. Keep Closure bindings simple — extract complex logic to factory classes
8. Verify with `app(Interface::class)` that the correct concrete is returned
9. For testing, override the binding with `$this->app->instance(Interface::class, $mock)`

## Validation Checklist
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies exist
- [ ] Closure bindings are kept in provider `register()` methods
- [ ] Concrete class implements the interface it is bound to
- [ ] No interface is bound to itself (`bind(I::class, I::class)`)
- [ ] Contextual bindings handle consumer-specific needs where applicable

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface type-hinted without binding | Register `bind()` for the interface |
| Runtime type error | Concrete doesn't implement the interface | Change concrete to implement interface |
| All consumers get same implementation | Global binding used when contextual needed | Use `when()->needs()->give()` |
| Binding has no effect | Registered in `boot()` after consumer resolved | Move to `register()` |
| Infinite loop on resolution | Interface bound to itself (`I::class, I::class`) | Change to `bind(I::class, Concrete::class)` |

## Decision Points
- **`bind()` vs `singleton()`**: Use `bind()` for stateful services needing fresh instances; use `singleton()` for stateless services (loggers, HTTP clients, cache managers)
- **Closure vs class name**: Use class name string for simple `new Concrete()`; use Closure for configuration-driven construction or constructor parameter customization
- **Global vs contextual binding**: Use global for the default implementation; use `when()->needs()->give()` for consumers needing a different implementation

## Performance Considerations
- Binding lookup is O(1) — array index on `$bindings[Interface::class]`
- Singleton bindings resolve once — subsequent calls return cached instance
- Closure bindings execute the Closure on every resolution (unless singleton)
- Contextual binding lookup adds O(n) on contextual bindings for that consumer
- Fat Closures with complex logic should be extracted to factory classes

## Security Considerations
- Interface bindings control which concrete is used — review third-party bindings for malicious substitution
- Binding interfaces to untrusted class names can lead to arbitrary code execution
- For auth/guard interfaces, ensure bound concrete implements proper access controls
- In multi-tenant apps, use contextual binding for tenant-specific implementations
- Do not override core framework bindings (app, events, config, router) in tests

## Related Rules
- Bind Interfaces in the Correct Service Provider
- Use Singleton for Stateless Interface Implementations
- Validate That the Concrete Implements the Interface
- Do Not Bind Concrete to Concrete
- Avoid Interface Explosion
- Keep Closure Bindings Simple

## Related Skills
- Manage Service Container Bindings and Resolution
- Apply Constructor Injection for Explicit Dependencies
- Apply Contextual Binding for Consumer-Specific Implementations
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- Every interface type-hinted in a constructor has a binding in a service provider
- Bindings are organized by domain in dedicated providers
- Stateless interface bindings use `singleton()` for shared instances
- No concrete-to-concrete redundant bindings exist
- All bound concretes implement their respective interfaces
- Contextual bindings handle consumer-specific implementation requirements
