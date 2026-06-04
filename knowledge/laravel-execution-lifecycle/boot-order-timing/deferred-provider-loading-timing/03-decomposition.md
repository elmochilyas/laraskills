# Decomposition: Deferred Provider Loading Timing

## Boundary Analysis
**Scope:** The deferred provider mechanism including `$defer`/`DeferrableProvider` detection, the deferred services manifest, `isDeferredService()`, `loadDeferredProvider()`, `registerDeferredProvider()`, lazy loading via `make()` interception, the `when()` event-triggered loading, and the auto-boot behavior when a deferred provider is loaded post-boot phase.

**Excluded:**
- The standard `register()` flow for non-deferred providers (covered in Register Phase Order)
- The `boot()` phase mechanics (covered in Boot Phase Order)
- Bootstrapper pipeline that identifies deferred providers (covered in Bootstrap with Event System)
- Service provider implementation patterns unrelated to deferral
- Manifest caching internals (covered in Performance Considerations across other KUs)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** The deferred provider system is a single vertical slice through the boot process: detection during registration → manifest storage → lazy trigger via `make()` → late registration + immediate boot. All four stages are tightly coupled; separating them would obscure the end-to-end data flow.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│        Deferred Provider Loading Timing                   │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                              │
│   ├── Register Phase Order (deferred providers are       │
│   │   identified and separated from eager providers      │
│   │   during registration)                                │
│   ├── Boot Phase Order (when a deferred provider loads   │
│   │   post-boot, it's auto-booted immediately)            │
│   └── Complete Boot Sequence (positions deferred         │
│   │   loading within the request lifecycle)               │
│ Related to:                                               │
│   ├── Lifecycle Callback Hooks (deferred providers       │
│   │   miss app-level booting/booted callbacks;           │
│   │   only get provider-level callbacks)                 │
│   └── Octane Boot Timing (deferred providers under       │
│       Octane: loaded once, benefit is amortized)         │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Deferred provider profiler:** An artisan command that shows which deferred providers are loading on each request and how long their `register()`+`boot()` takes.
- **Auto-deferral analysis tool:** A tool that examines service providers and recommends which could be deferred based on `register()`/`boot()` complexity.
- **`when()` optimization patterns:** Documented patterns for using event-triggered deferred loading effectively, including common pitfalls.
- **Lazy facade proxy pattern:** A proxy class that defers provider loading even further by delaying resolution until the proxy is actually accessed.
- **Cache-aware defer strategy:** How to implement deferred providers that respect config cache without requiring re-deployment.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization