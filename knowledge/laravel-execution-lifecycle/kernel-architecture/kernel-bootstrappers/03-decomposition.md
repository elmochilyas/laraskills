# Decomposition: Kernel Bootstrappers

## Boundary Analysis
This knowledge unit covers the bootstrapping subsystem — the six initialization steps that prepare the Laravel framework for execution. Its boundaries:
- **In scope:** The six bootstrapper classes in `Illuminate\Foundation\Bootstrap`, the `bootstrapWith()` method in `Illuminate\Foundation\Application`, the bootstrapper array property on both kernels, guarded execution via `hasBeenBootstrapped`, custom bootstrapper integration patterns, the `Bootstrapper` contract, and bootstrap performance/pipeline debug output.
- **Out of scope:** The kernel classes themselves (covered in HTTP/Console Kernel KUs) beyond their bootstrapper property. Service provider internals (registration and booting mechanics — covered in Service Provider KU). Facade alias mechanics (covered in Facade Internals KU). Configuration loading internals beyond the bootstrapper layer.
- **Overlap:** `RegisterProviders` and `BootProviders` are bootstrappers but their internal operation (how providers are registered, deferred providers, provider events) belongs to the Service Providers KU. The bootstrapper *invocation* is covered here — the *result* (e.g., "config is loaded") is consumed by every other KU.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
- The six bootstrappers form a unified sequence — splitting them would break the logical flow.
- The `bootstrapWith()` method is a single loop — there is no natural seam between bootstrapper steps.
- Custom bootstrapper patterns are a natural extension of the same mechanism.
- The guarded initialization (`hasBeenBootstrapped`) is a cross-cutting concern that affects all bootstrappers equally.
- No bootstrapper has independent value outside the sequence — `LoadEnvironmentVariables` without `LoadConfiguration` provides incomplete state.

## Dependency Graph
```
kernel-bootstrappers
├── Prerequisites:
│   ├── Service Container (bootstrappers resolved via container)
│   ├── Service Providers (bootstrappers register and boot providers)
│   ├── Facades (RegisterFacades enables facade usage)
│   └── Error Handling in PHP (set_error_handler, etc.)
├── Internal Dependencies:
│   ├── Application Class (bootstrapWith() method)
│   └── Config Repository (created by LoadConfiguration)
├── Related (bidirectional):
│   ├── HTTP Kernel Internals (invokes bootstrappers)
│   ├── Console Kernel Internals (invokes bootstrappers)
│   └── Configuration Caching (LoadConfiguration consumes cache)
└── Consumed By:
    ├── Legacy Kernel Migration (bootstrapper list may change)
    ├── Kernel Version Evolution (bootstrapper set evolves)
    └── Request Duration Lifecycle Handlers (bootstrap phase timing)
```

## Follow-up Opportunities
- **Custom Bootstrapper for Multitenancy:** Building a bootstrapper that resolves tenant-specific config before providers boot — requires deep understanding of bootstrap ordering constraints.
- **Selective Bootstrapping for Console Commands:** Optimizing console command performance by selectively skipping bootstrappers (e.g., skipping `RegisterFacades` for simple data-export commands).
- **Bootstrap Performance Profiling:** Instrumenting bootstrap time at per-bootstrapper granularity — comparing cached vs uncached config, deferred vs eager provider loading.
- **Compile-Time Bootstrap Optimization:** Exploring how Laravel might pre-compute bootstrap state during deployment (ahead-of-time initialization) to reduce runtime bootstrap overhead.
- **Event-Driven Bootstrap Hooks:** Adding middleware-style hooks between bootstrapper steps (before/after each bootstrapper) — a potential framework enhancement for extensibility.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization