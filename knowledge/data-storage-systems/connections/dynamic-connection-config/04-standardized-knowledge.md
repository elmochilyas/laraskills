# 10.5 Dynamic Connection Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.5 |
| Knowledge Unit Title | Dynamic connection configuration (config in middleware, runtime connection switching) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.6 Tenant middleware, 5.25 Tenant bootstrapper, 6.5 Shard routing |
| Last Updated | 2026-06-02 |

## Overview

Laravel allows dynamic connection configuration at runtime: `config(['database.connections.tenant.database' => 'tenant_'.$id])`. Used for multi-tenant database-per-tenant architectures, shard routing, and environment-specific connection switching. After changing config, the connection must be purged (`DB::purge('tenant')`) to force reconnection on the next query. Without purging, the stale PDO object is reused.

## Core Concepts

- **Config override**: `config()->set()` modifies the runtime configuration. Changes apply to subsequent `DB::connection()` calls but do not affect already-resolved connections.
- **DB::purge(connection)**: Removes the connection from Laravel's connection resolver. The next `DB::connection('tenant')` call creates a new connection using the updated config.
- **DB::reconnect(connection)**: Convenience method that purges the connection and immediately creates a new one. Equivalent to `DB::purge($name); return DB::connection($name);`.
- **Connection caching**: Laravel caches resolved PDO objects. Without purging, the same connection is reused indefinitely regardless of config changes.
- **Per-model connection resolution**: Models can override `getConnectionName()` to return a dynamic connection name based on instance attributes (e.g., shard ID).

## When To Use

- Multi-tenant applications with database-per-tenant architecture
- Sharded databases where model instances route to different shards
- Credential rotation without application restart
- Runtime failover to a different database host
- Test environments switching between database configurations dynamically

## When NOT To Use

- Single-database applications (adds unnecessary complexity)
- Applications using PgBouncer session pooling (pool state conflicts with dynamic config)
- Simple tenant isolation with global scopes (shared-table architecture doesn't need dynamic connections)
- Octane applications with aggressive pool caching (dynamic config may conflict with pre-warmed pools)

## Best Practices

- **Always purge after config change**: `DB::purge()` is mandatory after `config()->set()`. **Why**: The connection resolver caches PDO objects by connection name. Config changes without purging have no effect — the old PDO object is reused. This is the most common bug in dynamic connection implementations.
- **Use middleware for tenant connection switching**: An `IdentifyTenant` middleware should resolve the tenant, set the database config, purge, and reconnect. **Why**: Middleware runs early in the request lifecycle, ensuring all subsequent queries use the correct connection without scattered config()-purge calls in controllers.
- **Prefer `DB::reconnect()` for failover**: When switching to a new primary host, use `DB::reconnect()` rather than `DB::purge()` + separate connect. **Why**: Reconnect is atomic — purge and connect happen in one call, reducing the window where a stale connection could be used.
- **Tag connections for observability**: Set `application_name` or connection attributes after reconnecting. **Why**: When debugging slow queries in `pg_stat_activity`, tagged connections identify which tenant or shard is responsible.
- **Handle connection failures gracefully**: Dynamic config can point to a non-existent database. Wrap connection resolution in try-catch and provide meaningful error responses.

## Architecture Guidelines

- Dynamic connection config is fundamental to database-per-tenant and sharding architectures.
- For database-per-tenant: configure the base connection template in `config/database.php`, then override the `database` name at runtime.
- For sharding: configure shard host credentials in a service or config file, then set the appropriate connection at model hydration time.
- In Octane, dynamic config changes affect only the current worker. Other workers may have different states. Use `DB::purge()` carefully in persistent worker environments.
- For high-traffic dynamic connections, consider a connection pooler (PgBouncer, ProxySQL) between the dynamic connections and the database, managed at the pooler level rather than the application level.

## Performance Considerations

- `DB::purge()` + reconnect adds ~1–50ms latency per switch, depending on network and SSL.
- Avoid purging/reconnecting on every request in shared-table tenancy — only needed for database-per-tenant or per-shard routing.
- Dynamic config reads from the config array are in-memory and fast (<0.01ms).
- In Octane, frequent purge/reconnect defeats the purpose of persistent connections. Minimize dynamic switches in Octane or use higher-level routing (e.g., ProxySQL).
- Connection initialization queries (SET NAMES, SET search_path, SET timezone) add ~5–20ms per connection. Batch these into the PDO options or Octane pool initialization.

## Security Considerations

- Dynamic config often modifies `database`, `username`, and `password` at runtime. Ensure these values come from trusted sources (authenticated tenant data, signed tokens).
- Never accept raw database credentials from user input. Resolve tenant/shard credentials from a secure mapping service.
- After purge, the old PDO object is garbage collected. No sensitive data remains accessible.
- Log all dynamic connection changes for audit trails, especially credential rotations and failover events.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Config change without purge | Developer sets `config(['database.connections.*'])` but doesn't call `DB::purge()` | Old connection reused; wrong database accessed | Always call `DB::purge($name)` after config()->set() |
| 2 | Per-request purge in shared-table tenant | Developer purges connection on every request for tenant isolation | Wasteful; adds 1–50ms overhead per request | Only purge when switching databases, not for row-level tenant isolation |
| 3 | Purging wrong connection name | Purge called on 'mysql' when dynamic connection named 'tenant' | Default connection remains stale | Purge the specific dynamic connection name |
| 4 | Not reconnecting after failover config change | Host changed in config but old PDO still points to dead host | "Lost connection" errors persist | Use DB::reconnect() which combines purge + connect |

## Anti-Patterns

- **Reconfiguring the `default` connection at runtime**: Modifying `database.default` mid-request creates confusion about which connection models resolve to. Use named connections instead.
- **Hardcoding credentials in config()-set()**: `config()->set('database.connections.tenant.password', 'secret')` in code. Credentials should come from environment variables or a secrets manager.
- **Purge/connect in every model constructor**: Dynamic connection resolution should be lazy — use `getConnectionName()` on the model rather than purging in a trait constructor.

## Examples

```php
// Middleware — tenant database switching
class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::resolve($request);

        config([
            'database.connections.tenant.database' => 'tenant_'.$tenant->id,
            'database.connections.tenant.username' => $tenant->db_username,
            'database.connections.tenant.password' => decrypt($tenant->db_password),
        ]);

        DB::purge('tenant');

        // Execute initialization query on new connection
        DB::connection('tenant')->statement('SET search_path TO '.$tenant->schema);

        return $next($request);
    }
}

// Model — dynamic connection per shard
class Order extends Model
{
    public function getConnectionName(): string
    {
        return 'shard_'.$this->shard_id;
    }
}

// Config template
'database.connections.shard_0' => [
    'driver' => 'mysql',
    'host' => env('SHARD_0_HOST'),
    'database' => 'shard_0',
    'username' => env('SHARD_0_USER'),
    'password' => env('SHARD_0_PASS'),
],
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, Laravel config system
- **Closely Related**: 10.6 Connection purging and reconnection, 5.6 Tenant-aware middleware
- **Advanced**: 6.5 Shard routing, 5.25 Tenant bootstrapper pattern
- **Cross-Domain**: 7.2 Laravel read/write config, 5.4 Tenant resolution strategies

## AI Agent Notes

- Most common issue with dynamic connections: config changed but not purged
- Always recommend `DB::reconnect()` over manual purge-then-connect
- For Octane, dynamic config is per-worker — avoid patterns that depend on shared state
- Check that `config/database.php` has the base connection defined before dynamic overrides
- Verify that purging the connection doesn't affect other in-flight requests using the same connection name

## Verification

- [ ] `config()->set()` is always followed by `DB::purge()` for the same connection name
- [ ] Dynamic connections have unique names (not overriding `mysql` or `pgsql`)
- [ ] Model's `getConnectionName()` returns valid connection names
- [ ] No stale connection errors after dynamic switches
- [ ] Credentials for dynamic connections come from secure sources (env, secrets manager, encrypted DB)
- [ ] Connection tagging is in place for observability
