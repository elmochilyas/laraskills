# Decision Trees: pg_clickhouse FDW for Transparent Analytical Query Pushdown

## Decision: FDW vs Direct ClickHouse Connection

**Q: Does the application already use PostgreSQL?**
- Yes → FDW simplifies architecture (single connection)
- No → Direct ClickHouse connection may be simpler

**Q: How many queries per second through FDW?**
- < 100 QPS → FDW is appropriate
- 100-1000 QPS → FDW with materialized view caching
- > 1000 QPS → Direct ClickHouse connection recommended

**Q: Are queries simple with filter pushdown?**
- Yes (single table, WHERE on ORDER BY) → FDW works well
- No (complex JOINs, subqueries) → Consider materialized views or direct ClickHouse

## Decision: Materialized View Strategy

**Q: How frequently are FDW queries executed?**
- Every minute or more → Create materialized view with periodic refresh
- Every few hours → FDW without materialization is acceptable
- Once daily → Direct FDW query is fine

## Decision: Schema Organization

**Q: How many foreign tables?**
- < 10 → Single analytics schema
- 10-50 → Analytics schema with domain-specific schemas
- 50+ → Consider separate PostgreSQL database for analytics
