# Skill: Monitor Index Usage Statistics

## Purpose

Query index usage statistics — PostgreSQL `pg_stat_user_indexes` (idx_scan, idx_tup_read, idx_tup_fetch) and MySQL `sys.schema_unused_indexes` — to identify unused indexes for removal and covering index opportunities by analyzing the ratio of heap fetches to index reads.

## When To Use

- Quarterly index audit
- Identifying unused indexes to drop
- Finding covering index improvement opportunities
- Post-deployment index verification

## When NOT To Use

- Immediately after server restart (stats reset)
- Temporary tables or tables with very low query volume

## Prerequisites

- Access to database statistics views
- Understanding of idx_scan, idx_tup_read, idx_tup_fetch semantics

## Inputs

- Index name and table
- Scan count (idx_scan)
- Tuple read vs tuple fetch ratio

## Workflow

1. For PostgreSQL: `SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan`
2. For MySQL: `SELECT * FROM sys.schema_unused_indexes`
3. Identify indexes with zero scans over 30+ days
4. Identify indexes with high idx_tup_fetch relative to idx_tup_read (covering index opportunity)
5. Drop confirmed unused indexes; document rationale for retained low-use indexes

## Validation Checklist

- [ ] Unused indexes (zero scans in 30+ days) identified and documented
- [ ] High fetch ratio indexes evaluated for covering index improvement
- [ ] Stats not reset between audit periods (loss of historical data)
- [ ] Drop decisions reviewed against rare but important query needs

## Common Failures

### Resetting stats without analysis
`pg_stat_reset()` or MySQL stats reset clears usage data. Only reset after collecting and documenting findings.

## Decision Points

### Zero scans — drop or keep?
Drop if the index has never been used and no planned queries need it. Keep if it supports infrequent but critical operations (monthly reports, maintenance jobs).

### High fetch ratio — add INCLUDE?
If idx_tup_fetch is high compared to idx_tup_read, adding INCLUDE columns could enable index-only scans.

## Performance Considerations

Unused indexes waste storage and add write amplification to every INSERT/UPDATE/DELETE. Regular cleanup recovers these costs.

## Security Considerations

Index usage statistics don't expose data directly. However, access to pg_stat_user_indexes should be restricted to DBAs and senior developers.

## Related Rules

- Audit indexes quarterly for unused ones
- Analyze fetch ratio for covering index opportunities
- Don't reset stats before collecting findings

## Related Skills

- Assess and Mitigate Over-Indexing Risks
- Estimate Index Size for Buffer Pool Planning
- Include Non-Key Columns for Covering Indexes

## Success Criteria

- Unused indexes identified and dropped quarterly
- High fetch ratio indexes identified for covering index improvement
- Stats collection maintained across audit periods
- Index count stays manageable and justified
