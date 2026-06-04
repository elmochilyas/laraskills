# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.6 Connection purging and reconnection (DB::purge, DB::reconnect)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

`DB::purge('connection')` removes a connection from Laravel's connection resolver. `DB::reconnect('connection')` purges and immediately creates a new connection. Essential after runtime config changes (tenant switching, failover, credential rotation). Purging ensures stale PDO objects are not reused.

---

# Core Concepts

- **DB::purge(name)**: Removes the PDO object from the `ConnectionFactory` resolver. Sets connection as "unresolved". Next access recreates it.
- **DB::reconnect(name)**: Purges + resolves immediately. Returns the new connection instance.
- **Side effects**: All existing Eloquent model instances that hold a reference to the old connection will still use the old PDO. Subsequent queries from those models may fail.

---

# Patterns

**Failover reconnect**: When primary fails, update config to new primary host, `DB::purge('mysql')`, `DB::reconnect('mysql')`. All subsequent queries use the new primary.

**Credential rotation**: Rotate DB credentials. Update config, purge, reconnect. No application restart needed.

---

# Common Mistakes

**Not purging old connections on reconnect**: `DB::connection('mysql')->disconnect()` does not clear the resolver cache. `DB::purge()` is necessary.

---

# Related Knowledge Units

10.5 Dynamic connection config | 16.11 Connection failover
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

