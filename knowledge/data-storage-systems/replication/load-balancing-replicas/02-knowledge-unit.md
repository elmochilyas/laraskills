# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.9 Load balancing across replicas (round-robin, least connections)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's default read replica selection is random per query. Better strategies: round-robin (distributes evenly), least connections (routing to least busy replica), or weighted (larger replicas get more traffic). Implemented via ProxySQL, custom DB connector, or Octane connection pool.

---

# Core Concepts

- **Random (Laravel default)**: `'read' => ['host' => ['r1', 'r2', 'r3']]` — random pick per query. Simple but can skew.
- **Round-robin**: Distributes uniformly. Good for equal-sized replicas.
- **Least connections**: Routes to replica with fewest active queries. Best for heterogeneous replicas.
- **Weighted**: Larger replicas get proportionally more requests. Requires ProxySQL or custom routing.

---

# Patterns

**ProxySQL for weighted balancing**: Configure `mysql_servers` with weight. ProxySQL handles query distribution.

**Round-robin for equal replicas**: Simple to implement in Laravel connector. Good enough for balanced loads.

---

# Common Mistakes

**Uneven replica sizing with random balancing**: A smaller replica receives the same traffic as larger ones and becomes the bottleneck. Use weighted balancing.

---

# Related Knowledge Units

7.2 Read/write config | 7.8 Connection pooling replicas
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

