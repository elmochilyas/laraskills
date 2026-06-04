# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.17 ProxySQL query routing rules for read/write split
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

ProxySQL sits between Laravel and MySQL, routing queries based on rules. Read/write split rules: regex match SELECT queries → route to read hostgroup. All other queries → write hostgroup. ProxySQL also provides connection pooling, query caching, and firewall rules.

---

# Core Concepts

- **Hostgroups**: Define `mysql_servers` with hostgroup IDs. hostgroup 0 = writers, hostgroup 1 = readers.
- **Query rules**: `SELECT ^SELECT.*→ hostgroup 1`. Rules evaluated top-down. First match wins. `^SELECT... FOR UPDATE` → hostgroup 0.
- **Connection pooling**: ProxySQL maintains persistent connections to MySQL. Laravel connects to ProxySQL via standard MySQL client.

---

# Patterns

**Default rule**: Insert rule at lowest priority: `^SELECT.*FOR UPDATE` → hostgroup 0 (write). `^SELECT` → hostgroup 1 (read). Default → hostgroup 0.

**User-based routing**: Route specific application users to specific hostgroups. Admin queries to write, user queries to read.

---

# Common Mistakes

**No FOR UPDATE handling**: `SELECT ... FOR UPDATE` must go to write. Without specific rule, it routes to read replica, causing stale locks.

---

# Related Knowledge Units

7.2 Read/write config | 7.8 Connection pooling replicas | 6.19 Shard proxy
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

