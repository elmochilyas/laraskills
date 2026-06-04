# Decomposition: withSum / withAvg / withMin / withMax / loadSum — Subquery Aggregate Loading

## Boundary Analysis
This KU covers non-count aggregate subqueries (SUM, AVG, MIN, MAX) appended to the parent query's SELECT. It excludes COUNT (separate with-count KU), existence checks (with-exists KU), and raw subquery expressions. The boundary is methods that take both a relation name and a column parameter to produce a named scalar aggregate attribute.

## Atomicity Assessment
**Status:** ✅ Atomic
All four aggregate functions share identical mechanics — they differ only in the SQL function name. Splitting by function would create redundant files. Combining them under one KU is natural because the API surface, internals, tradeoffs, and use cases are nearly identical.

## Dependency Graph
- **Depends on:** with-count (subquery infrastructure and mental model)
- **Depends on:** Basic relationship definitions
- **Referenced by:** Reporting and dashboard patterns
- **Referenced by:** E-commerce domain modeling (order totals, inventory aggregates)

## Follow-up Opportunities
- COALESCE defaults for NULL aggregate results
- Composite aggregate subqueries (multi-aggregate in one subquery)
- Database-specific aggregate functions using raw expressions
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization