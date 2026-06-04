# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.8 Connection tags and observability (application_name, per-connection metadata)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Set per-connection metadata to identify the application, tenant, or request in database monitoring. PostgreSQL: `SET application_name = 'laravel-web'`. MySQL: `SET @@session.metrics = 'tenant:123'`. Shows in `pg_stat_activity` or `SHOW FULL PROCESSLIST`. Helps identify problematic connections without asking "which app?"

---

# Core Concepts

- **application_name (PostgreSQL)**: `config(['database.connections.pgsql.application_name' => 'app_'.$tenant])`. Set per connection. Visible in `pg_stat_activity`.
- **MySQL connection attributes**: `$pdo->setAttribute(PDO::ATTR_CONNECTION_STATUS, 'tenant_id:123')`. Visible in `SHOW FULL PROCESSLIST`.
- **Per-request tagging**: In middleware, execute `SET application_name = 'web|user:'.$userId` after connection. Overrides the default.

---

# Patterns

**Tenant tagging**: `SET application_name = 'laravel|tenant:'.$tenantId`. When a tenant's query is slow, identify it immediately from the process list.

**Connection purpose tagging**: Web, worker, horizon, reporting. `SET application_name = 'horizon|queue:high'`. Separates connection types.

---

# Common Mistakes

**Not tagging connections**: DBA asks "which app is running this query?" — unclear. Always tag connections with application and purpose.

---

# Related Knowledge Units

10.1 Connection lifecycle | 5.5 Global scopes
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

