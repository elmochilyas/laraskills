# Skill: Configure Services at Resolution Time

## Purpose
Use `resolving()`, `beforeResolving()`, and `afterResolving()` callbacks to configure services automatically when they are resolved, applying cross-cutting setup without modifying individual binding registrations or class constructors.

## When To Use
- Auto-configuration — setting default properties on resolved services
- Cross-cutting behavior — applying logging, monitoring, or tenant context
- Post-construction initialization that doesn't belong in the constructor
- Environment-specific setup (debug mode, tenant config)

## When NOT To Use
- Service decoration or wrapping (use `extend()` instead — it runs before `resolving()`)
- Modifying cached singletons after they're stored (use `resolving()` not `afterResolving()`)
- Instance replacement (avoid returning non-null from callbacks)
- Heavy logic in global callbacks — checked on every resolution

## Prerequisites
- Container Fundamentals
- Binding Resolution
- Execution order: `beforeResolving` → extenders → `resolving` → cache → `afterResolving`

## Inputs
- Abstract name to configure (or null for global callback)
- Configuration logic (setting properties, registering listeners)
- Required hook: `beforeResolving`, `resolving`, or `afterResolving`

## Workflow
1. Determine which hook to use:
   - `beforeResolving()`: when you need the abstract name + parameters before construction
   - `resolving()`: for configuration after construction, before caching (most common)
   - `afterResolving()`: for side effects only (logging, metrics) after caching
2. Register abstract-specific callback: `$app->resolving(Abstract::class, function ($instance, $app) { ... })`
3. Use the `$app` parameter passed to the callback, not captured `$this->app`
4. For global callbacks: `$app->resolving(function ($object, $app) { ... })` — avoid `instanceof` chains
5. Register in `boot()` method of service provider
6. Guard registration against duplicates if provider may boot multiple times

## Validation Checklist
- [ ] Correct hook chosen (`resolving` for config, `afterResolving` for side effects)
- [ ] Instance not replaced via non-null return (no accidental `tap()` returns)
- [ ] Extenders are registered before `resolving()` if decoration is needed
- [ ] `$app` parameter used instead of captured container reference
- [ ] Registration guarded against duplicates (optional, for tested environments)
- [ ] Global callbacks use abstract-specific registration instead of `instanceof` chains

## Common Failures
- Using `afterResolving()` for configuration — modifications invisible because instance already cached
- Extender output lost when `resolving()` replaces the instance via non-null return
- Global callback with 20+ `instanceof` checks adds overhead to every resolution
- Callbacks registered in `register()` capture stale container references
- Duplicate callbacks fire multiple times per resolution after provider re-boot

## Decision Points
- Abstract-specific vs global callback: prefer abstract-specific for O(1) dispatch; use global only for truly cross-cutting concerns
- `resolving()` vs `extend()`: use `extend()` for wrapping/decoration, `resolving()` for property configuration
- `resolving()` vs `rebinding()`: use `resolving()` for per-resolution setup, `rebinding()` for binding change detection

## Performance Considerations
- Abstract-specific callbacks: O(1) array lookup + closure invocation
- Global callbacks: checked on EVERY `make()` — prefer abstract-specific
- Each callback adds ~80 bytes of closure storage
- With 50 abstract-specific callbacks, overhead is ~5μs total

## Security Considerations
- Callbacks can modify any resolved service — audit for malicious callback registration
- `resolving()` callbacks have container access — avoid resolving sensitive services inside
- Use `$app` parameter to avoid capturing privileged context in closure scope

## Related Rules
- Use Abstract-Specific Callbacks Over Global Callbacks with instanceof
- Use extend() for Decoration, resolving() for Configuration
- Use afterResolving() for Side Effects Only
- Avoid Instance Replacement in resolving() Callbacks
- Use $app Parameter Instead of Captured Container Reference
- Guard Callback Registration to Prevent Duplicates

## Related Skills
- Understand Resolution Callback Execution Order for Debugging
- Implement Service Decoration via extend()
- React to Binding Re-registrations with rebinding()

## Success Criteria
- Services automatically configured at resolution time without modifying constructors
- Correct hook used for each concern (before, at, after resolution)
- No instance replacement in callbacks
- No performance degradation from global callback `instanceof` chains

---

# Skill: Debug Resolution Callback Execution Issues

## Purpose
Diagnose problems with resolution callbacks — callbacks not firing, firing in wrong order, or producing unexpected side effects.

## When To Use
- When a `resolving()` callback does not execute as expected
- When decorations applied by `extend()` are lost after `resolving()` runs
- When cached singletons don't reflect configuration applied in callbacks
- When callbacks fire multiple times per resolution

## When NOT To Use
- When the issue is a missing binding (use Debug Binding Resolution Errors)
- When the issue is in auto-resolution (use Debug Auto-Resolution Failures)

## Prerequisites
- Resolution Callbacks
- Execution order: `beforeResolving` → extenders → `resolving` → cache → `afterResolving`

## Inputs
- Callback registration code
- Expected behavior vs actual behavior
- Abstract name and whether it's a singleton

## Workflow
1. Verify the abstract name matches exactly (including casing) — callbacks are string-matched
2. Check if using the correct hook:
   - Configuration not applied: should be `resolving()`, not `afterResolving()`
   - Decorations lost: check if `resolving()` callback returns non-null (replaces instance)
   - Side effects not visible: check if using `afterResolving()` correctly
3. Check registration timing — callbacks must be registered before resolution
4. If callback fires multiple times: check for duplicate registration (provider boot called twice)
5. If singleton configuration is not persisting: verify callback runs before cache (use `resolving()`)
6. Add logging to callbacks to trace execution during resolution

## Validation Checklist
- [ ] Abstract name matches exactly (no typos)
- [ ] Correct hook used for the operation
- [ ] `resolving()` callback does not return non-null (no accidental replacement)
- [ ] No duplicate callback registrations
- [ ] Callback runs before instance is cached (when using `resolving()`)
- [ ] Logging confirms callback execution order matches expected order

## Common Failures
- Typo in abstract name — callback silently never fires
- `afterResolving()` used for configuration — modifications invisible because instance already cached
- `tap()` causes implicit non-null return — replaces the instance, losing extender output
- Provider boot called twice in tests — duplicate callbacks fire twice
- Global callback with `instanceof` fails for proxied/decorated instances

## Decision Points
- If callback never fires: verify abstract name and registration timing
- If callback fires but configuration is lost: check if another callback with non-null return replaces the instance
- If callback fires multiple times: add guard flag or centralize registration

## Performance Considerations
- Debug logging inside callbacks adds resolution latency — only use during debugging
- Global callbacks with many `instanceof` checks degrade all resolutions — profile and refactor

## Security Considerations
- Callback execution logging may expose internal service structure
- Verify callbacks registered by third-party packages are safe and expected

## Related Rules
- Understand Callback Execution Order for Debugging
- Avoid Instance Replacement in resolving() Callbacks
- Guard Callback Registration to Prevent Duplicates

## Related Skills
- Configure Services at Resolution Time
- Implement Service Decoration via extend()
- React to Binding Re-registrations with rebinding()

## Success Criteria
- Callbacks execute at the correct point in the resolution lifecycle
- No instance replacement from accidental non-null returns
- No duplicate or missed callback execution
- Configuration applied correctly before instance caching
