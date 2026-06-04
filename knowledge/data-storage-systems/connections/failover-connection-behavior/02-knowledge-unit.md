# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.16 Connection failover behavior (transparent reconnect, connection string rotation)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

When the primary database fails, connections must be re-established to the new primary. Connection failover strategies: DNS-based (update DNS record, wait for TTL), proxy-based (ProxySQL detects failure, routes to new primary), config-based (Laravel detects failure, updates config, purges, reconnects). Transparent failover: the application retries the failed query without error.

---

# Core Concepts

- **DNS failover**: Update DB_HOST DNS record to point to new primary. TTL determines delay. Simple but TTL-dependent.
- **Proxy failover (ProxySQL)**: ProxySQL monitors backend health. When primary fails, routes queries to promoted replica. Application doesn't see connection change.
- **Application-level failover**: Detect connection failure, read new primary host from config/API, `config()->set('database.connections.mysql.host', $newHost)`, `DB::purge('mysql')`, retry query.

---

# Patterns

**Proxy-level failover (recommended)**: ProxySQL or RDS Proxy handles failover transparently. Laravel connects to proxy. No application changes needed.

**Laravel retry connection**: `DB::transaction()` with retry. On connection failure, update config, reconnect, retry. `for ($i=0; $i<3; $i++) { try { ... } catch (QueryException $e) { if (Str::contains($e->getMessage(), 'lost connection')) { DB::purge(...); sleep(1); } else throw; } }`.

---

# Common Mistakes

**No failover handling**: Primary fails. Application holds dead connections. All requests fail until workers are restarted.

---

# Related Knowledge Units

7.11 Failover | 10.6 Connection purging
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

