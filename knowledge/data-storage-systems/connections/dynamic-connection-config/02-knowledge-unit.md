# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.5 Dynamic connection configuration (config in middleware, runtime connection switching)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Laravel allows dynamic connection configuration at runtime: `config(['database.connections.tenant.database' => 'tenant_'.$id])`. Used for multi-tenant DB-per-tenant, shard routing, and environment-specific connections. After changing config, purge the connection (`DB::purge('tenant')`) to force reconnection on next query.

---

# Core Concepts

- **Config override**: `config()->set()` at runtime. Changes apply to subsequent calls. Does not affect existing connections.
- **DB::purge(connection)**: Removes the connection from the connection factory. Next `DB::connection('tenant')` call creates a new connection with the updated config.
- **Reconnect**: `DB::reconnect('tenant')` — convenience method that purges and reconnects.

---

# Patterns

**Tenant connection in middleware**: `IdentifyTenant` middleware sets tenant DB name in config, purges/reconnects. Subsequent queries use the correct database.

**Shard routing**: `Model::getConnectionName()` returns `'shard_'.$this->shardId`. Dynamic connection resolution per model instance.

---

# Common Mistakes

**Not purging after config change**: `config(['database.connections.tenant.host' => 'new_host'])` but old PDO object is still cached. `DB::purge()` is required before reconnect.

---

# Related Knowledge Units

5.6 Tenant middleware | 5.25 Tenant bootstrapper | 6.5 Shard routing
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

