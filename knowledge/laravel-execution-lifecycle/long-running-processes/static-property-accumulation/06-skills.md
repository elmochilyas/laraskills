# Skill: Identify and Fix Static Property Accumulation

## Purpose
Scan the codebase for static property accumulations (growing arrays, callback registries, memoization caches), fix by replacing with instance-based caching or adding `RequestTerminated` cleanup, and guard one-time registrations to prevent OOM crashes.

## When To Use
- Pre-Octane audit — identify all static accumulators
- OOM debugging — workers crashing after processing many requests
- Package evaluation — third-party packages often leak via static properties
- CI integration — static leak detection as a build step

## When NOT To Use
- PHP-FPM only apps (process destruction resets all statics)
- Non-persistent CLI scripts (one-shot execution)
- Truly constant statics (initialized once, never modified)
- Singleton container state leaks (covered by singleton-state-leaks skill)

## Prerequisites
- Access to application and vendor code
- Memory baseline monitoring set up
- Understanding of static vs instance property lifecycle
- Knowledge of Macroable trait usage

## Inputs
- Output of `get_declared_classes()` or grep results for `static.*\$`
- List of classes using static arrays for caching or registration
- Memory profiling data showing baseline growth

## Workflow
1. Scan codebase for static properties using `grep -r 'static.*\$' app/` and extend to vendor directories for package code — focus on `static::$cache[]`, `static::$macros[]`, `static::$callbacks[]` patterns (growing arrays)
2. For each static array found, determine if it accumulates across requests: does it get entries added per-request without cleanup? Keyed by unique-per-request values? Callback registry that appends?
3. Fix by replacing `static::$cache` with instance property on a scoped binding — the container's lifecycle manages cleanup automatically
4. For third-party classes where you cannot change static to instance (vendor code), register a `RequestTerminated` listener calling the class's reset method: `Str::resetCache()`, `Collection::clearMacros()`, `PermissionRegistrar::forgetCachedPermissions()`
5. Guard all one-time registrations (`Blade::directive()`, `Collection::macro()`, `Str::macro()`) with `Octane::once()` or manual flag check — prevent duplicate registration across requests
6. Never rely solely on lowering `max_requests` — fix the root cause for long-term health

## Validation Checklist
- [ ] Static property scan covers both `app/` and `vendor/` directories
- [ ] Growing patterns identified: `static::$cache[]`, `static::$macros[]`, `static::$callbacks[]`, memoization caches
- [ ] Fix applied: instance-based caching via scoped binding OR `RequestTerminated` cleanup for vendor code
- [ ] All `Blade::directive()`, `Collection::macro()`, `Str::macro()` calls guarded by `Octane::once()` or manual flag
- [ ] `memory_get_usage()` baseline tracked — no growth across 100+ sequential requests
- [ ] Vendor packages scanned for static accumulation — Blade, Collection, Validator, Macroable trait users
- [ ] Root cause fixed, not masked by lowering `max_requests`

## Common Failures
- Confusing static leaks with singleton leaks — both cause persistent state but require different fixes (statics are class-bound, not container-bound)
- Using `isset(static::$cache[$key])` as memoization guard — keys unique per request cause unbounded growth
- Registering Blade directives in controller methods — `Blade::directive()` in controller adds a directive on every request
- Using `Collection::macro()` inside request lifecycle — 1000 unused closures after 1000 requests
- Not scanning vendor code — framework-level static arrays silently accumulate while team focuses on application code

## Decision Points
- Instance-based (scoped) vs explicit cleanup: instance-based is automatic (container handles lifecycle); explicit cleanup (`RequestTerminated`) is needed for vendor code or classes that cannot be scoped
- `Octane::once()` vs manual `app()->bound()` guard: `Octane::once()` is purpose-built; manual flag is more explicit but verbose
- Fix vs temporary mask: always fix root cause; lower `max_requests` only as temporary incident response

## Performance Considerations
- Static array lookups: O(1), extremely fast — developers use them for performance
- Accumulation cost is memory, not CPU — each addition is O(1) but GC scans entire static array during cycles
- PHP's GC treats static properties as roots — growing static arrays increase GC pause times
- `RequestTerminated` cleanup adds CPU cost per request but prevents unbounded memory growth
- Replace `static::$cache` with scoped instance: trades memory for per-request instantiation cost (~0.5-2ms per binding)

## Security Considerations
- Graceful OOM: worker memory slowly climbs to `memory_limit` — worker crashes, spawns replacement, cycle repeats — app appears to restart periodically
- Sudden OOM: single request triggers registration of a large static array (10,000 routes into static cache) — memory spikes immediately
- Silent data drift: static array accumulating per-request configuration — later requests behave differently than earlier ones
- Worker threshold crash: worker dies right before `max_requests` due to accumulated memory — the triggering request is lost

## Related Rules
- Replace static property caching with instance-based caching (05-rules.md)
- Register `RequestTerminated` cleanup for known leaky static registries (05-rules.md)
- Use `Octane::once()` for one-time registration guards (05-rules.md)
- Monitor `memory_get_usage()` baseline growth as static leak indicator (05-rules.md)
- Never use static arrays as request-scoped caches (05-rules.md)
- Scan for static property accumulation in third-party packages too (05-rules.md)
- Do not rely solely on `max_requests` to mitigate static leaks (05-rules.md)

## Related Skills
- Establish Memory Baseline and Trend Tracking (memory-profiling-and-observability)
- Register Octane Lifecycle Hooks for State Cleanup (octane-lifecycle-hooks)
- Identify Singleton State Leaks (singleton-state-leaks)
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)

## Success Criteria
- All growing static arrays identified and fixed — no class-level accumulation across requests
- Instance-based caching via scoped bindings replaces static caches for per-request data
- `RequestTerminated` cleanup registered for every vendor-class static registry with no reset method available
- All one-time registrations (`Blade::directive`, `Collection::macro`, etc.) guarded against duplicate registration
- `memory_get_usage()` baseline is stable across 100+ sequential requests — no monotonic growth
- `max_requests` is configured based on residual leak profile, not as the primary leak mitigation
