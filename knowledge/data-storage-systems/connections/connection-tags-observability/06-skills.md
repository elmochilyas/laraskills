# Skill: Tag Connections for Observability

## Purpose

Set per-connection metadata (`application_name` in PostgreSQL, session variables in MySQL) to identify the application, tenant, or request in database monitoring tools like `pg_stat_activity` and `SHOW FULL PROCESSLIST`.

## When To Use

- Every production database — low-effort, high-value observability
- Multi-tenant applications — identify which tenant causes database load
- Queued job processing — distinguish Horizon workers from web
- Reporting or analytics workloads — separate from transactional traffic
- Migrations and deployments — tag migration connections separately

## When NOT To Use

- Ephemeral development databases
- SQLite databases (single-user, no process list)
- Databases that don't support connection attributes

## Prerequisites

- Database monitoring tool access (pg_stat_activity, SHOW PROCESSLIST)
- Understanding of connection lifecycle (10-1)

## Inputs

- Application name and environment
- Tenant identifiers (for multi-tenant apps)
- Connection purpose (web, worker, horizon, reporting)
- Runtime (PHP-FPM, Octane, Swoole)

## Workflow (numbered steps)

1. Set default `application_name` in config/database.php:
   ```php
   'pgsql' => [
       'application_name' => env('APP_NAME', 'laravel').'|'.env('APP_ENV', 'production'),
   ],
   ```

2. For PostgreSQL, set per-request tags in middleware:
   ```php
   $tag = 'web';
   if ($tenant = tenant()) {
       $tag .= '|tenant:'.$tenant->id;
   }
   DB::statement("SET application_name = '{$tag}'");
   ```

3. For MySQL, use session variables:
   ```php
   DB::statement("SET @request_tenant_id = '{$tenant->id}'");
   ```

4. Tag connections by purpose in Horizon worker config:
   ```php
   'worker-name' => [
       'connection' => 'pgsql',
       'options' => [
           'application_name' => 'horizon|high',
       ],
   ],
   ```

5. Handle PgBouncer transaction pooling tag loss:
   - Tags set via `SET application_name` are lost after transaction ends
   - Set at transaction start or configure `server_check_query` in PgBouncer

6. Verify tags are visible in monitoring tools:
   - PostgreSQL: `SELECT application_name FROM pg_stat_activity`
   - MySQL: `SHOW FULL PROCESSLIST`

## Validation Checklist

- [ ] `application_name` or equivalent configured in database.php
- [ ] Multi-tenant apps override the tag per-request with tenant ID
- [ ] Purpose-specific tags set for web, Horizon, reporting connections
- [ ] No sensitive data in connection tags
- [ ] PgBouncer transaction mode handles tag persistence correctly
- [ ] Tags visible and filterable in database monitoring tools
- [ ] Tags included in slow query log output

## Common Failures

- No connection tags at all — all connections appear as "PHP" or "PostgreSQL"
- Tags in transaction pooling without per-transaction SET — stale tags
- Sensitive data in tags — PII exposed in pg_stat_activity
- Tags too vague — cannot identify which connection does what
- No tag in Horizon workers — all connections look like web connections

## Decision Points

- PostgreSQL application_name vs MySQL session variables
- Structured pipe-delimited tags vs single-value tags
- Tag cardinality: high (per-user) vs low (per-purpose only)
- PgBouncer: per-transaction SET vs server_check_query

## Performance Considerations

- `SET application_name` adds ~0.1ms per statement — negligible
- For transaction pooling, setting on every transaction start adds minimal overhead
- Tagging does not increase connection memory or database load
- High-cardinality tags (per-user) are fine — no index on application_name

## Security Considerations

- Tags visible in pg_stat_activity — avoid passwords, tokens, PII
- Tenant IDs are acceptable in tags (not secret)
- User IDs may violate privacy requirements — check data minimization
- Restrict database monitoring access appropriately

## Related Rules

- 10-8-1: Always Set application_name in Config
- 10-8-2: Include Tenant Identifier for Multi-Tenant Apps

## Related Skills

- Configure Dynamic Connection Config
- Configure Connection Health Checks
- Use Profiling Tools (Telescope, Debugbar)

## Success Criteria

- Every connection has an identifiable purpose tag
- Multi-tenant connections include tenant ID
- No sensitive data in connection tags
- Tags persist correctly through PgBouncer transaction pooling
- Monitoring dashboards can filter by connection tags
