# Skill: Leverage Bootstrap Events for Monitoring and Setup

## Purpose
Register and manage bootstrap event listeners (`bootstrapping:*`, `bootstrapped:*`) to observe or interact with specific points in Laravel's kernel bootstrap pipeline.

## When To Use
- Monitoring bootstrap timing with custom profilers or APM integration
- Injecting pre-bootstrap configuration overrides (e.g., force environment before `LoadEnvironmentVariables`)
- Debugging which bootstrappers execute and in what order
- Observing the bootstrap phase from third-party packages

## When NOT To Use
- For application initialization logic — use service provider `boot()` methods instead
- For request-lifecycle concerns — use middleware or request lifecycle events
- When a specific bootstrapper's state is needed — use that bootstrapper's dedicated extension point
- In Octane for per-request setup — bootstrap events fire once per worker start

## Prerequisites
- Understanding of the 6 kernel bootstrappers and their execution order from `complete-boot-sequence`
- Knowledge of the 16-step boot sequence

## Inputs
- List of bootstrap events to observe (e.g., `bootstrapped: bootProviders`)
- Listener logic to execute at each event point

## Workflow
1. Identify which bootstrapper event corresponds to the desired observation point (e.g., `bootstrapping: loadConfiguration` before config loads)
2. Register the listener in a service provider's `register()` method or in `bootstrap/app.php` — never in `boot()` where it's too late
3. Use specific event names (`bootstrapped: loadConfiguration`) rather than wildcards
4. Keep listener logic lightweight — no database queries, API calls, or file I/O
5. Pass the `$app` Application instance to access container state
6. For configuration overrides, register the listener on `bootstrapping: loadConfiguration` to modify config before it loads
7. Test that the listener fires by adding temporary logging or using Telescope
8. For Octane, ensure bootstrap listeners are idempotent since they fire once per worker

## Validation Checklist
- [ ] Bootstrap event listeners are registered in `register()` or `bootstrap/app.php`, not `boot()`
- [ ] Event names are specific (not wildcard) unless intentionally observing all
- [ ] Listener logic is lightweight with no I/O
- [ ] Custom bootstrappers correctly fire `bootstrapping`/`bootstrapped` events
- [ ] Octane deployments handle bootstrap events correctly (one-time fire per worker)
- [ ] No container bindings are registered inside bootstrap event listeners

## Common Failures
- Registering the listener in `boot()` — bootstrap events have already fired by then, listener silently never executes
- Using wildcard `bootstrapping:*` adds overhead to all 12 core events instead of the relevant one
- Heavy I/O in bootstrap listeners delays every request's time-to-first-byte
- Modifying container bindings in listeners creates order-dependent behavior

## Decision Points
- Use `bootstrapping:` prefix to run code before a bootstrapper; use `bootstrapped:` to run after
- For configuration overrides, always use `bootstrapping: loadConfiguration` (before config loads)
- If the logic belongs to a specific provider, prefer `register()` or `boot()` over bootstrap events

## Performance Considerations
- Event dispatch adds ~1-3µs per event (no listeners) to 10-50µs (with listeners)
- 6 core bootstrappers × 2 events each = 12 events max per request
- Under Octane, bootstrap events fire once per worker start — cost amortized across thousands of requests
- Wildcard listeners match every bootstrapper, multiplying overhead

## Security Considerations
- Bootstrap listeners run before security middleware — ensure listeners don't log or expose sensitive data
- Third-party packages can observe all bootstrap events — audit package listeners for data leakage
- The Application instance passed to listeners is the full container — avoid passing it to untrusted code

## Related Rules
- Bootstrap With Event System Rule 1: Register Bootstrap Listeners Before Bootstrappers Run
- Bootstrap With Event System Rule 2: Keep Bootstrap Event Listeners Lightweight
- Bootstrap With Event System Rule 3: Use Specific Bootstrap Event Names, Not Wildcards

## Related Skills
- Use Lifecycle Callback Hooks (lifecycle-callback-hooks)
- Adapt Boot Timing for Octane (octane-boot-timing)
- Navigate the Complete Boot Sequence (complete-boot-sequence)

## Success Criteria
- Bootstrap event listeners fire at the correct phase and produce expected output
- No listener causes more than 50µs overhead per event
- All listeners are registered early enough to execute
- Configuration overrides take effect before the relevant bootstrapper runs
