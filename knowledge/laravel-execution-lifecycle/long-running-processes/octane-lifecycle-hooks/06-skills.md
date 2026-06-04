# Skill: Register Octane Lifecycle Hooks for State Cleanup and Monitoring

## Purpose
Implement `Octane::tick()`, `RequestTerminated`, `RequestReceived`, and `WorkerStarting` hooks correctly to perform state cleanup, health monitoring, and worker initialization without introducing new problems.

## When To Use
- Setting up per-request static property cleanup
- Implementing periodic health metric collection
- Initializing worker-specific configuration
- Adding early request denial (IP blocking, rate limiting)

## When NOT To Use
- Per-request business logic (use middleware instead)
- Response modification (hooks run after response sent)
- Heavy periodic work (use queues instead of ticks)
- Request-scoped state in ticks (no request context available)

## Prerequisites
- Octane installed and configured
- Understanding of master container vs sandbox distinction
- List of known leaky static registries from static-property-accumulation audit

## Inputs
- List of static accumulators to clear (Str, Collection, PermissionRegistrar, etc.)
- Metrics system endpoints (for tick-based gauges)
- Worker initialization logic
- Target Octane runtime (Swoole/RoadRunner/FrankenPHP)

## Workflow
1. Create a dedicated service provider (e.g., `OctaneLifecycleServiceProvider`) for all hook registrations
2. Register `WorkerStarting` callback for worker-local initialization (e.g., per-worker database connection)
3. Register `RequestReceived` listener for early request denial — ensure zero state mutation before returning early responses
4. Register `RequestTerminated` listener that clears known static accumulators: `Str::resetCache()`, `Collection::clearMacros()`, app-specific registries; keep execution under 5ms
5. Register `Octane::tick()` callbacks for periodic monitoring — wrap each in try-catch, guard against duplicate registration with a flag, never resolve request-scoped services
6. Test hooks explicitly against the target runtime — FrankenPHP sandbox reuse may not fire `RequestTerminated` every request

## Validation Checklist
- [ ] Each `tick()` callback is wrapped in try-catch to prevent silent worker death
- [ ] Each `tick()` registration is guarded against duplicate registration
- [ ] `RequestTerminated` listeners complete in under 5ms — no queued jobs, HTTP calls, or heavy I/O
- [ ] Tick callbacks never resolve `request()`, `auth()`, or `session()` from master container
- [ ] `RequestReceived` early returns leave zero state mutations behind
- [ ] Hook behavior verified against target runtime (not just PHPUnit simulated environment)
- [ ] Worker lifecycle tested with both warm and cold workers

## Common Failures
- Not wrapping tick callbacks in try-catch — silent worker death from uncaught exception
- Duplicate tick registrations from provider re-calling — multiple callbacks execute per tick
- Resolving request-scoped services in ticks — stale/null values from previous request
- Heavy `RequestTerminated` listeners blocking worker from accepting next request
- `RequestReceived` early returns that mutate state before blocking the request
- Assuming all runtimes fire `RequestTerminated` identically — FrankenPHP may reuse sandboxes

## Decision Points
- `tick()` interval: shorter intervals provide more granular monitoring but increase worker blocking
- `RequestTerminated` vs middleware for cleanup: middleware is request-scoped, hooks are lifecycle management
- Single cleanup listener vs multiple: single listener is faster but harder to maintain; multiple listeners are modular but slower
- Try-catch granularity: per-tick vs global wrapper in registration code

## Performance Considerations
- `RequestTerminated` listeners add to inter-request gap — keep under 5ms total
- Ticks execute inline between requests — a 500ms tick blocks worker from accepting requests
- Too many ticks adds O(n) overhead per request-cycle gap
- `RequestReceived` listeners run before sandbox initialization — avoid heavy container dependencies
- GC collection in `RequestTerminated`: call only when root count is high to avoid unnecessary full scans

## Security Considerations
- Tick mutation of singleton state (e.g., `config()`) affects ALL subsequent requests
- `RequestTerminated` listeners that accumulate data in static arrays become leak sources themselves
- Early return in `RequestReceived` leaving sandbox partially initialized — skipped lifecycle may orphan state
- Uncaught tick exception can terminate the entire worker depending on runtime

## Related Rules
- Wrap `Octane::tick()` callbacks in try-catch (05-rules.md)
- Guard `Octane::tick()` registration against duplicates (05-rules.md)
- Keep `RequestTerminated` listeners fast and synchronous (05-rules.md)
- Never resolve request-scoped services inside tick callbacks (05-rules.md)
- Always handle early returns in `RequestReceived` listeners (05-rules.md)
- Test hooks explicitly against the target runtime (05-rules.md)

## Related Skills
- Establish Memory Baseline and Trend Tracking (memory-profiling-and-observability)
- Identify Static Property Accumulation (static-property-accumulation)
- Tune Octane Worker Configuration (octane-configuration-and-workers)

## Success Criteria
- All known static accumulators are cleared between requests via `RequestTerminated`
- Tick-based health metrics report memory, GC roots, and request counts without errors
- Worker initialization in `WorkerStarting` completes successfully on cold start
- No duplicate tick registrations — each callback fires exactly once per interval
- Runtime-specific hook behavior verified: `RequestTerminated` fires correctly on target runtime
- Early request denial works without leaving mutated singleton state
