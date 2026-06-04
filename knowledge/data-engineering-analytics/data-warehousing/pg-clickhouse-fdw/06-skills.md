# Skills: pg_clickhouse FDW for Transparent Analytical Query Pushdown

## Skill: Setting Up pg_clickhouse FDW
**Purpose:** Configure PostgreSQL FDW to query ClickHouse tables transparently.
**When to use:** Integrating ClickHouse analytics with a PostgreSQL-backed Laravel application.
**Steps:**
1. Install `pg_clickhouse` extension on PostgreSQL server
2. Create FDW server definition pointing to ClickHouse HTTP endpoint
3. Create user mapping for ClickHouse read-only user
4. Create foreign table mapping ClickHouse table to PostgreSQL schema
5. Verify type mappings for all columns
6. Test pushdown with EXPLAIN (VERBOSE)
7. Create analytics schema and grant appropriate permissions
8. Configure statement_timeout for foreign table queries

## Skill: Optimizing FDW Query Pushdown
**Purpose:** Ensure ClickHouse FDW queries maximize predicate pushdown for performance.
**When to use:** Optimizing slow FDW queries that scan too much data.
**Steps:**
1. Run `EXPLAIN (VERBOSE) SELECT ...` on problematic query
2. Identify predicates that are not pushed down
3. Restructure query to use pushdown-compatible syntax
4. Add WHERE clauses on foreign table ORDER BY columns
5. Use aggregation functions that ClickHouse supports for pushdown
6. Avoid PostgreSQL-specific functions in foreign table queries
7. Re-test pushdown after restructuring
8. Monitor query performance improvement
