# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.6 Replica lag monitoring (SHOW REPLICA STATUS, pt-heartbeat)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL `SHOW REPLICA STATUS` provides `Seconds_Behind_Master` (SBM) — seconds the replica is behind. Not reliable during replication errors or with long transactions. `pt-heartbeat` provides precise lag measurement by updating a timestamp on the primary and comparing on the replica.

---

# Core Concepts

- **Seconds_Behind_Master**: Calculated from binlog position difference. Can show 0 even when replica hasn't processed events (relay log gap).
- **pt-heartbeat**: Percona Toolkit tool. Updates `heartbeat` table on primary every second. Replica reads its local heartbeat row and computes lag = primary_time - replica_time. Accurate.
- **PostgreSQL lag**: `pg_current_wal_lsn() - pg_last_wal_receive_lsn()` gives bytes behind. `pg_last_xact_replay_timestamp()` gives timestamp lag.

---

# Patterns

**pt-heartbeat for production monitoring**: Run `pt-heartbeat --update` on primary, `pt-heartbeat --monitor` on replicas. Script output to monitoring system.

**Lag alerting**: Alert if lag > 30s for MySQL, > 10s for synchronous-sensitive workloads.

---

# Common Mistakes

**Relying solely on Seconds_Behind_Master**: During network issues, SBM may show 0 while replica hasn't received new events. Use pt-heartbeat.

---

# Related Knowledge Units

7.5 Replica lag causes | 7.7 Lag-aware read splitting
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

