# Decomposition: Pivot Table Conventions

## Boundary Analysis
This KU covers the naming algorithm, default foreign key generation, composite primary key design, and migration patterns for many-to-many pivot tables. It explicitly excludes custom Pivot model classes (covered in custom-pivot-models), the `withPivot` API for accessing extra columns (covered in pivot-attributes), and pivot lifecycle events (covered in pivot-events). The boundary is the table itself — its structure, naming, and creation — not the runtime behavior of pivot rows.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)
Pivot naming and migration design form a single cohesive topic. The naming convention directly informs migration structure; splitting them would require the developer to jump between files to understand why a pivot table must be named a certain way and what columns it should contain. The composite key discussion is inseparable from the migration pattern.

## Dependency Graph
- **Depends on:** Migration Fundamentals (must understand `Schema::create`, column types, foreign keys, composite indexes)
- **Depends on:** Eloquent Model Conventions (must understand `$table` property, primary key defaults)
- **Referenced by:** custom-pivot-models (builds on the table structure defined here)
- **Referenced by:** pivot-attributes (depends on understanding which columns exist on the pivot)

## Follow-up Opportunities
- Deep dive into composite vs surrogate key tradeoffs for pivot tables in distributed systems
- Automated pivot table generation via Artisan commands (convention-based scaffolding)
- Pivot table versioning strategies when adding columns post-deployment
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization