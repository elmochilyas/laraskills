# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.3 PgBouncer pooling modes (session, transaction, statement)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PgBouncer has three pooling modes. Transaction mode (recommended for Laravel): client gets a connection for one transaction, then returns it to pool. Session mode: client holds connection for entire session duration (less efficient). Statement mode: connection returned after each statement (most efficient, but breaks SET/LISTEN).

---

# Core Concepts

- **Session pooling**: Connection is assigned to a client until the client disconnects. Pool utilization = active clients / pool size. Inefficient for web apps.
- **Transaction pooling**: Connection assigned for duration of one transaction. After COMMIT/ROLLBACK, connection returns to pool. Next client may get a different connection. No session state (prepared statements, SET SESSION) persists.
- **Statement pooling**: Connection assigned per statement. Even less state persistence.

---

# Patterns

**Transaction mode + Eloquent**: Eloquent uses prepared statements internally. With transaction pooling, set `PDO::ATTR_EMULATE_PREPARES => true` to avoid "prepared statement already exists" errors.

**Session mode for admin tools**: Tools like `psql` or admin panels that rely on session state (SET, temporary tables). Dedicated pgbouncer port in session mode.

---

# Common Mistakes

**Transaction pooling with persistent prepared statements**: Laravel's `PDO::ATTR_EMULATE_PREPARES = false` (default) + pgbouncer transaction mode = errors. Use `emulate_prepares` in config.

---

# Related Knowledge Units

7.18 pgbouncer modes | 10.2 Pool architecture
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

