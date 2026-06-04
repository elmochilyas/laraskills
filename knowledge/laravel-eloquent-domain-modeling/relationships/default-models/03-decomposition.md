# Decomposition: withDefault — Null Object Pattern for Relationships

## Boundary Analysis
This KU covers the `withDefault()` Null Object pattern on singular relationships. It excludes nullable relationship design (the opposite approach), default values in accessors (different mechanism), and the broader Null Object pattern outside ORM (general software design). The boundary is the relationship-level `withDefault()` method and its implications for code safety, serialization, and model behavior.

## Atomicity Assessment
**Status:** ✅ Atomic
The Null Object pattern for relationships is a single concept with three configuration variants (boolean, array, callable). They share the same mechanics, tradeoffs, and impact. Splitting by variant would duplicate the mental model and internal mechanics sections.

## Dependency Graph
- **Depends on:** Singular relationship definitions (BelongsTo, HasOne, MorphOne)
- **Depends on:** Null Object design pattern principles
- **Depends on:** Eloquent `$exists` property understanding
- **Referenced by:** Domain-driven design (always-valid aggregates)
- **Referenced by:** Serialization and API design patterns

## Follow-up Opportunities
- Always-valid domain models using `withDefault()` for required value objects
- Testing strategies for models with default relationships
- Migration guide: replacing `??` null coalescing with `withDefault()`
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization