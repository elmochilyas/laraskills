# Skill: Inject Dependencies via Method Parameters

## Purpose
Resolve dependencies at method-invocation time using `Container::call()`, injecting type-hinted parameters into controller actions, event listeners, job handlers, and service provider `boot()` methods — keeping constructors lean.

## When To Use
- Controller actions needing services only for a single method
- Event listeners that need specific services without constructor injection
- Job handlers with dependencies specific to the `handle()` method
- Service provider `boot()` methods needing access to specific services
- Route closures for rapid prototyping

## When NOT To Use
- For dependencies used across multiple methods — inject in constructor instead
- In middleware `handle()` methods — signature is fixed
- In hot paths where per-call Reflection overhead is costly
- For dependencies that must be serialized with queued jobs

## Prerequisites
- Understanding of `Container::call()` and `BoundMethod` parameter resolution
- Knowledge of parameter ordering: container-resolved first, runtime parameters last
- Familiarity with route model binding positional resolution

## Inputs
- Method signature with type-hinted parameters
- Callable (controller action, listener, closure, provider `boot()`)
- Optional: explicit parameter overrides array for runtime values

## Workflow
1. Identify dependencies used by only one method — candidates for method injection
2. Add type-hints for container-resolved parameters in the method signature
3. Place container-resolved parameters BEFORE route binding parameters: `show(OrderService $service, Order $order)`
4. Ensure every injected parameter has an explicit class/interface type-hint
5. For shared dependencies (used across multiple methods), refactor to constructor injection
6. For listeners, inject in `handle()` method — never in constructor
7. For service providers, inject framework services in `boot()` method signature
8. For middleware, use constructor injection (not method injection in `handle()`)
9. Limit injected parameters to 3-4 per method — group related services if needed

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
| Parameter receives route binding value | Container-resolved param after route binding | Reorder: container params first, route params last |
| Parameter not resolved (null/default) | Missing type-hint on injected parameter | Add explicit class/interface type-hint |
| Middleware type error | Extra type-hinted params in `handle()` | Move to constructor injection |
| Listener service not available at dispatch | Service injected in listener constructor | Move to `handle()` method signature |
| Per-request Reflection overhead | Method injection for hot-path endpoints | Move shared deps to constructor injection |

## Decision Points
- **Constructor vs method injection**: Constructor for shared multi-method deps; method injection for single-method action-specific deps
- **Method injection in controllers vs services**: Controllers benefit from method injection; services should always use constructor injection
- **Listener constructor vs handle()**: Always method injection in `handle()` — constructor injection resolves too early

## Performance Considerations
- `Container::call()` uses Reflection on every invocation — no caching
- Controller action injection adds ~10-50µs per request for Reflection
- `BoundMethod` creates intermediate Reflection objects on each call
- For high-throughput endpoints, move method-injected services to constructor injection
- Pre-resolved constructor dependencies reduce need for method injection

## Security Considerations
- Method injection resolves type-hinted classes from the container — ensure services have proper access controls
- The `$parameters` override array can pass user input — validate before passing to `call()`
- Controller action injection runs after middleware — auth and authorization executed
- Avoid injecting sensitive services into public methods callable from untrusted contexts

## Related Rules
- Use Constructor Injection for Shared Dependencies, Method Injection for Action-Specific
- Do Not Use Method Injection in Middleware handle()
- Order Parameters: Container-Resolved First, Runtime Last
- Always Type-Hint Method-Injected Parameters
- Prefer Constructor Injection for Hot-Path Endpoints
- Use Method Injection for Listener handle() Methods
- Avoid Excessive Method Injection Parameters

## Related Skills
- Apply Constructor Injection for Explicit Dependencies
- Select Injection Strategy by Class Type
- Test Container-Dependent Code with Instance Binding

## Success Criteria
- Shared dependencies use constructor injection; single-use deps use method injection
- Controller actions have container-resolved params before route bindings
- Listeners inject services in `handle()` with clean constructor
- Middleware uses constructor injection with fixed `handle($request, $next)` signature
- Service provider `boot()` uses method injection for framework services
