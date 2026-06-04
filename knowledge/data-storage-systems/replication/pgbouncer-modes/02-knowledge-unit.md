# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.18 PgBouncer modes (session, transaction, statement)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PgBouncer is a PostgreSQL connection pooler. Three modes: session (connection held for entire session — least efficient), transaction (connection returned to pool after transaction ends — recommended), statement (connection returned after each statement — fastest but limited by SET requirements). Transaction pooling is the standard for web applications.

---

# Core Concepts

- **Session pooling**: Client holds connection until disconnect. Same as persistent connections. Max connections = pool size.
- **Transaction pooling**: Client gets a connection for one transaction. Connection returned to pool on COMMIT/ROLLBACK. Efficient. Doesn't support session-level features (SET SESSION, LISTEN/NOTIFY, prepared statements).
- **Statement pooling**: Connection returned after each statement. Rarely used.

---

# Patterns

**Transaction pooling for Laravel**: Default `pgbouncer` config in Laravel. Use `'options' => ['pdo_options' => [PDO::ATTR_EMULATE_PREPARES => true]]` to avoid prepared statement issues.

**Session pooling for long-running queries**: Reporting/analytics connections may need session pooling. Dedicated pgbouncer instance for reports.

---

# Common Mistakes

**Prepared statements with transaction pooling**: Prepared statements are session-level. Create on each connection — fails in transaction mode. `ATTR_EMULATE_PREPARES` solves this.

---

# Related Knowledge Units

10.3 PgBouncer | 10.4 Connection pooling
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

