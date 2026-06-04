# Decomposition: Provider Registration Order

## Boundary Analysis
**Scope:** The specific mechanism by which Laravel determines the order of service provider registration — the three-source merge, deduplication, deferred provider extraction, and the relationship between registration order and boot order.

**Excluded:**
- The register() vs boot() phase contract (covered in Register vs Boot)
- Individual provider behavior during registration (covered in Service Provider subdomain)
- Package discovery internals (covered in Package Discovery and Auto-Registration)
- Deferred provider loading mechanics (covered in Deferred Providers)
- Boot order after registration (covered in Boot Phase Order)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Provider registration order is a single concept — how providers are collected, ordered, and registered. The three-source merge, deduplication, and deferred extraction are inseparable aspects of a single registration pipeline. Splitting would create fragments that only make sense when understood together.

## Dependency Graph
```
Provider Registration Order
  ├─ Three provider sources
  │   ├─ Framework core (Application::__construct)
  │   ├─ config/app.php (user-defined)
  │   └─ Package discovery (PackageManifest)
  ├─ Deduplication (first occurrence wins)
  ├─ Deferred provider extraction
  └─ serviceProviderList (preserves order)
      └─ Boot iteration order matches
```

## Follow-up Opportunities
- Explore how PHP 8 attributes could replace the config/app.php provider array for registration order.
- Investigate the impact of Composer's autoloader order on package discovery provider order.
- Build a visualization tool that shows the final provider registration order from all three sources.
- Analyze how Laravel 11's provider consolidation affected the three-source merge.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
