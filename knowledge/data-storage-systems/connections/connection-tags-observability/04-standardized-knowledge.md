# 10.8 Connection Tags and Observability

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.8 |
| Knowledge Unit Title | Connection tags and observability (application_name, per-connection metadata) |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 10.1 Connection lifecycle, 5.5 Global scopes |
| Last Updated | 2026-06-02 |

## Overview

Set per-connection metadata to identify the application, tenant, or request in database monitoring. PostgreSQL: `SET application_name = 'laravel-web'`. MySQL: `SET @@session.metrics = 'tenant:123'`. These tags appear in `pg_stat_activity` or `SHOW FULL PROCESSLIST`. Tagging transforms anonymous database connections into identifiable traffic sources, enabling rapid diagnosis of problematic queries without asking "which app is this?"

## Core Concepts

- **application_name (PostgreSQL)**: Set per connection via `config(['database.connections.pgsql.application_name' => 'app_'.$tenant])`. Visible in `pg_stat_activity` and available in query plan logs. Survives connection pooling in session mode but requires per-request SET in transaction mode.
- **MySQL connection attributes**: `$pdo->setAttribute(PDO::ATTR_CONNECTION_STATUS, 'tenant_id:123')`. Visible in `SHOW FULL PROCESSLIST`. Also settable via `SET @@session.metrics = '...'`.
- **Per-request tagging**: In middleware, execute `SET application_name = 'web|tenant:'.$tenantId` after connection. Overrides the default from config. Essential in multi-tenant apps to identify which tenant is generating load.
- **Connection purpose tagging**: Tag connections by their purpose: `web`, `worker`, `horizon:high`, `horizon:default`, `reporting`, `migrations`. Separates traffic types in monitoring.
- **PgBouncer compatibility**: In transaction mode, `SET application_name` is lost when the connection returns to the pool. Must be set on every transaction start. PgBouncer can set this via `server_check_query`.

## When To Use

- Every production database — connection tagging is a low-effort, high-value observability practice
- Multi-tenant applications — identify which tenant is causing database load
- Queued job processing — distinguish Horizon worker connections from web connections
- Reporting or analytics workloads — separate from transactional traffic
- Migrations and deployments — tag migration connections separately

## When NOT To Use

- Ephemeral development databases (not worth the config overhead)
- SQLite databases (single-user, no process list to view)
- Databases where connection tagging is not supported (very old versions)

## Best Practices

- **Always set application_name in config**: Set a default `application_name` in `config/database.php`. **Why**: When a runaway query appears in `pg_stat_activity`, the default tag immediately identifies the connection source (laravel-web, horizon-worker, etc.). Without it, every connection looks the same.
- **Include tenant identifier for multi-tenant apps**: Override `application_name` per request in middleware. **Why**: When a single tenant's queries degrade database performance, the tagged connection immediately reveals the tenant ID, enabling targeted throttling or investigation.
- **Tag connection purpose, not just application name**: Use structured tags like `web|v2|user:42` or `worker|queue:broadcast`. **Why**: Tags should support filtering and grouping in monitoring tools. Structured tags enable queries like "show me all connections from Horizon high-priority queue."
- **Handle transaction pooling tag loss**: In PgBouncer transaction mode, set `application_name` at the beginning of each transaction (or use `server_check_query` in PgBouncer). **Why**: Transaction pooling returns connections to the pool after each transaction. The next transaction may get an untagged connection with a stale `application_name`.
- **Log connection tags in slow query log**: Configure the database to include `application_name` or connection attributes in slow query logs. **Why**: When analyzing slow queries, the tag provides immediate context about the source (which tenant, which job, which endpoint).

## Architecture Guidelines

- PostgreSQL: `application_name` is the standard tag. Set it in `config/database.php` and override in middleware.
- MySQL: Use `SET @@session.metrics` or `SET @tenant_id = '123'` as session variables. Visible in `SHOW FULL PROCESSLIST`.
- PgBouncer: Tags set via `SET application_name` in transaction mode are lost. Use `SET application_name` at the start of each transaction or configure `server_check_query` with the tag.
- For Octane: Set `application_name` in the pool config as default. Override per-request in middleware. The tag persists across requests within the same worker.
- Monitoring tools (pg_stat_activity, SHOW FULL PROCESSLIST) can be polled by observability platforms. Tagged connections enable tenant-level database monitoring dashboards.

## Performance Considerations

- `SET application_name` adds ~0.1ms per statement. Negligible impact.
- For transaction pooling, setting on every transaction start adds minimal overhead but ensures correct tagging.
- Tagging does not increase connection memory or database load — it only adds metadata to existing connection tracking.
- Structured tags with high cardinality (e.g., `user:12345`) create many unique values in `application_name`. This is fine — PostgreSQL does not index `application_name`.

## Security Considerations

- Tags are visible in `pg_stat_activity` and database logs. Avoid including sensitive data (passwords, tokens, PII) in tags.
- Tagging with tenant IDs is acceptable (tenant ID is not secret information).
- If tags include user IDs, ensure this doesn't violate privacy requirements or data minimization principles.
- Connection tags are readable by anyone with database access (pg_stat_activity). Restrict database monitoring access appropriately.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No connection tags at all | Default config, no application_name | All connections appear as "PHP" or "PostgreSQL" in monitoring | Add application_name to database config |
| 2 | Tags in transaction pooling without per-transaction SET | Tag set at connection start, lost after transaction ends | Stale or missing tags in monitoring | Set application_name at transaction start or use server_check_query |
| 3 | Sensitive data in tags | Including user emails, tokens in application_name | PII exposed in pg_stat_activity | Use non-sensitive identifiers (internal IDs, not emails) |
| 4 | Tags too vague | `application_name = 'app'` — no distinguishing value | Cannot identify which connection does what | Use structured format: `purpose|version|tenant:ID` |
| 5 | No tag in Horizon workers | Worker config doesn't override application_name | All worker connections look like web connections | Set purpose-specific tags: `horizon|default`, `horizon|high` |

## Anti-Patterns

- **No tagging on migration connections**: Migration connections tagged as `web` pollute monitoring with deployment-time traffic.
- **Static tags in dynamic environments**: Setting a single `application_name` for an entire multi-tenant application. Every tenant looks the same.
- **Tagging as an afterthought**: Adding tags only after a production incident where "which tenant" couldn't be identified.

## Examples

```php
// config/database.php — default application_name
'pgsql' => [
    'driver' => 'pgsql',
    'application_name' => env('APP_NAME', 'laravel').'|'.env('APP_ENV', 'production'),
    // ...
],

// Middleware — per-request tenant tagging
class TagConnectionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tag = 'web';
        if ($tenant = tenant()) {
            $tag .= '|tenant:'.$tenant->id;
        }
        if ($request->user()) {
            $tag .= '|user:'.$request->user()->getKey();
        }

        // PostgreSQL
        DB::statement("SET application_name = '{$tag}'");

        // MySQL alternative
        // DB::statement("SET @request_tenant_id = '{$tenant->id}'");

        return $next($request);
    }
}

// Horizon worker config — purpose-specific tagging
// config/horizon.php
'worker-name' => [
    'connection' => 'pgsql',
    'options' => [
        'application_name' => 'horizon|high',
    ],
],
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, database monitoring basics
- **Closely Related**: 10.5 Dynamic connection config, 10.14 Connection health checks
- **Advanced**: PgBouncer `server_check_query` with dynamic tags, structured logging integration
- **Cross-Domain**: 5.5 Global scopes, 7.21 Replica health monitoring, 4.27 Profiling tools (Telescope, Debugbar)

## AI Agent Notes

- Connection tagging is the cheapest observability investment — zero runtime cost, high debugging value
- When a developer can't identify which tenant's query is slow, add tenant tags to connections
- PgBouncer transaction pooling loses tags — always document this limitation
- Structured tags (pipe-delimited) enable better filtering than single-value tags
- Recommend tagging in middleware for web requests, bootstrapper for queue jobs

## Verification

- [ ] `application_name` (PostgreSQL) or equivalent (MySQL) is configured in database.php
- [ ] Multi-tenant apps override the tag per-request with tenant ID
- [ ] Purpose-specific tags are set for web, Horizon, and reporting connections
- [ ] No sensitive data (passwords, PII, tokens) in connection tags
- [ ] PgBouncer transaction mode handles tag persistence correctly
- [ ] Connection tags are visible and filterable in database monitoring tools
- [ ] Tags are included in slow query log output
