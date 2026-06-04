# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.14 Octane connection pool for read replicas (persistent connections)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Octane maintains persistent database connections across requests. Read replica connections in Octane benefit from connection pooling: fewer `connect()` calls, lower per-request latency, controlled connection count. Octane's `PDOConnectionPool` manages configurable min/max connections per replica per worker.

---

# Core Concepts

- **Persistent connections**: Octane worker starts, connects to replicas, keeps connections alive across requests. No connect/disconnect per request.
- **PDOConnectionPool**: Octane 2.x+ includes connection pooling. Pool size per replica: `'pool' => ['min' => 2, 'max' => 10]`.
- **Connection reuse**: Worker holds connections to replicas. If PHP-FPM: connect per request. Octane: connect once per worker lifetime.

---

# Patterns

**Pool sizing**: `min` = expected concurrent connections (average requests per worker). `max` = burst capacity. For 8 concurrent requests, min=4, max=8.

**Read replica pool config**: `'mysql' => ['driver' => 'mysql', 'pool' => ['min' => 2, 'max' => 5], 'read' => ['host' => [...]]'`.

---

# Common Mistakes

**No pool config in Octane**: Octane without pooling creates a new connection per request. Same overhead as PHP-FPM. Always configure pool.

---

# Related Knowledge Units

7.8 Connection pooling replicas | 9.9 Octane connection configuration
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

