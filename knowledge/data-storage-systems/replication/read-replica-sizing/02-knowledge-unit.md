# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.16 Read replica sizing (matching replica capacity to primary write volume)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

A replica must have sufficient CPU, IOPS, and memory to replay the primary's write volume. If replica capacity < primary write throughput, lag grows indefinitely. Rule of thumb: replica should have at least the primary's CPU/memory. For write-heavy workloads, replicas may need more IOPS than the primary.

---

# Core Concepts

- **Apply overhead**: Replica applies every write from the primary plus serves read queries. Total load on replica = replay load + read load.
- **Replay load**: Replica must have enough IOPS to write all binlog events + enough CPU to execute them. Log writes are sequential (easier on replicas).
- **Storage throughput**: Replicas need similar storage throughput as primary for binlog replay.

---

# Patterns

**Same instance size for replicas**: Start with same size as primary. If replica lag persists, increase replica size before increasing primary.

**Larger replicas for read-heavy workloads**: If replica serves 80% of reads, it needs more capacity than the primary. Right-size per workload.

---

# Common Mistakes

**Under-provisioned replicas**: Small replicas fall behind during peak write hours. Lag accumulates, never catches up. Always match primary's spec minimally.

---

# Related Knowledge Units

7.5 Replica lag | 7.8 Connection pooling replicas
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

