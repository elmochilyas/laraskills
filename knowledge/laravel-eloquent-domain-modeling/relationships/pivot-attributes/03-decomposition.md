# Decomposition: Pivot Attributes

## Boundary Analysis
This KU covers reading and writing extra columns on pivot tables using `withPivot()`, `withTimestamps()`, `sync()` with attribute arrays, `attach()` with extra data, and `updateExistingPivot()`. It explicitly excludes custom pivot model behavior (covered in custom-pivot-models), pivot table naming and migration design (covered in pivot-table-conventions), and pivot event lifecycle (covered in pivot-events). The boundary is the attribute data itself — how to access it, write it, and cast it.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Reading pivot attributes (via `withPivot`) and writing them (via `sync`/`attach`/`updateExistingPivot`) are two sides of the same feature. Separating them would force developers to learn the read API in one KU and the write API in another, masking the symmetry between `withPivot()` and the attribute arrays in `sync()`.

## Dependency Graph
- **Depends on:** pivot-table-conventions (must understand pivot table column structure)
- **Depends on:** BelongsToMany Relationship Definition (must understand how `belongsToMany` is called)
- **Referenced by:** custom-pivot-models (pivot attributes are the data that custom models expose)
- **Referenced by:** pivot-events (attribute changes trigger pivot events)

## Follow-up Opportunities
- JSON column querying on pivot tables (advanced filtering on JSON pivot attributes)
- Pivot attribute computed columns using database expressions
- Automated pivot attribute synchronization with custom sync logic
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization