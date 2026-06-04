# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.5 Replica lag causes (long transactions, DDL, heavy writes, insufficient replica capacity)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Replica lag is the delay between a write on the primary and its appearance on the replica. Common causes: long-running transactions holding binlog position, DDL operations (ALTER TABLE) blocking replication, write bursts exceeding replica apply capacity, undersized replicas, and network latency between primary and replica.

---

# Core Concepts

- **Long transactions**: `BEGIN ... UPDATE ... wait ... COMMIT`. The replica can't apply the transaction until it's committed on primary.
- **DDL operations**: `ALTER TABLE` on the primary runs on the replica after receiving the event. `LOCK=SHARED`, `ALGORITHM=INPLACE` on primary but `ALGORITHM=COPY` on replica.
- **Replica apply capacity**: If write rate on primary exceeds replica's CPU/IO capacity to replay binlog, lag grows indefinitely.

---

# Patterns

**Monitor `Seconds_Behind_Master` (MySQL)** or `pg_current_wal_lsn() - pg_last_wal_receive_lsn()` (PostgreSQL). Alert if lag > threshold (e.g., 30s).

**Throttle writes during replica lag**: If lag exceeds threshold, pause non-critical writes or reduce write throughput.

---

# Common Mistakes

**Adding replicas without increasing capacity**: More replicas don't fix lag if the primary is the bottleneck. Fix the primary first.

---

# Related Knowledge Units

7.6 Lag monitoring | 7.7 Lag-aware read splitting
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

