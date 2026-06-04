# Decomposition: Relationship Touch — Touch Timestamps on Relationship Changes

## Boundary Analysis
This KU covers the `$touches` property and `touch()` method for timestamp propagation across relationships. It excludes the general model lifecycle (saving/saved events — separate domain), cache invalidation strategies (broader topic), and `updated_at` column mechanics (timestamps feature). The boundary is specifically: automatic timestamp updating on parent models triggered by child model mutations.

## Atomicity Assessment
**Status:** ✅ Atomic
The touch feature is a single concept: update parent's `updated_at` when the child changes. The `$touches` property (automatic) and `touch()` method (manual) are two sides of the same coin. The `withoutTouching()` helper is a suppression mechanism, not a separate feature. Splitting would force duplication of the propagation mechanics.

## Dependency Graph
- **Depends on:** Singular relationship definitions (BelongsTo, HasOne)
- **Depends on:** Model lifecycle events (saving, saved)
- **Depends on:** Timestamps (`updated_at` column)
- **Referenced by:** Cache invalidation patterns
- **Referenced by:** inverse-relations (in-memory vs persistence-level consistency)

## Follow-up Opportunities
- Queue-based asynchronous touch for high-traffic systems
- Database trigger-driven touch propagation
- Custom `touchOwners()` override for conditional/batched touching
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization