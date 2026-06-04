# Skill: Manage Service Container Bindings and Resolution

## Purpose
Use Laravel's service container (`Illuminate\Container\Container`) as the central dependency manager — register bindings, resolve services, control lifecycle (singleton vs transient), and leverage auto-resolution for maintainable dependency injection.

## When To Use
- Any time a class needs services resolved — let the container handle construction
- Managing shared instances (database connections, cache managers, loggers)
- Implementing dependency injection — the container is the injection mechanism
- In tests, swapping real implementations with mocks via `instance()`

## When NOT To Use
- For simple data objects (DTOs) — `new UserData(...)` is fine without the container
- In hot loops — repeated `make()` calls add overhead; pre-resolve or use direct construction
- When you need to bypass the container's lifecycle — use `new` for objects that don't need injection

## Prerequisites
- Understanding of the container's key methods: `bind()`, `singleton()`, `instance()`, `make()`, `call()`
- Knowledge of service provider registration and lifecycle (`register()` vs `boot()`)
- Familiarity with the resolution chain: bindings → instances → contextual → auto-resolution → exception

## Inputs
- Abstract name (interface, class name, or string key)
- Concrete implementation (class name, Closure, or pre-built object)
- Lifecycle requirement (shared/non-shared)
- Service provider class for registration

## Workflow
1. Identify services that need container registration — interfaces, concrete classes with lifecycle needs, primitive values
2. Choose the appropriate registration method:
   - `bind()` for new instance per resolution
   - `singleton()` for shared instance (stateless services)
   - `instance()` for pre-built objects (test mocks, pre-configured services)
3. Register all bindings in service provider `register()` methods — never in routes, middleware, or controllers
4. Prefer interface-to-concrete bindings over concrete-to-concrete (auto-resolution handles concretes)
5. Use `when()->needs()->give()` contextual binding for consumer-specific implementations
6. Keep Closure bindings simple — extract complex factory logic to dedicated factory classes
7. Never modify bindings at runtime after the application has booted
8. In tests, use `instance()` to override bindings — restore state in `tearDown()`

## Validation Checklist
- [ ] All interface bindings are registered in service provider `register()` methods
- [ ] No `app()` calls exist in business logic (services, repositories, action classes)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] No binding registration outside of service providers
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies
- [ ] Container bindings are documented and organized by domain/provider
- [ ] No class injects `Container $container` for pulling dependencies

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `TargetInterfaceNotInstantiableException` | Interface used without binding | Register `bind()` in provider |
| State leaking across requests | Singleton with mutable properties | Make singleton stateless or use `scoped()` |
| Binding has no effect | Registered in `boot()` after consumer resolved | Move to `register()` |
| Contextual binding ignored | Registered after consumer already resolved | Ensure registration in `register()` before resolution |
| Runtime behavior change | Binding modified mid-request via `instance()` | Never modify bindings at runtime |

## Decision Points
- **`bind()` vs `singleton()`**: Use `bind()` for per-request mutable state; use `singleton()` for stateless services
- **Closure binding vs class name**: Use class name for simple `new Concrete()`; use Closure for configuration-driven construction
- **Interface vs concrete binding**: Always prefer interface bindings for swappable dependencies; let auto-resolution handle concrete classes

## Performance Considerations
- `make()` with explicit binding: O(1) lookup, instantiation cost depends on dependency chain
- `make()` with auto-resolution: Reflection overhead per-resolution (~0.01-0.05ms per class)
- Singleton resolution: Full cost paid once, subsequent calls near-zero
- `instance()`: Lowest overhead — object is pre-built and stored in array
- OpCache does not optimize Reflection — it is runtime introspection

## Security Considerations
- The container resolves any bound class — ensure bindings don't expose internal services
- Container instances should not be passed to untrusted code (service locator exposure)
- In multi-tenant apps, clear scoped singletons between tenants to prevent data leakage
- Binding to untrusted concretes may lead to arbitrary code execution

## Related Rules
- Register All Bindings in Service Providers
- Prefer Singleton for Stateless Services
- Bind Interfaces, Not Concretions
- Never Use app() in Business Logic
- Never Inject Container as a Dependency
- Avoid Over-Binding — Let Auto-Resolution Handle Concretes
- Do Not Modify Container Bindings at Runtime

## Related Skills
- Register Interface Bindings in Service Providers
- Apply Constructor Injection for Explicit Dependencies
- Apply Contextual Binding for Consumer-Specific Implementations
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- All service bindings are centralized in service provider `register()` methods
- Stateless services use `singleton()` for memory efficiency
- Business logic classes have zero `app()` calls in method bodies
- No class injects `Container` as a dependency for pulling services
- Container state is clean between tests (via `refreshApplication` or manual cleanup)
