# Skill: Configure the Service Container

## Purpose
Set up and configure Laravel's service container in service providers, registering bindings, aliases, and lifecycle hooks correctly to establish the application's dependency injection graph.

## When To Use
- Building a new Laravel application or package
- Registering services in `ServiceProvider::register()` or `boot()`
- Configuring binding lifecycle (shared vs transient, aliases, tags)
- Setting up the container for unit tests or package that works without full Laravel

## When NOT To Use
- Resolving services inside business logic (use constructor injection)
- Modifying the container from controllers, middleware, or commands
- Overriding `Application` class to change container behavior

## Prerequisites
- PHP class autoloading basics
- Service provider lifecycle (register vs boot)

## Inputs
- Service class names (abstract → concrete mappings)
- Binding type decisions (shared, scoped, transient)
- Optional: alias names, tag names, contextual rules

## Workflow
1. Create or update a service provider extending `ServiceProvider`
2. In `register()`: register bindings using `$this->app->bind()`, `->singleton()`, `->scoped()`
3. If aliases are needed: call `$this->app->alias()` in the same provider after the binding
4. If tagging is needed: call `$this->app->tag()` after bindings
5. In `boot()`: register resolution callbacks and extenders (after all bindings are registered)
6. If extending a core framework service: register in `boot()` with documented ordering
7. Type-hint `\Illuminate\Contracts\Container\Container` for packages (not `Application`)

## Validation Checklist
- [ ] Bindings registered in `register()`, not `boot()`
- [ ] Resolution callbacks and extenders registered in `boot()`
- [ ] Alias registered in same provider as target binding
- [ ] Bindings tagged after they are registered
- [ ] No `app()->make()` calls inside business logic
- [ ] Container access via constructor injection, not `resolve()` helper

## Common Failures
- Registering bindings in `boot()` — other providers' `register()` methods may not see the binding
- Using `app()->make()` inside controllers instead of constructor injection
- Extending `Application` class to add container functionality — breaks on Laravel version upgrades
- Binding concrete-to-concrete instead of interface-to-concrete — no abstraction benefit

## Decision Points
- `Container` vs `Application` type-hint: use `Container` interface for packages, `Application` only when framework-specific methods are needed
- `register()` vs `boot()`: bindings and aliases go in `register()`; callbacks, extenders, and code dependent on other providers go in `boot()`

## Performance Considerations
- Auto-resolution is the slowest path — prefer explicit bindings for hot-path services
- `$instances` cache grows unboundedly in Octane — monitor instance count
- Self-binding `$app->bind(MyClass::class)` enables extenders without a closure

## Security Considerations
- Avoid capturing secrets in closure outer scopes — use `config()` or `$app->make()`
- `$app->make()` can resolve any registered service — ensure authorization is not bypassed through container access

## Related Rules
- Register All Bindings in Service Providers
- Understand Container vs. Application Inheritance
- Prefer Explicit Bindings Over Auto-Resolution for Production Hot Paths
- Audit Container Instance Growth in Octane Deployments

## Related Skills
- Select the Correct Binding Type
- Resolve Services Correctly with make()
- Register and Resolve Container Aliases

## Success Criteria
- All service bindings registered in appropriate service providers
- No service locator pattern in business code
- Container configuration works under both FPM and Octane

---

# Skill: Debug Binding Resolution Errors

## Purpose
Diagnose and resolve common container errors — unresolvable dependencies, wrong implementations, and lifecycle mismatches — by tracing the resolution chain and container state.

## When To Use
- When `BindingResolutionException` is thrown
- When `make()` returns a different implementation than expected
- When a service has stale or incorrect dependencies
- When testing shows unexpected resolution behavior

## When NOT To Use
- When the issue is clearly a missing binding registration (use Configure the Service Container)
- When the issue is in auto-resolution specifically (use Debug Auto-Resolution Failures)

## Prerequisites
- Container Fundamentals
- Binding Resolution chain knowledge

## Inputs
- Exception message or unexpected behavior description
- Abstract name and expected concrete class
- Build stack trace if available

## Workflow
1. Read the exception or behavior description
2. Trace the resolution chain in order:
   - Is the abstract an alias? Resolve to canonical: `$app->getAlias($abstract)`
   - Is there a cached instance? `$app->isShared($abstract)` — forget if stale
   - Is there a contextual binding? Check `$app->getContextual()` for the consumer
   - What does the binding say? `$app->getBindings()[$abstract]`
   - Is auto-resolution possible? Check `(new ReflectionClass($abstract))->isInstantiable()`
3. Check whether the binding was registered before it was used — compare provider ordering
4. If stale cached instance: `$app->forgetInstance($canonical); $app->make($abstract)`
5. If wrong contextual binding: fix consumer class name or abstract in `when()->needs()->give()`
6. Add CI test that resolves the binding and asserts the expected type

## Validation Checklist
- [ ] Resolution chain traced to the failure point
- [ ] Cached instances cleared if stale
- [ ] Contextual binding uses correct consumer class name
- [ ] Binding definition maps to expected concrete
- [ ] CI test confirms correct resolution

## Common Failures
- Alias points to unexpected abstract — resolution returns wrong type
- Cached singleton from earlier test pollutes current resolution
- Contextual binding has typo in consumer class string — rule silently ignored
- Service provider order changed — binding no longer available when needed

## Decision Points
- `forgetInstance()` vs rebind: use `forgetInstance()` when the instance is stale but the definition is correct; rebind when the definition needs to change
- Fix alias vs fix binding: if the alias points to the wrong canonical, fix the alias; if the canonical binding is wrong, fix the binding

## Performance Considerations
- Debugging with `dd()` or logging adds no production overhead
- CI test adds ~50-500ms to test suite — acceptable for safety

## Security Considerations
- Exception messages may reveal internal service names — sanitize in production error handlers
- Avoid exposing `getBindings()` output in production debugging endpoints

## Related Rules
- Understand Resolution Chain Order for Debugging
- Catch BindingResolutionException at the Kernel Level
- Use $app->bound() Before Resolving in Conditional Paths

## Related Skills
- Configure the Service Container
- Resolve Services Correctly with make()
- Debug Auto-Resolution Failures

## Success Criteria
- Root cause identified in the resolution chain
- Fix applied at the correct layer (alias, cache, binding, or auto-resolution)
- CI test prevents regression
