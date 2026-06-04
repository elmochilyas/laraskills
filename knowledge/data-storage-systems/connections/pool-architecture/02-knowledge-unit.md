# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.2 Pool architecture (client-side vs server-side, ProxySQL, pgBouncer, RDS Proxy)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Client-side pooling: the application (Octane connection pool) manages connections. Server-side pooling: a proxy (ProxySQL, pgbouncer, RDS Proxy) sits between app and database, managing connections. Server-side pools share a fixed set of backend connections across many client connections. Recommended for PHP-FPM with many concurrent workers.

---

# Core Concepts

- **Client-side pool**: Octane's `PDOConnectionPool`. Pool lives in worker memory. Simple, no extra infrastructure. Requires Octane.
- **Server-side pool**: ProxySQL/pgbouncer. One proxy handles connections from many workers. Proxy manages backend connections. Works with any runtime (PHP-FPM, Octane, Swoole).
- **Multiplexing**: A server-side pool with 50 backend connections can serve 500 client connections by transaction multiplexing (pgbouncer transaction mode).

---

# Patterns

**pgbouncer + PHP-FPM**: Server-side pool for PHP-FPM deployments. Pgbouncer transaction mode. 50 backend connections serve 200+ PHP-FPM workers.

**Octane built-in pool**: Octane's PDO pool. No extra service. Pool per worker. Configure min/max connections.

---

# Common Mistakes

**No pool at all**: Each PHP-FPM worker opens its own connection. 200 workers → 200 database connections. `max_connections` exceeded.

---

# Related Knowledge Units

10.3 pgbouncer | 10.4 Octane connections | 10.9 Read/write separation
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

