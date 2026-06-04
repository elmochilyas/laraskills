# Decomposition: Lifecycle Events and Hooks

## Boundary Analysis
This KU covers all observation and extension points that fire during the request lifecycle: application boot callbacks (`booting`, `booted`, `terminating`), bootstrap string events (`bootstrapping:*`, `bootstrapped:*`), request lifecycle events (`RequestHandled`, `Terminating`), and request duration lifecycle handlers (`whenRequestLifecycleDurationExceeds`). It excludes the general Laravel event dispatcher internals (listener resolution, queued events, subscriber registration — those belong to the Event System domain). It also excludes service provider lifecycle (`register()`, `boot()`) except where hooks intersect with provider phases. The `terminate()` method's middleware dispatch is covered in Response Sending and Termination; this KU covers only the event/callback aspect of termination.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The hooks are conceptually unified as "points where code can observe or extend the lifecycle." Each hook type serves the same purpose (lifecycle observation) with different timing. Splitting into "Boot Hooks" and "Request Hooks" would create two small KUs that each need to re-describe the lifecycle timeline.

## Dependency Graph
```
Lifecycle Events and Hooks
├── HTTP Kernel Dispatch              (hooks fire inside handle/terminate)
├── Response Sending & Termination    (termination context)
├── Boot Order & Timing               (hook firing order within bootstrap)
├── Service Providers                 (booting/booted registered in providers)
├── Entry Point Mechanics             (LARAVEL_START timing)
└── Long-Running Process Architecture (Octane state flush via Terminating)
```

## Follow-up Opportunities
- "Application Builder Hook System" — The `bootstrap/app.php` fluent API (`->booting()`, `->booted()`, `->create()` callback) provides lifecycle hooks at configuration time. As the `ApplicationBuilder` grows more powerful, these configuration-time hooks could form their own KU, separate from runtime lifecycle hooks.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization