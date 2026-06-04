# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.15 ProxySQL query rules and connection handling
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

ProxySQL provides advanced connection handling: query rules (route queries by regex to specific hostgroups), connection multiplexing (client-side multiplexing reduces backend connections), query caching (TTL-based cache for identical queries), and query rewriting. Connection handling: health checks, idle timeout, max connections per host.

---

# Core Concepts

- **Connection multiplexing**: When `multiplexing = 1` (default), ProxySQL can send queries from different clients through the same backend connection. Only safe if no session-state is used.
- **Query rules**: Rule `SELECT ^SELECT.*→ hostgroup 1`. `^SELECT ... FOR UPDATE → hostgroup 0`. Rules can match by user, schema, digest, or regex.
- **Connection pooling settings**: `mysql-max_connections` (max backend connections), `mysql-default_query_timeout`, `mysql-poll_timeout`.

---

# Patterns

**ProxySQL for read/write split**: Hostgroup 0 (writers): single primary. Hostgroup 1 (readers): 3 replicas. Query rule: `^SELECT → hostgroup 1`. `^SELECT.*FOR UPDATE → hostgroup 0`. Default → hostgroup 0.

**Query cache for repeated queries**: `SELECT COUNT(*) FROM orders WHERE status = ?` — cache TTL 1s. Reduces identical queries during traffic spikes.

---

# Common Mistakes

**Multiplexing without understanding session state**: Laravel uses `SET NAMES utf8mb4`, session timezone, etc. With multiplexing, these leak between sessions. Disable multiplexing or use connection init.

---

# Related Knowledge Units

7.17 ProxySQL routing | 10.2 Pool architecture
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

