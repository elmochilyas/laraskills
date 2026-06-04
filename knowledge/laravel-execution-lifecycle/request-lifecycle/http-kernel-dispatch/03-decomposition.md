# Decomposition: HTTP Kernel Dispatch

## Boundary Analysis
This KU covers the `Illuminate\Foundation\Http\Kernel` class from its `handle()` method entry through `sendRequestThroughRouter()`, `bootstrap()`, and `dispatchToRouter()` closure construction. It includes the 6-core bootstrapper sequence only as orchestration — the individual bootstrapper internals belong to the Boot Order & Timing subdomain. The Pipeline class is referenced but not detailed (it belongs to Middleware Pipeline). Route matching and controller dispatch within `dispatchToRouter()` are excluded — those belong to the Routing & Controllers domain. The response sending after `handle()` returns belongs to Response Sending and Termination.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The HTTP kernel dispatch is a single coherent orchestration flow. The `bootstrap()` call could theoretically be split into a separate "Kernel Bootstrapping" KU, but it is too tightly coupled to the kernel's pipeline — extracting it would create dependency duplication.

## Dependency Graph
```
HTTP Kernel Dispatch
├── Entry Point Mechanics          (calls Kernel::handle())
├── Middleware Pipeline            (used by sendRequestThroughRouter)
├── Application Bootstrap          (bootstrapWith() orchestration)
├── Service Providers              (RegisterProviders/BootProviders)
├── Boot Order & Timing            (bootstrapper sequence ordering)
├── Response Sending & Termination (post-handle flow)
└── Console Kernel Dispatch        (parallel structure, same patterns)
```

## Follow-up Opportunities
- "Kernel Bootstrapper Internals" — Deep dive into each of the 6 bootstrappers: `LoadEnvironmentVariables` (multi-env file loading), `LoadConfiguration` (config repository merging, caching), `HandleExceptions` (error/exception handler registration, reporting), `RegisterFacades` (alias loading, cached facade manifest), `RegisterProviders` (eager vs deferred provider iteration), and `BootProviders` (boot call ordering). These are currently mixed across KUs and could form a dense standalone KU.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization