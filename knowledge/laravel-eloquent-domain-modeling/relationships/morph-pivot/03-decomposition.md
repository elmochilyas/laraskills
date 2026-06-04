# Decomposition: Morph Pivot

## Boundary Analysis
This KU covers morph-to-many relationships (`morphToMany`/`morphedByMany`), the `MorphPivot` base class, custom morph pivot models, and the morph map system. It explicitly excludes standard many-to-many pivot conventions (covered in pivot-table-conventions), standard custom pivot models (covered in custom-pivot-models), and standard polymorphic relationships (one-to-one polymorphs, covered in a separate subdomain). The boundary is the intersection of polymorphism and many-to-many relationships.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
The morph pivot concept is a single coherent extension of the pivot pattern. Splitting into "morph pivot definition" and "custom morph pivot models" would force developers to understand morph pivots from two files — the mechanics and the behavioral extension are inherently linked.

## Dependency Graph
- **Depends on:** pivot-table-conventions (must understand pivot table naming and structure)
- **Depends on:** custom-pivot-models (must understand `->using()` and pivot class definition)
- **Depends on:** Polymorphic Relationships Basics (must understand `_type`/`_id` pattern)
- **Referenced by:** pivot-events (morph pivot event lifecycle)
- **Referenced by:** pivot-attributes (accessing data on morph pivot rows)

## Follow-up Opportunities
- Morph map alias collision detection (debugging techniques when aliases conflict)
- Multi-column polymorphic keys (composite morph identifiers)
- Database-level cascade cleanup for morph pivots (triggers vs application-level)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization