# Decomposition: $with Blast Radius

## Boundary Analysis
This KU covers the `$with` model property — its mechanics, performance implications, blast radius analysis, and migration strategies to explicit `with()` calls. It explicitly covers the compounding query effect, the difficulty of debugging, and the `withoutEagerLoads()` workaround. It explicitly excludes standard `with()` usage (covered in eager-loading-fundamentals), constrained eager loading (covered in constrained-eager-loading), and `load()`/`loadMissing()` (covered in lazy-eager-loading). The boundary is specifically the automatic, unconditional eager loading via the model property.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The `$with` property is a single, focused concept: a class-level array that triggers automatic eager loading. The blast radius analysis is inseparable from understanding the property's mechanics — the danger IS the mechanism.

## Dependency Graph
- **Depends on:** eager-loading-fundamentals (must understand eager loading query mechanics)
- **Depends on:** Eloquent Model Conventions (understanding model properties and their effects)
- **Referenced by:** (This KU is a warning/cautionary reference for all other eager loading KUs)
- **Referenced by:** Performance & Integrity subdomain topics

## Follow-up Opportunities
- CI lint rules for `$with` detection and enforcement
- Case studies of `$with` regressions in production
- Alternative patterns: query scopes, global scopes, or explicit `with()` for common loading patterns
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization