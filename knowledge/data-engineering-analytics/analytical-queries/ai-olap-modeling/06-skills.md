# Skills: AI-Assisted OLAP Modeling with LLM-Driven Schema Optimization

## Skill: Running AI-Assisted Schema Optimization
**Purpose:** Use an LLM to analyze query logs and recommend schema optimizations for ClickHouse or PostgreSQL.
**When to use:** Quarterly schema optimization or when query patterns change significantly.
**Steps:**
1. Export 30 days of query logs from `system.query_log` (ClickHouse) or `pg_stat_statements` (PostgreSQL)
2. Export current schema: tables, columns, ORDER BY, partition keys, codecs
3. Export table statistics: row counts, data sizes, compression ratios
4. Sanitize logs: remove PII and actual data values
5. Submit logs + schema + statistics to LLM with optimization prompt
6. Review recommendations and select first change
7. Validate change in staging environment
8. Apply to production with rollback plan
9. Measure impact and document results
