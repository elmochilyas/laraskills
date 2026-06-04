# Skill: Resolve Services Correctly with make()

## Purpose
Use the correct resolution method (`make()`, `makeWith()`, or constructor injection) to obtain service instances while preserving container lifecycle behavior.

## When To Use
- Resolving services in factory classes or boot-time setup
- Passing primitive parameters to constructors at resolution time
- Ensuring services receive extenders and resolution callbacks

## When NOT To Use
- Inside controllers, jobs, or business logic (use constructor injection instead)
- When you need to bypass extenders/callbacks (never — use `make()` always)
- When the service class has primitive parameters — use `makeWith()` or a factory

## Prerequisites
- Container Fundamentals
- Binding Types

## Inputs
- Abstract name (class name, interface name, or string key)
- Optional associative array of primitive parameter overrides
- Optional: binding type expectation (shared vs transient)

## Workflow
1. Determine if the service needs primitive parameters: inspect constructor signature
2. If no primitives needed: `$service = $this->app->make(Abstract::class)`
3. If primitives needed with defaults: use `$this->app->makeWith(Abstract::class, ['param' => 'value'])`
4. If primitives needed without defaults: register explicit binding instead (preferred)
5. If service should be pre-resolved for performance: call `$app->make()` in `boot()`
6. Verify resolved instance is the expected type using `assertInstanceOf()`

## Validation Checklist
- [ ] `make()` used — never `build()` in application code
- [ ] `makeWith()` always called with named associative arrays, never positional
- [ ] Services resolved via constructor injection, not `app()->make()` inside methods
- [ ] Hot-path services optionally pre-resolved during boot

## Common Failures
- `build()` used instead of `make()` — bypasses extenders, callbacks, and caching
- Positional array passed to `makeWith()` — parameters silently ignored
- `make()` called inside business logic — creates service locator anti-pattern
- `make()` called for singleton — expects new instance, gets cached instance

## Decision Points
- `make()` vs `makeWith()`: use `makeWith()` only when primitive overrides are needed per-call
- Direct resolution vs constructor injection: always prefer constructor injection in application code
- Self-binding vs closure binding: self-binding `$app->bind(MyClass::class)` enables extenders without closure

## Performance Considerations
- Each `make()` call for shared singleton is O(1) after first resolution
- `makeWith()` adds ~2-5μs parameter matching overhead
- Pre-resolve hot services during boot to front-load reflection cost

## Security Considerations
- Do not call `make()` with user-controlled abstract names (class injection vulnerability)
- Log resolution failures at kernel level, sanitize in production

## Related Rules
- Use make() for All Application-Level Resolution
- Use makeWith() with Named Arrays, Not Positional Parameters
- Inject Dependencies via Constructor, Never Resolve Inside Methods
- Pre-Resolve Hot Services During Boot to Front-Load Cost

## Related Skills
- Debug Resolution Chain Failures
- Configure the Service Container
- Select the Correct Binding Type

## Success Criteria
- All services resolved via `make()` in factories and `makeWith()` for parameterized cases
- No `build()` calls in application code
- Services receive extenders, resolution callbacks, and correct caching

---

# Skill: Debug Resolution Chain Failures

## Purpose
Trace and resolve unexpected resolution behavior — wrong implementation returned, resolution exceptions, or cached instances not matching expectations.

## When To Use
- When `BindingResolutionException` is thrown during resolution
- When `make()` returns a different implementation than expected
- When a cached singleton returns stale data
- When contextual bindings appear ignored

## When NOT To Use
- When the issue is clearly a missing binding registration (use Resolve Services Correctly first)
- When the issue is an auto-resolution failure (use Debug Auto-Resolution Failures)

## Prerequisites
- Container Fundamentals
- Binding Resolution
- Resolution Chain order

## Inputs
- Abstract name being resolved
- Expected implementation
- Actual behavior (exception, wrong type, stale instance)

## Workflow
1. Start with the abstract name and trace the resolution chain:
   - Alias normalization: `$app->getAlias($abstract)` — is it an alias?
   - Contextual bindings: `$app->getContextual()` — is there a contextual rule?
   - Instances cache: `$app->isShared($abstract)` — is there a cached instance?
   - Bindings: `$app->getBindings()` — what's the registered concrete?
   - Auto-resolution: is the class instantiable?
2. If the wrong implementation is returned, identify which step intercepted:
   - Alias redirects to a different abstract
   - Contextual binding overrides the default
   - Cached singleton returns old instance from a previous resolution
   - Binding definition references a different concrete class
3. If exception is thrown, check build stack in exception message
4. Fix the root cause: update alias, forget instance, rebind, or remove contextual rule
5. Test resolution: `$this->assertInstanceOf(Expected::class, $app->make($abstract))`

## Validation Checklist
- [ ] Alias chain resolves to expected canonical abstract
- [ ] No stale cached instances in `$instances`
- [ ] Contextual binding uses correct consumer class name
- [ ] Binding definition maps to correct concrete
- [ ] Auto-resolution path is instantiable (no interface/abstract without binding)

## Common Failures
- Alias points to wrong abstract — resolution returns wrong type
- Cached singleton from previous test pollutes current resolution
- Contextual binding has typo in consumer class name — rule silently ignored
- `forgetInstance()` called on alias instead of canonical name — instance not cleared

## Decision Points
- If multiple fix options exist (fix alias vs fix binding vs forget instance), choose the least invasive
- If stale singleton is the issue: use `forgetInstance($canonical)` + re-resolve

## Performance Considerations
- Resolution chain tracing is a debugging activity — no production impact
- After fix, verify with micro-benchmark that resolution behavior matches expectations

## Security Considerations
- `getBindings()` exposes the full binding map — limit access in production debugging
- Exception messages from `BindingResolutionException` reveal internal service names

## Related Rules
- Understand Resolution Chain Order for Debugging
- Use Canonical Name for bound() and forgetInstance() Checks
- Catch BindingResolutionException at the Kernel Level

## Related Skills
- Debug Auto-Resolution Failures
- Resolve Services Correctly with make()
- Register and Resolve Container Aliases

## Success Criteria
- Resolution returns expected implementation every time
- No stale cached instances
- Exception messages provide actionable debugging context
