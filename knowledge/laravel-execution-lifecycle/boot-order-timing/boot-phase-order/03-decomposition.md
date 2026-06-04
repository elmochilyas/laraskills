# Decomposition: Boot Phase Order

## Boundary Analysis
**Scope:** The `boot()` phase within the Laravel boot pipeline: `Application::boot()` method, provider iteration order, `bootProvider()` internals, the `$booted` flag (including re-boot prevention and auto-boot of late-registered providers), and the two-level callback nesting (application-level `booting()`/`booted()` wrapped around provider-level `booting()`/`booted()`).

**Excluded:**
- The `register()` phase (covered in Register Phase Order)
- Application-level `booting()`/`booted()` callback system (covered in Lifecycle Callback Hooks)
- The `BootProviders` bootstrapper event wrapping (covered in Bootstrap with Event System)
- Deferred provider boot behavior (covered in Deferred Provider Loading Timing)
- Individual provider implementation strategies

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** The boot phase is a single execution pass through the registered provider list. The ordering rules, the two-level callback nesting, and the re-boot guard are inseparable aspects of the same mechanism. Attempting to split would require repeating the core iteration logic across multiple files.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              Boot Phase Order                            │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                              │
│   ├── Complete Boot Sequence (positions boot phase in    │
│   │   the 16-step pipeline - step 10)                    │
│   ├── Register Phase Order (boot order = register order)│
│   └── Lifecycle Callback Hooks (booting/booted callbacks│
│       fire at the start/end of the boot phase)           │
│ Prerequisite for: Deferred Provider Loading Timing       │
│   (deferred providers skip the boot phase entirely)      │
│ Related to: Octane Boot Timing (boot phase runs once     │
│   under Octane, then subsequent requests skip)           │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Parallel boot RFC assessment:** Evaluate feasibility of booting independent providers concurrently (e.g., using `Fiber` or `parallel`).
- **Provider boot dependency declaration:** Formal proposal for `#[After(AnotherProvider::class)]` attribute to order provider boots independently of register order.
- **Boot-time profiler integration:** A Laravel package that intercepts the boot loop to report per-provider boot duration and memory allocation.
- **Boot phase visualizer:** Real-time dashboard showing which providers are booting, their duration, and their dependencies.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization