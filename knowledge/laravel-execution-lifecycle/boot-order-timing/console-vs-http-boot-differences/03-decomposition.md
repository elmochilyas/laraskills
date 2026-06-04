# Decomposition: Console vs HTTP Boot Differences

## Boundary Analysis
**Scope:** The structural and behavioral differences between `HttpKernel` and `ConsoleKernel` bootstrap sequences: bootstrapper list differences (especially `RegisterFacades`), the `runningInConsole()` detection and its effects on providers, the Artisan command execution flow (`handle()` method), termination differences (middleware vs no middleware), and the shared Application instance implications.

**Excluded:**
- Artisan command development patterns (command signature, arguments, options — separate domain)
- Artisan output formatting (styles, progress bars — separate concern)
- HTTP middleware internals (covered in project-level middleware domain)
- Octane-specific considerations (covered in Octane Boot Timing)
- The complete boot sequence step-by-step (covered in Complete Boot Sequence)
- Event system differences (the same bootstrap events fire, just for different bootstrappers)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** The HTTP vs console comparison is a single analytical unit: two kernel implementations compared across bootstrappers, lifecycle, termination, and provider registration. These dimensions are interdependent—changing the console bootstrapper list affects facade availability, which affects provider behavior, which affects command execution. They are best understood as a holistic comparison.

## Dependency Graph
```
┌──────────────────────────────────────────────────────────┐
│        Console vs HTTP Boot Differences                   │
├──────────────────────────────────────────────────────────┤
│ Depends on:                                               │
│   ├── Complete Boot Sequence (both kernels use the        │
│   │   same 16-step sequence with variations)              │
│   ├── Bootstrap with Event System (console also fires     │
│   │   bootstrapping/bootstrapped events)                  │
│   ├── Register Phase Order (same registration mechanism   │
│   │   in both kernels, but different provider sets may    │
│   │   be triggered)                                       │
│   └── Boot Phase Order (boot order is identical; boot     │
│       composition differs subtly)                         │
│ Related to:                                               │
│   ├── Octane Boot Timing (Octane's worker model adds a    │
│   │   third execution context beyond HTTP and Console)    │
│   └── Deferred Provider Loading Timing (console mode      │
│       may trigger different deferred providers than HTTP) │
└──────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Kernel-agnostic service provider patterns:** Best practices for writing providers that work identically in both HTTP and console contexts.
- **`runningInConsole()` audit tool:** Static analysis to detect overuse or incorrect use of `runningInConsole()` branching.
- **Console boot profiler:** A command that measures boot time in console context, broken down by bootstrapper and provider.
- **Unified kernel RFC:** Analysis of the feasibility and impact of merging `HttpKernel` and `ConsoleKernel` into a single context-aware kernel.
- **Scheduler performance optimization:** Guide for reducing console boot overhead in scheduled task execution, including `schedule:work` best practices.
- **Command warmup strategy:** How to pre-trigger deferred providers so scheduled commands run fast on first execution.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization