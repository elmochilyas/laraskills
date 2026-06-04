# Skill: Bind and Resolve Services in Container

## Purpose
Register services (bindings, singletons, contextual bindings) into the service container and resolve them using constructor injection, following the correct binding strategies for each service type.

## When To Use
- Registering a new interface-to-implementation mapping
- Creating a singleton for a stateless service
- Implementing contextual binding for different consumers needing different implementations
- Adding a service provider to the application

## When NOT To Use
- For concrete classes that auto-resolve via reflection (no binding needed)
- For value objects and DTOs (construct with `new`)
- For static utility classes (no container resolution needed)
- After application boot (bindings must be registered before boot)

## Prerequisites
- Understanding of the container's 5-step resolution priority
- Service provider created to host binding registrations
- Interface defined for polymorphic dependencies (preferred)

## Inputs
- Service abstract (interface or class name)
- Service concrete (implementation class name or closure)
- Binding type: `bind()`, `singleton()`, `scoped()`, or `instance()`
- Contextual binding rules (if needed)

## Workflow
1. Determine the binding type:
   - Stateless service (repository, gateway, logger): use `$this->app->singleton()`
   - Stateful service (needs fresh instance per resolution): use `$this->app->bind()`
   - Existing object (config, pre-built instance): use `$this->app->instance()`
   - Request-scoped singleton (Laravel 11+): use `$this->app->scoped()`
2. Determine if contextual binding is needed:
   - Different consumers need different implementations: use `$this->app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)`
   - Single consumer, single implementation: use simple `bind()` or `singleton()`
3. Register in the appropriate service provider's `register()` method
4. Resolve via constructor injection in the consuming class:

```php
class OrderController
{
    public function __construct(
        private OrderRepository $orders,      // auto-resolved concrete
        private PaymentGateway $gateway,      // resolved via binding
    ) {}
}
```

## Validation Checklist
- [ ] Interfaces are bound to implementations (concrete classes auto-resolve — no redundant binding)
- [ ] Stateless services use `singleton()` or `scoped()` (not `bind()`)
- [ ] Contextual bindings are used when different consumers need different implementations
- [ ] All bindings are registered in service provider `register()` methods (not after boot)
- [ ] Value objects and DTOs are constructed with `new`, not resolved from the container
- [ ] No `app()->make()` calls exist in business logic classes (use constructor injection)
- [ ] No circular dependencies exist between constructor-injected classes
- [ ] Container is not referenced in serialized job payloads

## Common Failures
- Binding concrete-to-concrete redundantly (`$app->bind(Service::class, Service::class)`) — auto-resolution already works
- Using `bind()` for stateless services — wasteful object construction on every resolution
- Using contextual binding when simple binding suffices — overcomplication
- Binding after application boot — registration ignored or unpredictable behavior
- Resolving value objects from container — unnecessary reflection overhead

## Decision Points
- `bind()` vs `singleton()` vs `scoped()`? Use `bind()` for stateful, `singleton()` for stateless, `scoped()` for request-scoped state (Laravel 11+)
- Interface vs concrete class binding? Always bind interfaces; concrete classes auto-resolve
- Closure vs class-name binding? Use class-name for simple construction; closure for complex construction logic

## Performance Considerations
- Singleton resolution is O(1) after first resolution — stateless services should be singletons
- Non-singleton resolution runs reflection every time — cache resolved instances in hot paths
- Closure bindings avoid reflection overhead — use for complex construction
- Resolution via constructor injection is faster than `app()->make()` (no method dispatch)

## Security Considerations
- Never inject untrusted user data through the container — validate before passing to resolved services
- Singleton services must be stateless — per-request state leaks across requests in Octane/RoadRunner
- Container access (`$app`) must never be exposed to untrusted code — attacker can override services
- Clean up instance bindings (`forgetInstance()`) between tests to prevent mock leakage

## Related Rules
- Bind Interfaces, Not Concrete Classes (05-rules.md)
- Use Constructor Injection Over Container Resolution in Application Code (05-rules.md)
- Use Singletons for Stateless Services (05-rules.md)
- Never Use Container Resolution for Value Objects or DTOs (05-rules.md)
- Clean Up Instance Bindings Between Tests (05-rules.md)
- Never Reference Container in Serialized Job Payloads (05-rules.md)
- Avoid Circular Dependencies Through Constructor Injection (05-rules.md)

## Related Skills
- Skill: Keep register() Thin with Container Bindings
- Skill: Choose Between Facades and Constructor Injection
- Skill: Use Helpers in Controllers and Views

## Success Criteria
- All interfaces are explicitly bound to their implementations
- Stateless services use `singleton()`; stateful services use `bind()`
- Contextual bindings correctly differentiate consumer needs
- Business logic classes use constructor injection exclusively
- No circular dependencies exist in the dependency graph
- Instance bindings are cleaned up between tests
