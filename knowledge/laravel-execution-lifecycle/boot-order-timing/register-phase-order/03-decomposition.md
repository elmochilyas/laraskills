# Decomposition: Register Phase Order

## Boundary Analysis
**Scope:** The `register()` phase within the boot pipeline, including `registerConfiguredProviders()`, `ProviderRepository::load()`, `Application::register()`, the automatic `$bindings`/`$singletons` processing, deferred provider detection during registration, and the merge logic for framework/app/package provider sources.

**Excluded:**
- The `boot()` phase (covered in Boot Phase Order)
- Deferred provider lazy-loading mechanism (covered in Deferred Provider Loading Timing)
- The bootstrapper that invokes the register phase (covered in Bootstrap with Event System)
- Individual provider implementation strategies (project-specific)
- Event discovery or listener registration (separate concern)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Provider registration order is a single, tightly-coupled concept. The merge of three provider sources, the deferred detection, and the `Application::register()` method are interdependent—changing any one affects the final order. Sub-concepts (deferred detection, manifest caching) are well-scoped and referenced from here without needing division.

## Dependency Graph
```
┌─────────────────────────────────────────────────────────┐
│              Register Phase Order                        │
├─────────────────────────────────────────────────────────┤
│ Depends on:                                              │
│   ├── Complete Boot Sequence (positions register phase   │
│   │   within the 16-step pipeline)                       │
│   └── Bootstrap with Event System (register phase is     │
│       wrapped by bootstrapping/bootstrapped events)      │
│ Prerequisite for:                                        │
│   ├── Boot Phase Order (boot() runs after all register() │
│   │   calls complete)                                    │
│   ├── Deferred Provider Loading Timing (deferred         │
│   │   providers are identified during registration)      │
│   └── Lifecycle Callback Hooks (callbacks fire after     │
│       registration is complete)                          │
└─────────────────────────────────────────────────────────┘
```

## Follow-up Opportunities
- **Visual ordering matrix:** A table showing the exact registration order of all built-in providers across Laravel versions.
- **Automatic order validation tool:** An artisan command that checks provider lists for potential ordering conflicts.
- **Provider dependency declaration RFC:** A formal proposal for providers to declare dependencies (like `#[Depends(OrderingProvider::class)]`) that the framework resolves automatically.
- **Package interleaving mechanism:** Could Laravel's provider system support interleaving app and package providers?
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization