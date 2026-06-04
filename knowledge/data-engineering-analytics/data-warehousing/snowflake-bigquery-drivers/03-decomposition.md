# Decomposition: Snowflake/BigQuery Eloquent Driver Setup and Migration Support

## Topic Overview
Laravel's Eloquent ORM was designed for MySQL/PostgreSQL (OLTP), but community packages now extend it to Snowflake and BigQuery for OLAP workloads. These packages provide Eloquent models, query builders, schema builders, and migration support against cloud data warehouses. The key engineering challenge is adapting OLTP ORM patterns (individual row CRUD, relationships, lazy loading) to OLAP systems that are optimized for bulk operations, columnar storage, and partitioned tables.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k013-snowflake-bigquery-drivers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Snowflake/BigQuery Eloquent Driver Setup and Migration Support
- **Purpose:** Laravel's Eloquent ORM was designed for MySQL/PostgreSQL (OLTP), but community packages now extend it to Snowflake and BigQuery for OLAP workloads.
- **Difficulty:** Intermediate
- **Dependencies:** K006 (Star Schema): Designing Snowflake/BigQuery tables for analytical queries, K012 (ClickHouse MergeTree): ClickHouse as alternative data warehouse, K025 (Snowflake Warehouse Switching): Managing multiple warehouses within Laravel, K032 (HTTP vs FFI ClickHouse): Driver architecture tradeoffs

## Dependency Graph
**Depends on:**
- K006 (Star Schema): Designing Snowflake/BigQuery tables for analytical queries
- K012 (ClickHouse MergeTree): ClickHouse as alternative data warehouse
- K025 (Snowflake Warehouse Switching): Managing multiple warehouses within Laravel
- K032 (HTTP vs FFI ClickHouse): Driver architecture tradeoffs

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- foundry-co/laravel-snowflake:
- noman-sheikh/laravel-bigquery-eloquent:
- Warehouse differences:
- Connection configuration:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K006 (Star Schema): Designing Snowflake/BigQuery tables for analytical queries, K012 (ClickHouse MergeTree): ClickHouse as alternative data warehouse, K025 (Snowflake Warehouse Switching): Managing multiple warehouses within Laravel, K032 (HTTP vs FFI ClickHouse): Driver architecture tradeoffs

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