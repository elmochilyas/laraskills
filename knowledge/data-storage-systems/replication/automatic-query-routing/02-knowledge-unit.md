# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.3 Automatic query routing (how Laravel determines read/write queries)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel determines read vs write by checking the SQL statement's first word: SELECT, SHOW, DESCRIBE, EXPLAIN → read. INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write. The query builder and Eloquent inherit this routing. Raw `DB::statement()` is sent to the write connection.

---

# Core Concepts

- **Keyword detection**: `str_starts_with($query, 'select')` (case-insensitive). Simple heuristic. Works for most frameworks.
- **Write connection for transactions**: When a transaction is started, all queries use the write connection (read-your-writes consistency).
- **DB::statement routing**: Always goes to write connection. Use `DB::select()` for reads.

---

# Patterns

**Explicit read connection**: `DB::connection('mysql::read')->select(...)` — force read replica for specific queries.

**Transaction scoping**: `DB::transaction(function() { ... })` — all queries within use write connection. After commit, subsequent reads use replicas.

---

# Common Mistakes

**Assumption that SELECT routes to read replica**: `DB::statement('SELECT ...')` goes to write. Use `DB::select()` for read routing.

---

# Related Knowledge Units

7.2 Read/write config | 7.4 Sticky writes
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

