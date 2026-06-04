# Skill: Maintain and Rebuild Indexes for Bloat Management

## Purpose

Monitor and manage index bloat over time — using VACUUM and REINDEX (PostgreSQL), OPTIMIZE TABLE and ALGORITHM=INPLACE (MySQL) — scheduling regular maintenance during low-traffic windows to prevent performance degradation from dead index entries and fragmentation.

## When To Use

- Regular database maintenance (quarterly or monthly)
- After large data migrations or bulk operations
- Detecting index performance degradation
- High-write tables with frequent UPDATE/DELETE

## When NOT To Use

- Read-only tables with no bloat accumulation
- Tables that are never updated or deleted

## Prerequisites

- Understanding of index bloat and dead tuple concepts
- Access to database maintenance tools (pgstattuple, pg_repack)

## Inputs

- Table and index bloat estimates
- Write volume and pattern (UPDATE/DELETE frequency)
- Maintenance window availability

## Workflow

1. Monitor index bloat quarterly using `pgstattuple` or bloat estimation queries
2. For tables with > 20% bloat, schedule REINDEX or pg_repack
3. For PostgreSQL: use `REINDEX INDEX CONCURRENTLY` (PG 12+) or `pg_repack` for zero-downtime
4. For MySQL: `OPTIMIZE TABLE` or `ALTER TABLE ... ENGINE=InnoDB, ALGORITHM=INPLACE`
5. Set fillfactor for high-update columns (70-80 instead of default 90)
6. Tune autovacuum for high-write tables

## Validation Checklist

- [ ] Index bloat monitored regularly (quarterly)
- [ ] Rebuild method chosen for zero-downtime (CONCURRENTLY or pg_repack)
- [ ] fillfactor set appropriately for update-heavy columns
- [ ] Autovacuum tuned for high-write tables

## Common Failures

### Not monitoring bloat
Index performance degrades silently. A query that took 50ms takes 200ms — and no index maintenance was ever run.

### REINDEX without planning
REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production.

## Decision Points

### REINDEX CONCURRENTLY vs pg_repack?
REINDEX CONCURRENTLY is built-in but slower. pg_repack requires extension installation but is more flexible.

### fillfactor tuning?
Lower fillfactor (70-80) for high-update columns to allow in-page updates. Higher (90) for append-only columns.

## Performance Considerations

Bloated indexes consume more buffer pool space and increase I/O. Regular maintenance restores performance. However, maintenance itself consumes resources.

## Security Considerations

Index maintenance requires careful scheduling to avoid impacting production traffic. Use concurrent methods for zero-downtime maintenance.

## Related Rules

- Monitor index bloat quarterly
- Use CONCURRENTLY for production index rebuilds
- Set fillfactor for high-update columns

## Related Skills

- Create Indexes Concurrently for Zero-Downtime
- Estimate Index Size for Buffer Pool Planning
- Assess Over-Indexing Risks

## Success Criteria

- Index bloat stays below 20%
- Maintenance runs during low-traffic windows
- Concurrent rebuild used in production
- fillfactor and autovacuum tuned for write patterns
