# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.20 Migration replication compatibility (DDL impact on replicas)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

DDL operations (ALTER TABLE, CREATE INDEX) on the primary replicate to replicas. Some DDL operations block replication until they complete on the replica. `ALGORITHM=INSTANT` DDL replicates instantly. `ALGORITHM=COPY` may cause replica lag. Always consider replication impact before running migrations in production.

---

# Core Concepts

- **DDL replication**: DDL statements are written to binlog and replayed on replicas. Long-running DDL (e.g., `ALTER TABLE ... ALGORITHM=COPY`) blocks replica apply thread.
- **Replica lock during DDL**: The replica executes the DDL sequentially (single-threaded for DDL). While DDL runs, no other events from primary are applied. Lag increases.
- **Migration strategies**: Use `ALGORITHM=INSTANT` or `INPLACE` for online DDL. Avoid long-running `COPY` during peak hours.

---

# Patterns

**Migration window for DDL**: Run migrations during low-traffic periods. Monitor replica lag during and after.

**pt-online-schema-change**: Percona Toolkit creates a shadow table, copies data incrementally, swaps. Minimizes replication impact.

---

# Common Mistakes

**ALTER TABLE during peak hours**: Locks tables, blocks replication apply. Replicas fall behind. User-facing queries hit lagged replicas.

---

# Related Knowledge Units

11.2 Online DDL | 11.6 ALTER TABLE strategies | 7.5 Replica lag
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

