# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.4 Laravel Octane connection pool configuration (min/max connections)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Octane maintains a pool of database connections per worker. Configured via `'pool' => ['min' => 2, 'max' => 10]` in the database config. `min` = connections created at worker boot. `max` = maximum connections this worker can open. Pool prevents connection exhaustion and reduces per-request connect overhead.

---

# Core Concepts

- **Min connections**: Pre-warmed connections. Created when worker starts. Available immediately for first request. Set to expected concurrent requests per worker (e.g., 4).
- **Max connections**: Upper limit. Prevents worker from opening too many connections. Set to peak concurrent requests per worker (e.g., 10).
- **Connection reclamation**: Idle connections above `min` are closed after `pool.ttl` (default 60s). Keeps pool lean during low traffic.

---

# Patterns

**Pool sizing**: For 8 concurrent requests per worker: `min=4` (most requests see pre-warmed), `max=8` (enough for peak). Monitor actual usage.

**Separate pool for read/write**: Read replicas may have different pool configs. Write pool: `min=2, max=4`. Read pool: `min=4, max=10` (more read connections).

---

# Common Mistakes

**No pool config (default)**: Without `pool` config, Octane creates a new connection per request. Same as PHP-FPM. Always configure `pool`.

---

# Related Knowledge Units

10.2 Pool architecture | 10.7 Connection count management
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

