# Skill: Convert Singletons to Scoped Bindings for Per-Request Isolation

## Purpose
Migrate leaky singleton bindings that hold per-request state to `scoped()` bindings, register them correctly in `OctaneSandbox` providers, and verify per-request isolation with identity assertions.

## When To Use
- Remediating singleton state leaks identified in binding audit
- Registering new services that hold per-request state (auth, tenant, session)
- Converting legacy `singleton()` + `forgetInstance()` patterns to `scoped()`

## When NOT To Use
- Truly stateless services (config readers, HTTP clients, loggers) — keep as singletons
- Global infrastructure (database connections, event dispatchers, cache) — must remain singletons
- Value objects with no container dependencies — create with `new`
- Per-coroutine state in Swoole — use coroutine-ID maps instead

## Prerequisites
- Service binding audit identifying which singletons hold per-request mutable state
- Understanding of `OctaneSandbox` contract
- Octane installed in development/staging environment
- PHPUnit or Pest for writing identity assertion tests

## Inputs
- List of singletons to convert from binding audit
- Target runtime (Swoole/RoadRunner/FrankenPHP)
- Service provider files that register the bindings

## Workflow
1. Identify the provider file where the singleton is registered — determine if it needs to implement `OctaneSandbox`
2. If the provider does not implement `OctaneSandbox` and the scoped binding needs per-request re-registration, implement the contract: move the `scoped()` call to the `boot()` method (runs per-sandbox) — keep master container logic in `register()`
3. Change `$this->app->singleton(Contract::class, Concrete::class)` to `$this->app->scoped(Contract::class, Concrete::class)` — prefer class-name registration for performance
4. If the binding requires runtime configuration, use closure-based scoped registration: `$this->app->scoped(Contract::class, fn($app) => new Concrete($app->make(...)))`
5. Write scoped identity tests: assert `app(Service::class)` returns the same instance within a single request, and different instances after `app()->forgetScopedInstances()`
6. Verify scoped dependencies don't leak: if the scoped binding depends on a mutable singleton, the singleton still leaks — trace the dependency graph

## Validation Checklist
- [ ] Each converted binding is registered via `scoped()`, not `singleton()`
- [ ] Provider implements `OctaneSandbox` if per-request re-registration is needed
- [ ] `scoped()` registered in `boot()` (sandbox context) not `register()` (master context)
- [ ] Class-name registration used where possible; closures used only for runtime config
- [ ] Identity test passes: same instance within request, different across "requests"
- [ ] Dependency graph traced — no transitive contamination from mutable singleton dependencies
- [ ] No global infrastructure services (DB connections, event dispatchers) converted to scoped

## Common Failures
- Registering `scoped()` in master container's `register()` without `OctaneSandbox` — scoped lifecycle never activates, binding behaves as singleton
- Converting database connections and connection pools to scoped — connection storms on every request
- Expecting per-coroutine isolation from scoped — scoped is per-request, not per-coroutine
- Using closure-based registration when class-name would work — missing opcode optimization
- Forgetting `forgetScopedInstances()` in test setup — identity assertions always pass because sandbox never flushed

## Decision Points
- `OctaneSandbox` vs manual `boot()` registration: implement the contract if the provider has per-request logic; otherwise register scoped in master `register()` is sufficient for bindings that don't need per-sandbox re-registration
- Class-name vs closure: prefer class-name for performance; use closure when the binding depends on request data or runtime configuration
- Scoped wrapper vs full conversion: if the service is used widely and changing to scoped breaks assumptions, create a scoped wrapper that delegates to a singleton

## Performance Considerations
- Each scoped binding adds ~0.5-2ms per request for instantiation + sandbox registration
- 10 scoped bindings add ~5-20ms total per request — prioritize leaky singletons, don't blindly convert all
- Class-name registration is faster than closures — closures prevent opcode optimization
- Expensive scoped bindings: consider singleton + state-reset pattern instead if the service creates 50+ dependent objects

## Security Considerations
- Scoped binding escalation: a scoped binding depending on a leaking singleton still exposes the singleton's leak — scoped masks the symptom for direct consumers but transitive dependencies remain
- Premature destruction: scoped destructor runs during sandbox flush — if resolved again in a tick, gets new instance with missing state
- Resource handle loss: connection pools via scoped lose handles on flush, causing connection storms — prefer singleton pool + scoped connection wrapper

## Related Rules
- Default to scoped for any service interacting with per-request data (05-rules.md)
- Prefer class-name registration over closures for scoped bindings (05-rules.md)
- Register scoped bindings inside `OctaneSandbox` providers (05-rules.md)
- Test scoped isolation with identity assertions (05-rules.md)
- Never use `scoped()` for global infrastructure services (05-rules.md)
- Use coroutine-ID maps, not scoped, for per-coroutine state in Swoole (05-rules.md)

## Related Skills
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)
- Identify Singleton State Leaks (singleton-state-leaks)
- Generate Service Binding Inventory (service-binding-audit)

## Success Criteria
- All identified leaky singletons holding per-request state are converted to `scoped()`
- Scoped bindings registered in correct provider context (`OctaneSandbox.boot()` where needed)
- Identity assertions verify per-request isolation with zero false positives
- No global infrastructure services accidentally converted to scoped
- Transitive dependency graph verified — no contamination from mutable singleton dependencies
- Scoped overhead is measured and documented with no unexpected performance regression
