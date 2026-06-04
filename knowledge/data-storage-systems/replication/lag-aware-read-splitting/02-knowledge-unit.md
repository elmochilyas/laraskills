# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.7 Lag-aware read splitting (route to primary when replica lag exceeds threshold)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Lag-aware read splitting monitors replica lag and routes reads to the primary if lag exceeds a threshold. If replica is > 5s behind, serve stale-sensitive queries from primary. Provides read scaling during normal operation and automatic fallback to primary during replication issues.

---

# Core Concepts

- **Lag threshold**: Define max acceptable lag per query type. User-facing queries: 1-2s. Reporting queries: 30-60s. Analytics: no limit.
- **Lag check frequency**: Check lag every N seconds (not per-query). Cache lag value in memory/Redis for 1-5s. Avoids per-query lag check overhead.
- **Query classification**: Tag queries as "lag-sensitive" (user profile, order status) or "lag-tolerant" (reports, search results).

---

# Patterns

**Custom DB connector**: Extend Laravel's `MySqlConnection`. In `select()`, check cached lag. If lag > threshold, use write PDO for this query.

**Permission-based routing**: `DB::connection('mysql::read')->select(...)` — if lag exceeds threshold, this falls back to write. Service layer decides per query.

---

# Common Mistakes

**Checking lag on every query**: `SHOW REPLICA STATUS` itself adds load. Cache lag value and refresh at most every 1-5 seconds.

---

# Related Knowledge Units

7.5 Replica lag | 7.6 Lag monitoring | 7.10 Multi-region replication
## Ecosystem Usage

Laravel supports read/write connections in database config. Managed databases provide read replica endpoints. ProxySQL and pgBouncer route traffic at the proxy level.

## Failure Modes

Read-after-write inconsistency from replication lag. Stale reads from replicas under heavy write loads. Connection pooling with transaction pooling breaks session state.

## Performance Considerations

Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual consistency.

## Production Considerations

Monitor replica lag via seconds_behind_master or pg_stat_replication. Set sticky=true for session consistency. Use lag-aware read splitting. Test failover regularly.

## Research Notes

Aurora's distributed storage reduces replica lag to milliseconds. Group replication provides multi-primary capabilities. pgBouncer transaction pooling limitation is known.

## Internal Mechanics

Primary handles writes, streaming changes via binary log or WAL shipping. Replicas replay changes for consistency. Read/write splitting routes based on statement type.

## Architectural Decisions

Async MySQL binlog replication: zero write impact, seconds of data loss risk. Sync PostgreSQL replication: higher write latency, zero data loss. Aurora storage replication: minimal write impact, zero data loss.

## Tradeoffs

Benefit: Read scaling. Cost: Stale reads possible. Benefit: Write failover. Cost: Replica promotion complexity. Benefit: Connection pooling. Cost: Transaction pooling limitations.

## Mental Models

Primary is the source of truth. Replicas are cached copies that lag slightly. Writes go to primary, reads to any replica. The sticky option forces reads to primary after writes.

