# Decomposition: Facade Aliases Registration

## Boundary Analysis
**Scope:** The process by which Laravel registers facade aliases — the `RegisterFacades` bootstrapper, the `AliasLoader` autoloader, the `config/app.php` aliases array, `class_alias()` mechanics, and the timing at which aliases become available in the request lifecycle.

**Excluded:**
- Facade root resolution and proxying (covered in Facade Architecture)
- Individual facade class implementation (covered in Facade Architecture)
- Real-Time Facade generation (covered in Facade Architecture)
- Container aliases (covered in Container Aliases)
- Facade faking and testing (covered in Testing with Container)

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:** Facade aliases registration is a single, focused mechanism — the autoloader hook that maps short names to facade classes. It has one entry point (RegisterFacades bootstrapper), one runtime mechanism (AliasLoader), and one configuration source (config/app.php aliases). These elements form a cohesive feature.

## Dependency Graph
```
Facade Aliases Registration
  ├─ RegisterFacades bootstrapper (step 4 of 6)
  ├─ AliasLoader
  │   ├─ spl_autoload_register([$this, 'load'], true, true)
  │   └─ load() + class_alias() on first reference
  ├─ config/app.php aliases array
  └─ Facade root resolution on first use
```

## Follow-up Opportunities
- Investigate the performance impact of 100+ facade aliases on autoloader chain length.
- Explore whether PHP 8.4+ has native alias support that could replace the class_alias() autoloader hook.
- Analyze the compatibility between AliasLoader and Composer's classmap autoloader in optimized production setups.
- Build a static analysis tool that detects when facades are used without corresponding alias registration or imports.
---
## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization
