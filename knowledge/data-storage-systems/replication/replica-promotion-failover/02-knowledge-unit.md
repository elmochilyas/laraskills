# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.11 Replica promotion and failover (manual vs. automated)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Failover promotes a replica to primary when the current primary fails. Manual: ops team runs `ALTER TABLE ...`, updates DNS, Laravel config. Automated: orchestrator (Orchestrator, RDS Multi-AZ, Patroni) handles promotion, VIP reassignment, and app routing update. RPO (Recovery Point Objective) and RTO (Recovery Time Objective) determine failover strategy.

---

# Core Concepts

- **Manual failover**: Ops identifies failure, promotes replica (`SET GLOBAL read_only = OFF`), updates application config/connections, restarts workers. RTO: 5-30 minutes.
- **Automated failover**: Orchestrator detects primary failure, promotes the most advanced replica, reassigns VIP. RTO: 10-60 seconds.
- **RPO**: Data loss during failover. Async: up to N seconds of writes. Semi-sync: zero data loss.

---

# Patterns

**Automated failover for production**: Use Orchestrator (MySQL) or Patroni (PostgreSQL). Test failover monthly. Verify app reconnects correctly.

**Manual failover for maintenance**: Planned switchover (not failover). Used for primary upgrades. Demote primary, promote replica, update config.

---

# Common Mistakes

**No failover testing**: Failover works in theory. Test it. Monthly failover drills. Verify app reconnects without manual config changes.

---

# Related Knowledge Units

7.1 Master-replica topology | 7.5 Replica lag | 7.12 Cascading replication
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

