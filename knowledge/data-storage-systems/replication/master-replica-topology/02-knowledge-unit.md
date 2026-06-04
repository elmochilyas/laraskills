# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.1 Master-replica topology (async, semi-sync, sync replication)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Master-replica topology: one primary (write) node and one or more replica (read) nodes. Replication modes: asynchronous (default MySQL, low latency, possible data loss), semi-synchronous (at least one replica confirms), synchronous (all replicas confirm, highest durability). The mode determines data loss risk on primary failure.

---

# Core Concepts

- **Async replication**: Primary commits without waiting for replicas. Fastest writes. Risk: if primary fails before replica receives the write, data is lost.
- **Semi-sync replication**: Primary waits for at least one replica to confirm receipt. Zero data loss if configured with `rpl_semi_sync_master_wait_point=AFTER_SYNC`.
- **Sync replication**: Primary waits for all replicas to confirm. Slowest writes. Rarely used in production (Galera, PostgreSQL synchronous_commit).

---

# Patterns

**Semi-sync for production**: Default for production workloads. Prevents data loss while keeping write latency manageable.

**Async for read replicas**: Use async for replicas used only for reporting/analytics. Acceptable to serve slightly stale data.

---

# Common Mistakes

**Async replication for critical data**: Primary fails before replica syncs → data loss. Use semi-sync for production writes.

---

# Related Knowledge Units

7.2 Laravel read/write config | 7.5 Replica lag causes
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

