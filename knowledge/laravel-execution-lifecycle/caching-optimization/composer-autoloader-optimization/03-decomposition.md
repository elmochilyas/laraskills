# Decomposition: Composer Autoloader Optimization

## Boundary Analysis
Covers Composer's autoloader optimization flags (`-o`, `-a`, `--apcu`), classmap generation, authoritative vs. PSR-4 fallback behavior, and the impact on class resolution during Laravel bootstrap. Excludes the Composer dependency resolution algorithm and the `install`/`update` commands beyond their autoloader flags.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The classmap generation, authoritative fallback control, and APCu storage are tightly coupled features of the same autoloader system.

## Dependency Graph
```
Composer Autoloader Optimization
  ├── depends on: Composer (autoloader generator)
  ├── depends on: PHP Autoloading (spl_autoload_register mechanism)
  ├── enables:   Faster class resolution during bootstrap
  ├── enables:   Services Cache (provider classes resolved faster)
  ├── enables:   Config/Route/Events caching (class resolution during cache build)
  └── related:  OpCache Configuration (OpCache caches autoloader PHP files)
```

## Follow-up Opportunities
- **Dynamic classmap verification in CI:** Script to verify all classes referenced in application code exist in the classmap before deployment.
- **Selective authoritative mode:** Allow authoritative classmap for vendor classes but PSR-4 fallback for application classes (where dynamic generation may occur).
- **Autoloader profiling:** Tooling to measure class resolution time per class during bootstrap, identifying which classes should be eagerly loaded or preloaded.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization