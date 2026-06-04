# Decomposition: Register vs Boot Methods

## Boundary Analysis
This KU focuses exclusively on the contract and behavior of the two methods. It covers what belongs in each, what doesn't, and the internal mechanism that enforces (or fails to enforce) the separation. It does not cover deferred providers (separate KU), provider shortcuts (separate KU), or provider organization strategies (separate KU).

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The register/boot separation is a single concept with clear edges. Splitting into "what register does" and "what boot does" would produce two incomplete units that each require the other for full understanding.

## Dependency Graph
- **Depends on:** provider-fundamentals (understanding of two-phase lifecycle)
- **Depends on:** Service Container (understanding of bind(), singleton(), make())
- **Referenced by:** deferred-providers (boot deferral mechanics)
- **Referenced by:** provider-testing (testing register vs boot separately)
- **Referenced by:** provider-sprawl-and-governance (impact of many boot calls)

## Follow-up Opportunities
- Method injection in boot() (Laravel 9+ feature)
- Boot ordering control through event listeners
- ServiceProvider callbacks and hooks
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization