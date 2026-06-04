# Skill: Apply Method Injection for Action-Specific Dependencies

## Purpose
Resolve and inject dependencies at the method-call level via `Container::call()` for controller actions, event listeners, service provider `boot()` methods, and route closures — providing fine-grained dependency provision only where needed.

## When To Use
- Controller action methods that need request-specific services or route parameters
- Event listener `handle()` methods — the event object plus additional services
- Service provider `boot()` methods — access framework services without constructor injection
- Route closures — type-hinted params resolved by container
- Command `handle()` methods for command-specific services

## When NOT To Use
- When the same dependency is used across multiple methods — use constructor injection instead
- In middleware `handle()` methods — the signature is fixed (`$request, $next`)
- In hot paths where Reflection overhead on every call is costly
- For dependencies that must be serializable (queued jobs) — use constructor injection

## Prerequisites
- Understanding of `Container::call()` and `BoundMethod` class mechanics
- Knowledge of parameter resolution order: explicit overrides → type-hinted classes → primitives → defaults
- Familiarity with route model binding positional resolution

## Inputs
- Method or callable where injection is needed
- List of type-hinted parameters to be resolved by the container
- Runtime parameters (route bindings, explicit overrides) that should NOT be resolved by container
- Framework entry point (controller action, event listener, provider `boot()`, route closure)

## Workflow
1. Identify dependencies used by only one method (candidates for method injection)
2. Add type-hints for container-resolved parameters in the method signature
3. Place container-resolved parameters BEFORE runtime parameters (route bindings): `show(OrderService $service, Order $order)`
4. Ensure every injected parameter has an explicit class/interface type-hint
5. For shared dependencies (used across multiple methods), move to constructor injection
6. For listener methods, inject the event and services in `handle()` — not the constructor
7. For service providers, inject framework services in `boot()` method signature
8. For middleware, use constructor injection — never add extra params to `handle()`
9. Limit method-injected parameters to 3-4 to keep signatures readable

## Validation Checklist
- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for payload, method injection for services
- [ ] Controller actions have container-resolved params before route binding params
- [ ] All injected method parameters have explicit class/interface type-hints
- [ ] Service provider `boot()` uses method injection instead of `$this->app->make()`
- [ ] No method has more than 3-4 injected parameters

## Common Failures
| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Parameter receives route binding value | Container-resolved param after route binding in signature | Reorder: container params first, route params last |
| Parameter not resolved (null/default) | Missing type-hint on injected parameter | Add explicit class/interface type-hint |
| Middleware type error | Extra type-hinted params in `handle()` method | Move to constructor injection |
| Listener service not available at dispatch | Service injected in listener constructor | Move to `handle()` method signature |
| Per-request Reflection overhead | Method injection for hot-path endpoints | Move shared deps to constructor injection |

## Decision Points
- **Constructor vs method injection**: Constructor for multi-method shared deps; method injection for single-method action-specific deps
- **Method injection in controllers vs services**: Controllers benefit from method injection (different actions need different deps); services should always use constructor injection
- **Listener constructor vs handle()**: Always use method injection in `handle()` — constructor injection resolves too early

## Performance Considerations
- `Container::call()` uses Reflection on every invocation — no caching of parameter metadata
- Controller action injection adds ~10-50µs per request for Reflection
- `BoundMethod` creates intermediate Reflection objects on each call
- For high-throughput endpoints, move method-injected services to constructor injection
- In Octane, method injection cost is per-request but negligible (microseconds)

## Security Considerations
- Method injection resolves type-hinted classes from the container — ensure services have proper access controls
- The `$parameters` override array can pass user input — validate before passing to `call()`
- Controller action injection runs after middleware — auth and authorization have already executed
- Avoid injecting sensitive services into public methods callable from untrusted contexts

## Related Rules
- Use Method Injection for Action-Specific Dependencies Only
- Do Not Use Method Injection in Middleware handle()
- Order Parameters: Container-Resolved First, Runtime Last
- Always Type-Hint Method-Injected Parameters
- Avoid Method Injection for Dependencies Used in Multiple Methods
- Avoid Method Injection in Hot Paths
- Use Method Injection for Service Provider boot() Methods

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Select Injection Strategy by Class Type
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- Shared dependencies use constructor injection; single-use deps use method injection
- Controller action signatures have container-resolved params before route bindings
- Listeners inject services in `handle()` — constructors are parameterless
- Middleware uses constructor injection with clean `handle($request, $next)` signatures
- Service provider `boot()` methods use method injection for framework services
