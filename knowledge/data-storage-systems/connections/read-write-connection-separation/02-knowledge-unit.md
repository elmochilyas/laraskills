# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.9 Read/write connection separation (dedicated read connections vs. merged)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Separate read and write connections have different pool configurations and failover behaviors. Read pool: larger (more replicas), tolerant of stale data. Write pool: smaller (single primary), strict consistency. Pool sizing, health checks, and failover handling differ per pool.

---

# Core Concepts

- **Read pool**: Multiple replica hosts, larger pool size, `application_name` tagged as `read`, tolerant of connection failures.
- **Write pool**: Single primary host (or cluster), smaller pool size, strict connection health checks, fails over to replica on primary failure.
- **Laravel config**: Separate `'pool'` config for read and write arrays in `database.php`.

---

# Patterns

**Asymmetric pool sizing**: Read pool: `min=4, max=16`. Write pool: `min=2, max=4`. Reads are more frequent, need more connections.

**Read fallback**: When all read replicas fail, fall back to write connection for reads. Degraded but functional.

---

# Common Mistakes

**Same pool config for read and write**: Write pool may have too many connections (waste). Read pool may have too few (bottleneck).

---

# Related Knowledge Units

7.2 Read/write config | 7.8 Connection pooling replicas
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

