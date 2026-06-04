# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.14 Connection health checks (hearbeat queries, idle connection timeout)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Connection health checks verify that pooled connections are still alive. Idle connections can be dropped by the database (wait_timeout, idle_in_transaction_session_timeout), proxy (pgbouncer server_idle_timeout), or network equipment. Health check: `SELECT 1` (MySQL) or `SELECT 1` (PostgreSQL) — minimal query that validates the connection works.

---

# Core Concepts

- **Heartbeat query**: `DB::select('SELECT 1')` before using a pooled connection. If it fails, discard connection and create new one.
- **Idle timeout**: MySQL `wait_timeout` (default 28800s = 8h). PostgreSQL `idle_in_transaction_session_timeout` (default 0 = disabled). Pooler must expect connection drops.
- **Octane health check**: Octane automatically checks connection health before returning from pool. Dead connections are recreated.

---

# Patterns

**Laravel connection heartbeat**: `'options' => ['pdo_options' => [PDO::ATTR_EMULATE_PREPARES => true, PDO::ATTR_TIMEOUT => 2]]`. Low timeout for connection check.

**ProxySQL health check**: ProxySQL automatically checks backend health. `mysql-monitor_connect_interval` and `mysql-monitor_ping_interval`. Dead backends removed from hostgroup.

---

# Common Mistakes

**No health check on pooled connections**: Connection died (DB restart, timeout). Pool returns dead connection. Query fails. Always verify before use.

---

# Related Knowledge Units

10.1 Connection lifecycle | 10.7 Connection count
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

