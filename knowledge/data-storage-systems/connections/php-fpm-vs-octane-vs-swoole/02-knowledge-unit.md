# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.12 Connection behavior in PHP-FPM vs. Octane vs. Swoole
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PHP-FPM: new connection per request (connect + disconnect overhead). Octane: persistent connections per worker (connect once, reuse). Swoole: coroutine-based connection pooling (shared pool across coroutines). Connection pooling requirement differs: PHP-FPM needs server-side pool (pgbouncer). Octane uses built-in pool. Swoole uses coroutine pool.

---

# Core Concepts

- **PHP-FPM**: Short-lived process. Connection per request. Total connections = (workers × connections per request). High overhead. Server-side pooling required.
- **Octane**: Long-lived worker. Connection pool per worker. Total connections = (workers × pool size). Built-in pooling. No external pooler needed.
- **Swoole**: Coroutine-based. Shared connection pool across coroutines. Total connections = pool size (shared, not per worker). Most efficient.

---

# Patterns

**PHP-FPM + pgbouncer**: Use pgbouncer in transaction mode. 50 pool connections serve 300 PHP-FPM workers.

**Octane built-in pool**: Configure `'pool' => ['min' => 2, 'max' => 8]` in database config. No external pooler.

**Swoole coroutine pool**: `ConnectionPool` class with `get()` and `put()` methods. Coroutine-friendly. Max connections = pool size.

---

# Common Mistakes

**Octane DB config without pool**: Without `pool` config, Octane creates a new connection per request — same overhead as PHP-FPM.

---

# Related Knowledge Units

10.2 Pool architecture | 10.4 Octane pool | 6.16 Swoole coroutine dispatch
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

