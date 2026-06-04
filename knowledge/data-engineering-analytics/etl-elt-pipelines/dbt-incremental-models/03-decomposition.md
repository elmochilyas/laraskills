# Decomposition: dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)

## Topic Overview
dbt (data build tool) is the de facto standard for ELT transformations in modern data warehouses. It converts raw data (loaded by Fivetran/Airbyte) into analytics-ready models using SQL SELECT statements. dbt's incremental model strategies — merge, append, insert_overwrite — determine how new and changed data is incorporated into existing tables without full refreshes.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k015-dbt-incremental-models/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### dbt Model Patterns (Incremental Merge, Append, Insert_Overwrite)
- **Purpose:** dbt (data build tool) is the de facto standard for ELT transformations in modern data warehouses.
- **Difficulty:** Intermediate
- **Dependencies:** K014 (Medallion Architecture): dbt models implement Bronze→Silver→Gold transformations, K028 (dbt Project Structure): Organizing dbt models, tests, and documentation, K043 (dbt Semantic Layer): Metric definitions built on top of dbt models

## Dependency Graph
**Depends on:**
- K014 (Medallion Architecture): dbt models implement Bronze→Silver→Gold transformations
- K028 (dbt Project Structure): Organizing dbt models, tests, and documentation
- K043 (dbt Semantic Layer): Metric definitions built on top of dbt models

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- dbt model:
- Incremental model:
- `is_incremental()`:
- Unique key:
- Full refresh:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K014 (Medallion Architecture): dbt models implement Bronze→Silver→Gold transformations, K028 (dbt Project Structure): Organizing dbt models, tests, and documentation, K043 (dbt Semantic Layer): Metric definitions built on top of dbt models

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization