# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.12 Cascading replication (replica → replica chain)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cascading replication: a replica replicates from another replica (not directly from the primary). Reduces load on the primary (fewer direct replica connections). Used for multi-region: region-A replica → region-B replica → region-C replica. Adds replication lag at each level.

---

# Core Concepts

- **Chained topology**: Primary → Replica A → Replica B → Replica C. A replicates from primary. B replicates from A. C replicates from B.
- **Lag accumulation**: Each hop adds network RTT + apply time. 3-hop chain: 3x the lag of a direct replica.
- **Primary load reduction**: Primary handles only one replica connection instead of many. Reduces binlog dump overhead.

---

# Patterns

**Cascade for read scaling**: Primary → 1-2 direct replicas → each serves 10 downstream replicas. Primary's binlog dump is limited.

**Multi-region cascade**: Primary in us-east-1 → replica in us-west-2 → replica in ap-southeast-1. Each region has its own downstream replicas.

---

# Common Mistakes

**Deep cascade chains (>3 levels)**: High lag, complex failure diagnosis. Each intermediate replica failure breaks all downstream replicas.

---

# Related Knowledge Units

7.1 Master-replica topology | 7.10 Multi-region replication
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

