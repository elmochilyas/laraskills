# Skill: Configure Connection Pooling for Read Replicas

## Purpose

Limit concurrent connections to read replicas by sharing a pool of persistent connections across many application workers, preventing replica overload during traffic spikes.

## When To Use

- PHP-FPM with many workers (50+) each holding replica connections
- Octane workers with persistent database connections
- Replica `max_connections` limit is frequently reached

## When NOT To Use

- Low-traffic applications with few workers
- Replica `max_connections` far exceeds peak concurrent connections
- Transaction pooling breaks application session-state features

## Prerequisites

- Read replicas configured with known `max_connections` limit
- Connection pooler (ProxySQL, pgbouncer, Octane pool) installed
- Application connection string updated to point at pooler

## Inputs

- Replica count and `max_connections` per replica
- Expected concurrent worker count
- Average query duration per request

## Workflow (numbered steps)

1. Determine total potential connections: workers × replicas (e.g., 200 × 3 = 600)
2. Compare against replica `max_connections` (e.g., 150 per replica)
3. Choose pooler: ProxySQL (MySQL), pgbouncer (PostgreSQL), Octane pool (Laravel)
4. Configure pool size: `max_connections` per replica minus headroom
5. Point Laravel read connections at pooler address instead of direct replica
6. Set queue timeout and fallback behavior when pool is exhausted
7. Monitor pool utilization and queue wait times

## Validation Checklist

- [ ] Connection count to replicas stays well below `max_connections`
- [ ] No connection errors during traffic spikes
- [ ] Pool utilization is between 60-80% at peak
- [ ] Queue wait times are within acceptable latency budget

## Common Failures

- Queue wait grows unbounded: pool size too small for peak concurrency
- Transaction pooling with session-level features (prepared statements, SET commands) breaks silently
- Pooler becomes single point of failure if not deployed redundantly

## Decision Points

- Pooler choice: ProxySQL (MySQL, rich routing) vs pgbouncer (PostgreSQL, lightweight) vs Octane pool (Laravel-native)
- Pool size: too small = queuing, too large = connection waste
- Transaction vs session pooling: session pooling for SET-heavy apps, transaction for most web apps

## Performance Considerations

- Pooling reduces connection churn (connect/disconnect overhead) by 10-50x
- Transaction pooling adds <0.1ms per query, negligible
- Queue wait time must be < replica query latency for benefit

## Security Considerations

- Pooler must enforce same access controls as database
- TLS termination at pooler or database depends on architecture
- Pooler credentials must be distinct from application credentials

## Related Rules

- 7-8-1: Always Size Connection Pool for Peak Concurrency
- 7-8-2: Never Exceed Replica max_connections

## Related Skills

- Configure ProxySQL Query Routing
- Configure Laravel Octane Connection Pool
- Implement Load Balancing Replicas

## Success Criteria

- Peak connection count per replica ≤ 80% of `max_connections`
- Zero connection timeout errors during traffic spikes
- Pool queue wait < 10ms at peak

---

# Skill: Select Pooling Mode for Application Workload

## Purpose

Choose between session pooling, transaction pooling, or statement pooling based on application session requirements and query patterns.

## When To Use

- Adding a connection pooler to an existing architecture
- Migrating from PHP-FPM to Octane or serverless
- Diagnosing pool-related application errors

## When NOT To Use

- Direct connections are sufficient for current load
- Application uses SET SESSION or LISTEN/NOTIFY extensively

## Prerequisites

- Inventory of application session-level SQL usage
- Understanding of each pooling mode's limitations

## Inputs

- List of session-level SQL commands used (SET, PREPARE, LISTEN, etc.)
- Average transaction length
- Connection lifetime requirements

## Workflow (numbered steps)

1. Audit application for session-level SQL: `SET SESSION`, `SET LOCAL`, prepared statements, `LISTEN`/`NOTIFY`, temp tables
2. If session-level features are used → session pooling or direct connections
3. If no session-level features → transaction pooling (recommended for web apps)
4. For PostgreSQL with pgbouncer: enable `ATTR_EMULATE_PREPARES` to work around prepared statement limitations
5. Test with production traffic pattern before full rollout

## Validation Checklist

- [ ] Application functions correctly under chosen pooling mode
- [ ] Prepared statements work (emulated or real) in transaction mode
- [ ] Session state is not unexpectedly shared across requests

## Common Failures

- Transaction pooling with prepared statements — use `ATTR_EMULATE_PREPARES`
- `LISTEN`/`NOTIFY` broken in transaction pooling — use session pool or dedicated connection
- Temp tables lost after transaction in transaction pooling

## Decision Points

- Must support prepared statements → session pooling or emulated prepares
- Must support LISTEN/NOTIFY → session pooling or standalone listener
- Maximum efficiency → transaction pooling

## Performance Considerations

- Transaction pooling: 10-100x more efficient than session pooling
- Statement pooling: rarely beneficial, fragile

## Security Considerations

- Pooler authentication must match database user permissions
- No session-level user switching in transaction pooling

## Related Rules

- 7-8-3: Prefer Transaction Pooling for Web Applications

## Related Skills

- Configure Connection Pooling for Read Replicas
- Configure pgbouncer Modes

## Success Criteria

- Application passes full functional test suite under chosen mode
- Connection utilization improved by at least 5x
