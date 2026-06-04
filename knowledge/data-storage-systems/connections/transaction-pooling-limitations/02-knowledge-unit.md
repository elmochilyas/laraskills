# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.10 Transaction pooling limitations (prepared statements, session state, SET commands)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Transaction pooling (pgbouncer, ProxySQL) returns connections to the pool after each transaction. Since the next request may get a different connection, session-level state (prepared statements, SET SESSION, LISTEN/NOTIFY, session variables) is lost. Laravel's prepared statement usage requires `PDO::ATTR_EMULATE_PREPARES = true`.

---

# Core Concepts

- **Lost prepared statements**: Laravel prepares statements by default. With transaction pooling, a prepared statement created in transaction 1 is not available in transaction 2 (different connection).
- **Emulate prepares**: `'options' => [PDO::ATTR_EMULATE_PREPARES => true]` — PHP emulates prepared statements by inlining parameters into queries. No server-side prepare. Works with transaction pooling.
- **SET session variables**: `SET timezone = 'UTC'` — lost after connection returns to pool. Set per-transaction or use connection initialization queries.

---

# Patterns

**Pgbouncer init query**: `SET search_path = 'public'` cannot persist across transactions. Use `SET search_path TO 'public'` in each transaction. Pgbouncer can execute init queries on connection acquisition.

**Client-side prepared statements**: If using transaction pooling, always enable `ATTR_EMULATE_PREPARES`. Without it, prepared statement errors occur.

---

# Common Mistakes

**Using prepared statements with transaction pooling**: "Prepared statement already exists" error. Fix: enable emulate prepares or use session pooling.

---

# Related Knowledge Units

10.3 pgbouncer modes | 7.18 Transaction pooling
## Ecosystem Usage

pgBouncer is the standard PostgreSQL connection pooler. ProxySQL provides MySQL connection pooling. Laravel Octane requires connection pooling to prevent exhaustion.

## Failure Modes

Transaction pooling breaks SET session state. Connection starvation when all pool connections used. Pooler restart drops all connections.

## Performance Considerations

Pooling reduces connection overhead from 1-2ms to microseconds. Optimal pool size is 2x core_count plus spindle_count.

## Production Considerations

Monitor pool utilization. Use session pooling for Laravel compatibility. Configure max_client_conn for burst tolerance.

## Research Notes

pgBouncer transaction pooling is incompatible with Laravel session-state operations. ProxySQL query rules enable proxy-level read/write splitting.

## Internal Mechanics

pgBouncer maintains pre-established connections. Session pooling assigns connections for session duration. Transaction pooling returns connections after each transaction.

## Architectural Decisions

pgBouncer for PostgreSQL only. ProxySQL for MySQL/MariaDB with read/write split. Pgpool-II for PostgreSQL with read/write split.

## Tradeoffs

Benefit: Reduced connection overhead. Cost: Additional infrastructure. Benefit: Burst absorption. Cost: Pool sizing complexity.

## Mental Models

Connection pooling is valet parking. The valet keeps connections ready. Without a valet, each request fetches its own car from the garage.

