# Decomposition: Lifecycle Callback Hooks

## Boundary Analysis
**Scope:** All application-level and provider-level lifecycle callback hooks: `$app->booting()`, `$app->booted()`, `$app->terminating()`, `$provider->booting()`, `$provider->booted()`, and container-level `resolving()`/`afterResolving()` hooks. Includes callback registration, storage, invocation order, and interaction with the boot sequence.

**Excluded:**
- Bootstrapper event system (`bootstrapping:*`/`bootstrapped:*` — covered in Bootstrap with Event System)
- Middleware lifecycle hooks (middleware has its own `handle()`/`terminate()` lifecycle)
- Queue job lifecycle hooks (separate domain)
- Eloquent model lifecycle events (separate domain)
- The `boot()` phase mechanics themselves (covered in Boot Phase Order)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** All callback hooks share a common registration and invocation infrastructure (the `fireAppCallbacks()` mechanism). Separating "boot callbacks" from "resolution callbacks" would lose the conceptual consistency—they're all the same pattern applied at different lifecycle points. The KU is concise enough that splitting would create unnecessary duplication.

## Dependency Graph
```
┌──────────────────────────────────────────────────────────┐
│              Lifecycle Callback Hooks                     │
├──────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── Complete Boot Sequence (hooks fire at specific      │
│   │   positions in the 16-step sequence)                  │
│   ├── Boot Phase Order (booting/booted wrap the           │
│   │   provider boot iteration)                            │
│   ├── Register Phase Order (register phase precedes       │
│   │   hooks; bindings must exist)                         │
│   └── Bootstrap with Event System (complementary event    │
│       system with different granularity)                  │
│ Related to:                                                │
│   ├── Deferred Provider Loading Timing (deferred          │
│   │   providers skip boot callbacks)                      │
│   └── Octane Boot Timing (callbacks persist across        │
│       requests; accumulation risk)                        │
└──────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Visual lifecycle map:** An interactive chart showing exactly which callbacks fire at which point in the request lifecycle.
- **Callback debug command:** An `artisan lifecycle:callbacks` command that lists all registered callbacks with their source provider.
- **Callback priority proposal:** Design for a `$app->booting($cb, $priority)` system that allows ordering callbacks from different packages.
- **Octane-safe callback patterns:** Guide for writing callbacks that don't leak memory or accumulate state in long-running processes.
- **Provider callback hook documentation:** Many developers don't know `$this->booting()` and `$this->booted()` exist on provider instances—dedicated documentation could improve awareness.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization