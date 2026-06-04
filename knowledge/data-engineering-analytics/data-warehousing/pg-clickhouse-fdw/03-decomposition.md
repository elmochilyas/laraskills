# Decomposition: pg_clickhouse FDW for Transparent Analytical Query Pushdown

## Topic Overview
`pg_clickhouse` is a PostgreSQL Foreign Data Wrapper (FDW) that enables querying ClickHouse tables directly from PostgreSQL as if they were local tables. This allows Laravel applications (which connect to PostgreSQL) to seamlessly query analytical data stored in ClickHouse without changing the database connection, writing raw SQL, or duplicating data between systems. The FDW pushdowns WHERE clauses, aggregations, and JOINs to ClickHouse — only the result set crosses the wire.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k039-pg-clickhouse-fdw/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### pg_clickhouse FDW for Transparent Analytical Query Pushdown
- **Purpose:** `pg_clickhouse` is a PostgreSQL Foreign Data Wrapper (FDW) that enables querying ClickHouse tables directly from PostgreSQL as if they were local tables.
- **Difficulty:** Advanced
- **Dependencies:** K012 (ClickHouse MergeTree): ClickHouse table design queried through FDW, K032 (ClickHouse Driver Tradeoffs): FDW as alternative to direct ClickHouse drivers, K013 (Snowflake/BigQuery Drivers): FDW eliminates need for separate drivers

## Dependency Graph
**Depends on:**
- K012 (ClickHouse MergeTree): ClickHouse table design queried through FDW
- K032 (ClickHouse Driver Tradeoffs): FDW as alternative to direct ClickHouse drivers
- K013 (Snowflake/BigQuery Drivers): FDW eliminates need for separate drivers

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Foreign Data Wrapper (FDW):
- Pushdown:
- Transparent querying:
- Schema mapping:
- Connection pooling:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K012 (ClickHouse MergeTree): ClickHouse table design queried through FDW, K032 (ClickHouse Driver Tradeoffs): FDW as alternative to direct ClickHouse drivers, K013 (Snowflake/BigQuery Drivers): FDW eliminates need for separate drivers

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