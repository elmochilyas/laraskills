# Skill: Implement Dynamic Connection Configuration

## Purpose

Change database connection parameters at runtime using `config()->set()` followed by `DB::purge()` for multi-tenant database-per-tenant architectures, shard routing, credential rotation, and failover.

## When To Use

- Multi-tenant applications with database-per-tenant architecture
- Sharded databases where model instances route to different shards
- Credential rotation without application restart
- Runtime failover to a different database host

## When NOT To Use

- Single-database applications (adds unnecessary complexity)
- Applications using PgBouncer session pooling (pool state conflicts)
- Simple tenant isolation with global scopes (shared-table architecture)
- Octane applications with aggressive pool caching

## Prerequisites

- Laravel config system understanding
- Connection purging and reconnection (10-6)
- Defined base connection template in config/database.php

## Inputs

- Connection name to reconfigure
- New connection parameters (host, database, username, password)
- Tenant or shard identifier

## Workflow (numbered steps)

1. Define a base connection template in `config/database.php`:
   ```php
   'tenant' => [
       'driver' => 'mysql',
       'host' => env('DB_HOST'),
       'database' => null, // set at runtime
       'username' => null, // set at runtime
       'password' => null, // set at runtime
   ],
   ```

2. In middleware, resolve the tenant/shard and set config:
   ```php
   $tenant = Tenant::resolve($request);
   config([
       'database.connections.tenant.database' => 'tenant_'.$tenant->id,
       'database.connections.tenant.username' => $tenant->db_username,
       'database.connections.tenant.password' => decrypt($tenant->db_password),
   ]);
   ```

3. Purge the connection after config change:
   ```php
   DB::purge('tenant');
   ```

4. Optionally run initialization queries on the new connection:
   ```php
   DB::connection('tenant')->statement('SET search_path TO '.$tenant->schema);
   ```

5. For model-based shard routing, override `getConnectionName()`:
   ```php
   class Order extends Model
   {
       public function getConnectionName(): string
       {
           return 'shard_'.$this->shard_id;
       }
   }
   ```

6. Handle connection failures gracefully — wrap in try-catch

## Validation Checklist

- [ ] `config()->set()` is always followed by `DB::purge()` for the same connection name
- [ ] Dynamic connections have unique names (not overriding `mysql` or `pgsql`)
- [ ] Model's `getConnectionName()` returns valid connection names
- [ ] No stale connection errors after dynamic switches
- [ ] Credentials for dynamic connections come from secure sources
- [ ] Connection tagging is in place for observability

## Common Failures

- Config change without purge — old PDO reused, wrong database accessed
- Per-request purge in shared-table tenant — wasteful 1–50ms overhead
- Purging wrong connection name — dynamic connection still cached
- Not reconnecting after failover config change — "lost connection" errors persist

## Decision Points

- Named dynamic connections vs reconfiguring default connection
- Middleware-based switching vs model getConnectionName()
- Encrypted credential storage vs plaintext
- Octane: per-worker state vs shared config service

## Performance Considerations

- DB::purge() + reconnect: ~1–50ms per switch
- Avoid purging/reconnecting on every request in shared-table tenancy
- Dynamic config reads from config array is fast (<0.01ms)
- In Octane, frequent purge/reconnect defeats persistent connection benefits

## Security Considerations

- Dynamic config modifies credentials at runtime — ensure from trusted sources
- Never accept raw credentials from user input
- After purge, old PDO is garbage collected — no sensitive data remains
- Log all dynamic connection changes for audit trails

## Related Rules

- 10-5-1: Always Purge After Config Change
- 10-5-2: Use DB::reconnect() for Simplicity

## Related Skills

- Purge and Reconnect Connections
- Implement Tenant Middleware
- Route Shard Connections

## Success Criteria

- Config changes are immediately reflected in new connections
- No stale connection bugs in multi-tenant or sharded environments
- Dynamic connection names are unique and descriptive
- Credential rotation works without application restart
