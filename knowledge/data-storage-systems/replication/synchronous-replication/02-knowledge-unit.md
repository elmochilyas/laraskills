# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.13 Synchronous replication (Galera, Group Replication, quorum)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Synchronous replication: all nodes must acknowledge a write before it commits. Galera Cluster (MariaDB/Percona XtraDB Cluster) and MySQL Group Replication implement this. Provides strong consistency and zero data loss. Cost: write latency is the slowest node's acknowledgment time. Quorum-based: if more than half of nodes fail, writes stop.

---

# Core Concepts

- **Certification-based replication**: All nodes receive the write, certify it (check for conflicts), commit simultaneously. If certification fails on any node, the write is rolled back.
- **Quorum**: Cluster requires > N/2 nodes to accept writes. 3-node cluster: tolerate 1 failure. 5-node: tolerate 2 failures. Split-brain prevention.
- **Write latency**: = max(node_ack_latency). In a 3-node cluster spanning 2 regions, write latency = cross-region round trip.

---

# Patterns

**Galera for zero-data-loss clusters**: Use when every write must be acknowledged by multiple nodes. Finance, compliance-critical apps.

**Group Replication for MySQL 8.0**: Built-in. Multi-primary or single-primary mode. Similar guarantees to Galera.

---

# Common Mistakes

**Wide-area Galera cluster**: 3 nodes across 3 continents. Write latency = 300ms+. Use local sync for HA, async for cross-region.

---

# Related Knowledge Units

7.1 Master-replica topology | 7.11 Failover
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

