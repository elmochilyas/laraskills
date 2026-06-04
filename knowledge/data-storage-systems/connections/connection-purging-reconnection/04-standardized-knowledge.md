# 10.6 Connection Purging and Reconnection

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.6 |
| Knowledge Unit Title | Connection purging and reconnection (DB::purge, DB::reconnect) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.5 Dynamic connection config, 7.11 Connection failover |
| Last Updated | 2026-06-02 |

## Overview

`DB::purge('connection')` removes a connection from Laravel's connection resolver. `DB::reconnect('connection')` purges and immediately creates a new connection. These methods are essential after runtime config changes (tenant switching, failover, credential rotation). Purging ensures stale PDO objects are not reused. Without explicit purge, Laravel's connection factory caches PDO objects indefinitely.

## Core Concepts

- **DB::purge(name)**: Removes the PDO object from the `ConnectionFactory` resolver. The connection is marked as "unresolved." The next `DB::connection(name)` call recreates it from the current config.
- **DB::reconnect(name)**: Atomic operation that purges and resolves immediately. Returns the new connection instance. Equivalent to `DB::purge($name); return DB::connection($name);`.
- **Side effects**: Existing Eloquent model instances that hold references to the old connection (via `getConnection()`) will still use the old PDO. Subsequent queries from those hydrated models may fail or target the wrong database.
- **Connection resolver cache**: Laravel's `DatabaseManager` caches resolved `Connection` instances in an array keyed by connection name. `purge()` removes the key; `reconnect()` removes and re-adds it.
- **Scope of purge**: Purge affects only the current process (PHP-FPM) or worker (Octane). Other workers or processes are unaffected.

## When To Use

- After `config()->set()` changes to connection parameters (host, database, username, password)
- During database failover: update config to new primary host, purge, reconnect
- During credential rotation: update credentials in config, purge, reconnect
- After a connection becomes stale (PHP "gone away" error): purge the dead connection and reconnect
- In multi-tenant middleware switching to a different tenant database

## When NOT To Use

- On every request for shared-table tenancy (unnecessary purge overhead)
- When no config change has been made (purge without config change just drops and re-creates the same connection)
- Inside tight loops (purge + reconnect is ~1–50ms per call)
- On the default connection without considering that models may resolve to `default`

## Best Practices

- **Always pair config()->set() with purge()**: Changing config without purging has no effect on already-resolved connections. **Why**: Laravel resolves connections lazily and caches them. The cache is only invalidated by `purge()`. Without it, the application silently uses the old connection, often leading to hard-to-debug data leaks.
- **Use `DB::reconnect()` for simplicity**: Prefer `DB::reconnect()` over manual purge-then-connect. **Why**: It's atomic and reduces the window where a stale connection could be referenced. It also returns the new connection for immediate use.
- **Re-hydrate models after purge**: If models were loaded before the purge, they reference the old connection. Re-query or re-hydrate after switching. **Why**: Model instances cache their connection in `$connection` property. A purged connection is only cleared from the resolver, not from loaded models.
- **Handle purge failure gracefully**: Wrap purge/reconnect in try-catch. If the new connection fails (wrong credentials, unreachable host), catch the exception, log, and maintain the old connection if possible.
- **Avoid purging in transactional context**: If an open transaction exists on the connection being purged, the transaction is lost (uncommitted work is rolled back). Ensure no active transactions before purging.

## Architecture Guidelines

- Purge/reconnect is the mechanism for runtime connection switching in Laravel. All multi-database patterns (tenancy, sharding, failover) depend on it.
- In Octane, purge affects the current worker's pool. Other workers are unaffected. This means a failover config change must be propagated to all workers (usually via worker restart or shared config service).
- For database-per-tenant architectures, purge/reconnect happens in middleware once per request. This is acceptable overhead (~1–50ms) compared to the work done in the request.
- For failover scenarios, combine purge/reconnect with a retry loop: attempt query → catch connection error → purge → reconnect → retry query.

## Performance Considerations

- `DB::purge()` itself is fast (<0.01ms) — it just removes a key from an array.
- `DB::reconnect()` adds full connection latency (TCP handshake, auth, SSL: 1–50ms).
- Frequent purge/reconnect in Octane creates connection churn that reduces the benefit of persistent workers.
- On PHP-FPM, purge/reconnect happens per-request anyway (connections don't persist between requests), so the overhead is negligible.
- Total overhead estimate: 10 middleware-purge cycles per second = 10–500ms of connection time per second.

## Security Considerations

- Purging removes the PDO object from scope, allowing garbage collection. No sensitive data (credentials) remains accessible in PHP memory after the PDO is collected.
- After credential rotation, purge ensures the new credentials are used immediately, closing the window of exposure for compromised credentials.
- If purge fails (new connection can't be established), the application should fail closed (reject requests) rather than silently using old cached credentials.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Config change without purge | `config()->set()` called but no `DB::purge()` | Stale PDO reused; queries go to wrong host/database | Always call `DB::purge()` after config changes |
| 2 | Purging but not reconnecting | `DB::purge()` called, next query lazily reconnects | Works but first query after purge pays connection overhead | Use `DB::reconnect()` to eagerly create connection |
| 3 | Purging wrong connection name | Purge called on 'mysql' while dynamic connection is 'tenant' | Default connection stale, dynamic connection still cached | Verify connection name matches exactly |
| 4 | Purging inside transaction | `DB::beginTransaction()` → `DB::purge('mysql')` | Transaction silently lost; uncommitted changes rolled back | Complete transactions before purging |
| 5 | Not re-hydrating models after purge | Model loaded before purge, then queried after | Model queries use stale connection | Re-query affected models or use fresh() |

## Anti-Patterns

- **Purge-reconnect in every model accessor**: Calling `DB::purge()` inside an accessor, mutator, or model event. This creates connection storms and defeats caching.
- **Purge without config change**: Purging just to get a "fresh" connection without changing config. Normal connection pooling handles this.
- **Silent purge in service providers**: Purging connections in a service provider's `boot()` method without logging. This can break other components that rely on the connection.
- **Purge + reconnect without error handling**: `DB::reconnect()` throws an exception if the connection fails. Always wrap in try-catch.

## Examples

```php
// Failover — update config, purge, reconnect, retry
function executeWithFailover(callable $query, int $retries = 3): mixed
{
    for ($attempt = 0; $attempt < $retries; $attempt++) {
        try {
            return $query();
        } catch (QueryException $e) {
            if (Str::contains($e->getMessage(), ['lost connection', 'gone away', 'could not connect'])) {
                $newHost = ConfigService::getPrimaryHost();
                config(['database.connections.mysql.host' => $newHost]);
                DB::reconnect('mysql');
                usleep(100_000); // 100ms backoff
                continue;
            }
            throw $e;
        }
    }
    throw new RuntimeException('Query failed after failover attempts');
}

// Tenant middleware — purge and reconnect after config change
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $request->user()->tenant;

        config([
            'database.connections.tenant.database' => $tenant->database_name,
            'database.connections.tenant.username' => $tenant->db_user,
            'database.connections.tenant.password' => decrypt($tenant->db_pass),
        ]);

        DB::purge('tenant');
        Log::info('Switched tenant connection', ['tenant' => $tenant->id]);

        return $next($request);
    }
}
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, Laravel DatabaseManager internals
- **Closely Related**: 10.5 Dynamic connection config, 7.11 Connection failover
- **Advanced**: Octane-specific purge behavior, purge across multiple connections simultaneously
- **Cross-Domain**: 5.6 Tenant middleware, 6.5 Shard routing

## AI Agent Notes

- The "config changed but not purged" bug is responsible for many multi-tenant data leaks
- Always check for `DB::purge()` after any `config()->set()` on database connections
- `DB::reconnect()` is the preferred method — combines purge + connect atomically
- In Octane, remind developers that purge is per-worker — other workers may still use old connections
- After purge, any already-loaded Eloquent models still reference the old PDO — warn about this

## Verification

- [ ] Every `config()->set()` on database config is followed by `DB::purge()` or `DB::reconnect()`
- [ ] Purge/reconnect calls are wrapped in try-catch for error handling
- [ ] No active transactions when purge is called
- [ ] Models loaded before purge are re-queried after switching connections
- [ ] Log entries show connection switches with tenant/shard identifiers
- [ ] Failover retry logic successfully reconnects to new primary
