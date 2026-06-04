# Skill: Implement Lag-Aware Read Splitting

## Purpose

Route read queries to primary when replica lag exceeds a configurable threshold, preserving read consistency for sensitive queries while scaling reads during normal operation.

## When To Use

- User-facing queries require fresh data (profiles, orders, balances)
- Replica lag varies and occasionally exceeds acceptable bounds
- Application has mixed query sensitivity (some tolerate stale, some don't)

## When NOT To Use

- All queries tolerate eventual consistency (no fallback needed)
- Replica lag is consistently near zero
- Simpler approach: direct all reads to primary

## Prerequisites

- Master-replica topology configured
- Replica lag monitoring in place
- Query classification by sensitivity

## Inputs

- Replica lag value (cached, checked every 1-5s)
- Lag threshold per query type (user-facing: 1-2s, reporting: 30-60s)
- Query classification rules

## Workflow (numbered steps)

1. Classify queries as lag-sensitive (user profile, order status) or lag-tolerant (reports, search results)
2. Set up lag monitoring: check `SHOW REPLICA STATUS` every N seconds, cache lag value in memory/Redis
3. Extend Laravel's `MySqlConnection` — in `select()`, check cached lag before routing
4. If lag > threshold for sensitive queries, use write PDO (primary) instead of read PDO
5. Always route tolerant queries to replicas regardless of lag
6. Fall back lag-tolerant reads to primary if replica health check fails

## Validation Checklist

- [ ] Lag-sensitive queries return fresh data even during replication delay
- [ ] Lag-tolerant queries always route to replicas
- [ ] Lag value is cached and not checked per-query
- [ ] Fallback to primary works when replicas are unreachable

## Common Failures

- Checking lag on every query adds overhead — always cache
- Lag-sensitive query classification misses edge cases (e.g., read-after-write)
- Threshold too low: primary absorbs too many reads, negating replica benefit

## Decision Points

- Lag threshold per query class: stricter for user-facing, looser for reporting
- Cache TTL for lag value: shorter for volatile workloads, longer for stable
- Fallback behavior: error vs primary fallback vs queue

## Performance Considerations

- Cached lag check adds ~1ms, acceptable per request
- Primary fallback reduces read scaling benefit — tune thresholds carefully
- Too many lag-sensitive queries = effective no-replica scenario

## Security Considerations

- Primary handles both reads and writes during fallback — monitor connection limits
- Ensure TLS for all replica and primary connections

## Related Rules

- 7-5-1: Always Monitor Replica Lag
- 7-7-1: Classify Queries by Sensitivity

## Related Skills

- Implement Master-Replica Topology
- Monitor Replica Lag
- Configure Read/Write Splitting

## Success Criteria

- Lag-sensitive query staleness < defined threshold (e.g., 2s)
- Replicas serve >80% of read traffic during normal operation
- Zero stale data served to users from lag-sensitive paths

---

# Skill: Classify Queries for Lag Sensitivity

## Purpose

Tag each read query as lag-sensitive or lag-tolerant to enable intelligent read-splitting decisions.

## When To Use

- Implementing lag-aware read splitting
- Designing query routing policies
- Auditing read-after-write consistency requirements

## When NOT To Use

- Single database node (no splitting needed)
- All reads equally tolerate staleness

## Prerequisites

- Application query list or profiler output
- Understanding of business consistency requirements

## Inputs

- Query list with frequency and response time
- Business owner input on data freshness needs

## Workflow (numbered steps)

1. List all read queries in the application
2. Tag each with data freshness requirement: immediate (<1s), fresh (<5s), stale (5s+)
3. Immediate: user profile, order status, payment confirmation, authentication
4. Fresh: product listings, search results (cached acceptable)
5. Stale: reports, analytics, aggregation, dashboards
6. Encode tags as PHP constants or database config
7. Route based on tag + current replica lag

## Validation Checklist

- [ ] Every read query has a sensitivity tag
- [ ] Immediate-tagged queries never read stale data
- [ ] Fresh-tagged queries tolerate up to 5s lag
- [ ] Stale-tagged queries accept any lag level

## Common Failures

- Read-after-write in same request: user submits form, result page reads from replica before replication
- Misclassifying sensitive queries as tolerant leads to consistency bugs
- Over-classifying tolerant queries as sensitive reduces replica benefit

## Decision Points

- Immediate vs Fresh boundary: look for user-facing flows that must reflect own writes
- Fresh vs Stale boundary: reporting queries are Stale unless real-time required

## Performance Considerations

- More sensitive queries = more primary fallback = less read scaling
- Balance consistency requirements against infrastructure cost

## Security Considerations

- Financial or compliance data may require immediate consistency by policy

## Related Rules

- 7-7-2: Always Classify Queries by Consistency Requirement

## Related Skills

- Implement Lag-Aware Read Splitting
- Audit Application Query Patterns

## Success Criteria

- All queries classified correctly per business requirements
- Read-after-write consistency bugs reduced to zero
