# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.7 Connection count management (max_connections, pool sizing, avoiding connection storms)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Database `max_connections` limits concurrent connections. Pool sizing: total pool ≤ max_connections - admin connections. Connection storms: traffic spike → many workers open connections simultaneously → max_connections exceeded → errors. Prevention: pooling, connection queueing, rate limiting.

---

# Core Concepts

- **max_connections**: MySQL default 151. PostgreSQL default 100. Configurable. Each connection uses ~2-10MB RAM. 500 connections = 1-5GB RAM.
- **Pool sizing formula**: Pool = (PHP-FPM workers × connections per worker) / multiplexing ratio. With pgbouncer transaction mode: 50 connections may serve 300 workers.
- **Connection storm**: New deployment or restart: 200 workers all connect simultaneously. Database sees 200 new connections in 1 second. Can overwhelm connection handler.

---

# Patterns

**Reserved admin connections**: MySQL: `reserved_connections = 5`. PostgreSQL: `superuser_reserved_connections = 3`. Always reserve connections for admin access.

**Graceful pool startup**: In Octane, configure `pool.min` to spread connection creation across worker boot time. Stagger by 100ms per worker.

---

# Common Mistakes

**Setting max_connections too high**: 1000 connections × 5MB = 5GB RAM just for connections. Increase RAM or limit pool size.

---

# Related Knowledge Units

10.2 Pool architecture | 10.8 Connection tags observability
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

