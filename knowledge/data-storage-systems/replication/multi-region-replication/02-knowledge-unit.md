# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.10 Multi-region replication (cross-region replicas, latency considerations)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Multi-region replication maintains replicas in different geographic regions for read latency optimization and disaster recovery. Cross-region latency (50-200ms) causes higher replication lag. Async replication is standard — the primary doesn't wait for cross-region replicas. Use-cases: serve reads from nearest region, DR failover, data residency compliance.

---

# Core Concepts

- **Cross-region latency**: Physical distance adds propagation delay. US-West to US-East: ~40ms. US to Europe: ~100ms. US to Asia: ~150-200ms.
- **Replication lag across regions**: Lag = network round-trip + apply time. Typically 1-5 seconds for cross-region async replication.
- **DR (disaster recovery)**: Cross-region replica serves as failover target if primary region goes down.

---

# Patterns

**Active-passive multi-region**: Primary in us-east-1. Replica in eu-west-1 serves reads. Failover promotes eu-west-1 replica to primary.

**Active-active (multi-primary)**: Multiple writable regions with bidirectional replication. Conflict resolution required. Complex.

---

# Common Mistakes

**Expecting low lag on cross-region replicas**: 100ms RTT means minimum 100ms lag. Add apply time: 200ms-5s typical. Design for eventual consistency.

---

# Related Knowledge Units

7.5 Replica lag | 7.11 Failover | 5.23 Multi-region tenant placement
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

