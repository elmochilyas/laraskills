# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.8 Connection pooling for replicas (max connections per replica)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Each PHP-FPM worker or Octane request holds a connection to a read replica. With N workers × M replicas, connection count adds up. Connection pooling (via ProxySQL, pgbouncer, or Octane's connection pool) limits concurrent connections to replicas, preventing replica overload during traffic spikes.

---

# Core Concepts

- **Per-worker connection**: 50 PHP-FPM workers × 3 replicas = up to 150 connections to replica pool. Each replica handles 50 concurrent connections.
- **Connection pool limit**: Max connections per replica (MySQL: `max_connections`, PostgreSQL: `max_connections`). Pool shares limited connections across many workers.
- **Queue wait**: When all pool connections are busy, requests queue. Queue timeout: return error or fall back to primary.

---

# Patterns

**ProxySQL connection pool**: Route read traffic through ProxySQL. ProxySQL maintains a persistent connection pool to replicas. PHP connects to ProxySQL, not directly to replicas.

**Octane connection pool**: Octane's `PDOConnectionPool` maintains a configurable number of connections per replica per worker.

---

# Common Mistakes

**No connection pooling for high-traffic apps**: 200 workers × 3 replicas = 600 connections. Each replica's `max_connections` may be 150. Connection pooling reduces to 150 total shared connections.

---

# Related Knowledge Units

7.9 Load balancing replicas | 10.4 Connection pooling
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

