# Decomposition: Chaperone — Preventing Relation Leakage Across Parent Models

## Boundary Analysis
This KU covers the `chaperone()` method for preventing related model instance sharing across parents during eager loading. It excludes the identity map itself (broader Eloquent internals), `SupportsInverseRelations` (bidirectional sync — separate KU), and model replication/cloning (general model duplication). The boundary is the specific problem of cross-parent mutation propagation and the chaperone solution.

## Atomicity Assessment
**Status:** ✅ Atomic
The chaperone feature is a single method with a single purpose: clone related model instances during eager loading to prevent mutation leakage. The shallow-clone behavior is an implementation detail, not a split-worthy concept. The use cases, performance implications, and tradeoffs form one cohesive unit.

## Dependency Graph
- **Depends on:** Eloquent identity map and eager loading mechanics
- **Depends on:** PHP object reference semantics
- **Depends on:** Model `match()` method internals
- **Referenced by:** inverse-relations (paired feature in same trait)
- **Referenced by:** Batch processing and import/export patterns

## Follow-up Opportunities
- Deep clone chaperoning strategy for fully isolated relations
- Identity map bypass alternatives (newModelInstance patterns)
- Memory profiling methodology for chaperoned queries
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization