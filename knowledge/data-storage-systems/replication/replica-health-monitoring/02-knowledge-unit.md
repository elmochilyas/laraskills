# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.21 Replica health monitoring (connection failures, stale data)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Replica health monitoring tracks: connection availability (can the app connect to the replica?), replication status (is the IO and SQL thread running?), data freshness (is lag within threshold?). Unhealthy replicas must be removed from the read pool to prevent serving errors or stale data.

---

# Core Concepts

- **Connection health**: Periodic connection test `SELECT 1`. If fails, mark replica as offline. Remove from read pool.
- **Replication thread status**: MySQL `SHOW REPLICA STATUS` → `Slave_IO_Running: Yes`, `Slave_SQL_Running: Yes`. If either is No, replication has stopped.
- **Data freshness**: `Seconds_Behind_Master` or `pt-heartbeat` lag. If > threshold (e.g., 60s), route reads to primary.

---

# Patterns

**Health check middleware**: Every N seconds, probe all replicas. Update a shared health status (Redis, shared memory). Query routing reads from health status.

**Degraded mode**: When all replicas are unhealthy, serve reads from primary. Degrade gracefully — slower reads but functional app.

---

# Common Mistakes

**Serving stale data from unhealthy replica**: Replica's SQL thread stopped 2 hours ago. App still routes reads to it. Users see 2-hour-old data.

---

# Related Knowledge Units

7.6 Replica lag monitoring | 7.11 Failover | 7.17 ProxySQL routing
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

