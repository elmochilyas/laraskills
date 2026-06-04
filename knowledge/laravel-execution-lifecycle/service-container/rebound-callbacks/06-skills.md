# Skill: React to Binding Re-registrations with rebinding()

## Purpose
Register callbacks that fire when a container binding is re-registered after it has already been resolved, enabling services to react to configuration changes at runtime.

## When To Use
- Framework-level reactivity — services that must be notified when a binding changes
- Middleware/router synchronization (e.g., `syncMiddlewareToRouter()` when Kernel is rebound)
- Configuration-aware services that need to rebuild when config changes
- Test setup that must restore original bindings after mocking

## When NOT To Use
- Per-resolution service initialization (use `resolving()` instead)
- Octane production code where providers should not rebind mid-lifecycle
- When the binding is never expected to be resolved before rebinding (rebound won't fire)

## Prerequisites
- Container Fundamentals
- Binding Types
- Binding Resolution

## Inputs
- Abstract name to watch for rebinding
- Callback closure receiving `$app` and the new `$instance`
- Whether callback should fire immediately if binding is already resolved

## Workflow
1. Determine if `rebinding()` is appropriate — is this reacting to binding changes (not per-resolution config)?
2. Register the callback: `$this->app->rebinding(Abstract::class, function ($app, $instance) { ... })`
3. If the binding is already resolved, the callback fires immediately — ensure side effects are safe
4. Make the callback idempotent — replace/set rather than append/add
5. In `boot()` for production code, or dynamically in test setup
6. Verify: re-register the binding and confirm callback fires

## Validation Checklist
- [ ] Abstract must be resolved before rebinding for callback to fire
- [ ] Callback is idempotent — safe to fire multiple times
- [ ] `rebinding()` used, not manual `forgetInstance()` + `rebound()`
- [ ] Not used for per-resolution configuration (use `resolving()` instead)
- [ ] Not used in Octane request lifecycle code

## Common Failures
- Callback never fires — binding was never resolved before re-registration
- Callback fires but with stale dependencies — `rebound()` re-resolves but may return cached singletons
- Non-idempotent callback accumulates side effects on multiple rebounds
- `rebinding()` in `register()` before target is resolved — callback doesn't fire at expected time

## Decision Points
- `rebinding()` vs `resolving()`: use `rebinding()` for binding change detection, `resolving()` for per-resolution initialization
- Immediate callback vs deferred: use `rebinding()` when the callback must fire whether or not binding is already resolved

## Performance Considerations
- Zero runtime overhead in stable deployments (no binding changes)
- When triggered, `rebound()` calls full `make()` — re-resolves the entire dependency graph
- Each `rebinding()` registration stores a closure (~80 bytes)

## Security Considerations
- Rebound callbacks receive the new instance — avoid exposing sensitive data from old instance
- Re-resolution re-applies extenders and callbacks, preserving security decorations
- In tests, ensure rebound callbacks don't leak mock instances to production paths

## Related Rules
- Use rebinding() Instead of Manual forgetInstance() + rebound()
- Make Rebound Callbacks Idempotent
- Do Not Use rebinding() for Per-Resolution Configuration
- Avoid Rebinding in Octane Production Code

## Related Skills
- Configure Services at Resolution Time (resolving())
- Debug Rebound Callback Failures
- Implement Service Decoration via extend()

## Success Criteria
- Rebound callbacks fire at the correct time (after resolved binding is re-registered)
- Callbacks are idempotent and safe to fire multiple times
- No rebound callbacks used for per-resolution configuration

---

# Skill: Debug Rebound Callback Failures

## Purpose
Diagnose why rebound callbacks are not firing, firing at the wrong time, or producing unexpected side effects.

## When To Use
- When a `rebinding()` callback does not execute as expected
- When callbacks fire multiple times or accumulate side effects
- When debugging "callback never fires" issues
- When `forgetInstance()` + manual `rebound()` doesn't produce expected results

## When NOT To Use
- When the issue is a missing `resolving()` callback (use Understand Resolution Callback Execution Order)
- When the issue is a missing binding registration

## Prerequisites
- Rebound Callbacks
- Container resolved tracking

## Inputs
- Abstract name being watched for rebinding
- Callback registration code
- Steps to reproduce the expected rebinding scenario

## Workflow
1. Check if the abstract has been resolved before rebinding: `$app->resolved(Abstract::class)` — if false, rebound never fires
2. If not resolved: manually resolve once before re-registering: `$app->make(Abstract::class)`
3. If resolved but callback not firing: verify `rebinding()` was called before `bind()` re-registration
4. If callback fires but with wrong instance: check for stale cached singleton interference
5. If callback fires multiple times: check for duplicate `rebinding()` registrations (non-idempotent provider boot)
6. Fix: ensure correct order — resolve → rebind; or use `binding()` with immediate callback

## Validation Checklist
- [ ] `$app->resolved($abstract)` returns true before rebinding
- [ ] `rebinding()` registered before re-registration
- [ ] Callback is idempotent (set, not append)
- [ ] No duplicate `rebinding()` registrations
- [ ] `rebinding()` used — not manual `forgetInstance()` + `rebound()`

## Common Failures
- `rebinding()` registered in `register()` but binding resolved in `boot()` — callback fires immediately during `boot()` when unexpected
- Multiple calls to `rebinding()` register duplicate callbacks — each fires on rebind
- Manual `forgetInstance()` clears the resolved flag — `rebound()` won't detect as resolved
- Abstract resolved via alias, not canonical name — `rebinding()` on canonical works but `bound()` on alias behaves differently

## Decision Points
- If `resolved()` is false: either resolve the binding first, or switch to `resolving()` which doesn't require prior resolution
- If duplicate callbacks: add guard flag to prevent duplicate registration in provider

## Performance Considerations
- Debugging adds no production overhead
- Resolution tracing via `resolved()` is an O(1) array lookup

## Security Considerations
- `rebound()` re-resolves the full dependency tree — ensure security extenders are preserved
- Verify callbacks don't leak or cache sensitive data from re-resolved instances

## Related Rules
- Verify resolved() Status When Rebounds Do Not Fire
- Use rebinding() Instead of Manual forgetInstance() + rebound()
- Guard Callback Registration to Prevent Duplicates

## Related Skills
- React to Binding Re-registrations with rebinding()
- Configure Services at Resolution Time (resolving())
- Understand Resolution Callback Execution Order for Debugging

## Success Criteria
- Rebound callbacks fire at the correct time
- No duplicate callback execution
- All side effects are idempotent and predictable
