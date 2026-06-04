# Decomposition: Bootstrapper Sequence

## Boundary Analysis
The KU covers the six-core bootstrapper pipeline, the `bootstrapWith()` method, and the `hasBeenBootstrapped` guard. The boundary starts when the kernel calls `$app->bootstrapWith($this->bootstrappers())` and ends when the last bootstrapper (`BootProviders`) returns. Individual bootstrapper internals are referenced at a high level but their deep mechanics belong in separate KUs.

**In scope:** `bootstrapWith()` implementation, the six-bootstrapper order, the guard pattern, kernel-specific bootstrapper arrays, two-phase register/boot separation.
**Out of scope:** Individual bootstrapper implementation details, service provider lifecycle beyond boot, config file parsing mechanics.

## Atomicity Assessment
**Status:** ⚡ Splittable (2–3 units)

**Proposed split:**
1. **Bootstrapper Orchestration** — `bootstrapWith()` method, `hasBeenBootstrapped` guard, kernel bootstrapper array selection, error propagation.
2. **Individual Bootstrapper Deep Dives** — six separate micro-KUs could be created but the strongest candidates for extraction are:
   - **LoadConfiguration Bootstrapper** — config caching mechanics, file loading, environment override resolution.
   - **RegisterProviders / BootProviders** — the two-phase provider lifecycle.

**Splitting rationale:** `LoadConfiguration` is sufficiently complex (caching, environment merging, array replacement) to warrant its own treatment. The provider phases are tightly coupled to each other but could be extracted if the register/boot distinction needs deeper analysis.

## Dependency Graph
```
bootstrap/app.php returns Application
         │
         ▼
   Kernel::handle() / Kernel::call()
         │
         │  $app->bootstrapWith($bootstrappers)
         ▼
┌────────────────────────────────────────────┐
│  1. LoadEnvironmentVariables               │
│     └─► reads .env / $_ENV / $_SERVER       │
├────────────────────────────────────────────┤
│  2. LoadConfiguration                      │  ◄── Most expensive
│     └─► requires config/*.php → Repository  │
├────────────────────────────────────────────┤
│  3. HandleExceptions                        │
│     └─► set_error_handler / set_exception   │
├────────────────────────────────────────────┤
│  4. RegisterFacades                         │
│     └─► AliasLoader::getInstance()->alias() │
├────────────────────────────────────────────┤
│  5. RegisterProviders                       │
│     └─► $app->register($provider) for all   │
├────────────────────────────────────────────┤
│  6. BootProviders                           │
│     └─► $provider->boot() for all registered│
└────────────────────────────────────────────┘
         │
         ▼
   hasBeenBootstrapped = true
   Application is fully operational
```

Each bootstrapper depends on all previous bootstrappers having completed. The arrow is strictly unidirectional.

## Follow-up Opportunities
- **Per-Bootstrapper Performance Benchmarking:** Micro-benchmarks isolating each bootstrapper's CPU and I/O cost, with and without config caching.
- **Custom Bootstrapper Design:** When and how to create a custom bootstrapper (e.g., for loading secrets from a vault before config loads). Document the pattern for extending `bootstrapWith()`.
- **Provider Registration Metrics:** Analyze the distribution of time across provider `register()` vs `boot()` for typical application profiles, identifying optimization targets.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization