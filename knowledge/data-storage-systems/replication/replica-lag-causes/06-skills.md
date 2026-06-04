# Skill: Diagnose Replica Lag Causes

## Purpose

Identify and resolve root causes of replication lag, including long-running transactions, DDL operations, write bursts, and undersized replicas.

## When To Use

- Replica lag exceeds acceptable threshold
- Monitoring shows increasing or inconsistent lag
- Application reports stale data reads
- Before and after schema changes (DDL)

## When NOT To Use

- No replicas deployed
- Replication lag is within acceptable range
- Lag is expected (async replication, cross-region)

## Prerequisites

- Replica lag monitoring (Seconds_Behind_Master, pt-heartbeat)
- Database query log access
- Understanding of replication mechanics

## Inputs

- Replica lag metrics over time
- Database query logs (primary and replica)
- Active transaction list

## Workflow (numbered steps)

1. Measure current replica lag: `SHOW REPLICA STATUS` or `pt-heartbeat` check
2. Identify lag pattern: constant lag (replica underprovisioned) vs spikes (DDL, burst writes)
3. For constant lag:
   - Check replica CPU/IO utilization — may need larger replica
   - Check replica apply rate vs primary write rate
   - Check connection count and lock contention on replica
4. For lag spikes:
   - Check for long-running transactions on primary (hold binlog position)
   - Check for DDL operations (ALTER TABLE blocks replica apply)
   - Check for write bursts (import, batch job, traffic spike)
5. Resolve based on cause:
   - Underprovisioned: upgrade replica hardware
   - Long transactions: break into shorter transactions
   - DDL: use online DDL (pt-online-schema-change, gh-ost)
   - Write bursts: throttle batch operations, schedule off-peak

## Validation Checklist

- [ ] Root cause of lag identified
- [ ] Resolution applied (replica upgrade, DDL strategy change, etc.)
- [ ] Lag returns to acceptable level after resolution
- [ ] Monitoring confirms sustained improvement

## Common Failures

- Assuming lag is always network-related (usually compute or IO)
- Fixing symptom (lag) without addressing root cause (DDL pattern)
- Upgrading replica when issue is on primary (long transactions)

## Decision Points

- Short-term fix (upgrade replica) vs long-term fix (change DDL strategy)
- Proactive (monitor and alert) vs reactive (fix after lag detected)

## Performance Considerations

- Long-running transactions: hold binlog, block replica apply
- DDL: ALGORITHM=COPY blocks replica single-threaded apply
- Replica apply: single-threaded by default (MySQL), parallel replication available

## Security Considerations

- Lag monitoring queries should not impact performance
- Replica access should be logged

## Related Rules

- 7-5-1: Always Monitor Replica Lag
- 7-5-2: Never Run Long Transactions Without Lag Awareness

## Related Skills

- Monitor Replica Lag
- Implement Lag-Aware Read Splitting
- Migrate with Replication Compatibility

## Success Criteria

- Replica lag consistently below threshold
- Root cause identified and resolved
- Monitoring alerts on lag before it affects users

---

# Skill: Prevent Replica Lag from DDL Operations

## Purpose

Apply schema changes without causing excessive replication lag by using online DDL tools and compatible ALTER strategies.

## When To Use

- Running migrations on replicated database
- DDL operations may block replica apply thread
- Need zero-downtime schema changes

## When NOT To Use

- Additive changes only (ADD COLUMN, CREATE INDEX) — low lag risk
- No replicas (single node)
- Low-traffic periods when lag is acceptable

## Prerequisites

- Replica lag monitoring
- Online DDL tools (gh-ost, pt-online-schema-change) or native online DDL
- Understanding of DDL replication behavior

## Inputs

- Migration SQL commands
- Replica configuration
- Online DDL tool configuration

## Workflow (numbered steps)

1. Evaluate DDL type:
   - `ALGORITHM=INSTANT` (MySQL 8.0): no replica lag — safe
   - `ALGORITHM=INPLACE`: minimal replica impact — monitor
   - `ALGORITHM=COPY`: full table rebuild — high lag risk
2. For high-risk DDL (`COPY`):
   - Use gh-ost or pt-online-schema-change for MySQL
   - Throttle based on replica lag threshold
   - Run during low-traffic period
3. For PostgreSQL: `CREATE INDEX CONCURRENTLY`, `ALTER TABLE ... SET NOT NULL` with check
4. Monitor replica lag during DDL execution
5. If lag exceeds threshold, pause or cancel DDL

## Validation Checklist

- [ ] DDL executed with minimal replica lag impact
- [ ] Replica lag monitored during DDL
- [ ] Throttle mechanism works (pause if lag too high)
- [ ] DDL completes successfully on all replicas

## Common Failures

- DDL blocks replica apply thread — all other replication stops
- Long-running DDL causes hours of accumulated lag
- Online DDL tool fails midway — manual cleanup needed

## Decision Points

- Native online DDL (`ALGORITHM=INPLACE`) vs external tool (gh-ost)
- Throttle threshold for pausing DDL

## Performance Considerations

- gh-ost: 5-10% overhead during migration
- `ALGORITHM=INPLACE`: rebuilds table in place, lower overhead
- Throttle DDL during peak hours to protect replica apply

## Security Considerations

- Online DDL tools need database access — restrict permissions
- DDL operations should be reviewed and approved

## Related Rules

- 7-5-1: Always Monitor Replica Lag

## Related Skills

- Diagnose Replica Lag Causes
- Migrate with Replication Compatibility
- Implement Online DDL

## Success Criteria

- DDL completes without causing replica lag alerts
- Schema change applied to all replicas consistently
- Zero application impact during DDL
