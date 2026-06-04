# 10.1 Connection Lifecycle

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.1 |
| Knowledge Unit Title | Connection lifecycle (connect, query, disconnect, reconnect) |
| Difficulty Level | Foundational |
| Classification | F |
| Dependencies | None |
| Related KUs | Laravel Octane connections, Connection count management |
| Last Updated | 2026-06-02 |

## Overview

PHP connects to MySQL/PostgreSQL via TCP: connect (handshake, auth, SSL) → query → fetch → disconnect. Connect/disconnect overhead is 50–200ms per request. Connection pooling amortizes this cost across requests. PHP-FPM connects per request; Octane connects per worker lifetime. Understanding this lifecycle is essential for diagnosing connection exhaustion, latency issues, and pool sizing decisions.

## Core Concepts

- **PHP-FPM model**: New process per request, new TCP connection per request. Connect at request start, disconnect at request end. No connection reuse between requests. Total connections = number of PHP-FPM workers.
- **Octane model**: Worker lives for many requests. Connection persists across requests. First request connects, subsequent requests reuse the same connection. Total connections = workers × pool size.
- **Connection stages**: TCP handshake → Authentication → SSL negotiation → `SET NAMES`/`SET search_path` → Query → Fetch → Close. Each stage adds latency.
- **Reconnect**: When a connection drops (timeout, network failure, DB restart), the application must detect and establish a new connection.
- **Persistent connections**: `PDO::ATTR_PERSISTENT = true` — PHP reuses connections across requests. Risky due to stale connections, transaction state leakage, and connection count inflation.

## When To Use

- PHP-FPM deployments with connection pooler (PgBouncer, ProxySQL)
- Octane/Swoole deployments with built-in connection pooling
- Any application requiring predictable database connection overhead

## When NOT To Use

- Short-lived CLI scripts performing a single query (overhead of pool connection not justified)
- Read-only operations where a serverless DB proxy handles pooling (e.g., RDS Proxy)
- Environments where each worker uses a single dedicated database (rare in web apps)

## Best Practices

- **Always configure connection pooling for PHP-FPM**: Without pooling, each PHP-FPM worker opens its own connection. With 200 workers, the database sees 200 concurrent connections, risking `max_connections` exhaustion. A pooler like PgBouncer reduces this to 20–50 backend connections.
- **Use Octane's built-in pool for long-lived workers**: Configure `pool.min` and `pool.max` per connection. This avoids the overhead of creating a connection on every request while preventing unbounded connection growth.
- **Monitor connection churn**: Track `pg_stat_activity` or `SHOW FULL PROCESSLIST` for frequent connect/disconnect patterns. High churn indicates missing pooler or misconfigured pool.
- **Avoid `PDO::ATTR_PERSISTENT`**: This PHP-level option reuses connections across requests but can leave connections in a bad state (uncommitted transaction, wrong search path). Use a dedicated pooler instead.
- **Pre-warm connections in Octane**: Set `pool.min` to a value that supports baseline traffic. This avoids first-request latency penalty from cold-start connections.

## Architecture Guidelines

- **PHP-FPM architecture**: App → Pooler (PgBouncer/ProxySQL) → Database. The pooler sits between the application and database, sharing backend connections across many frontend connections.
- **Octane architecture**: App (with built-in PDO pool) → Database. No external pooler required, but pool config is mandatory.
- **Swoole architecture**: App (coroutine-based shared pool) → Database. Most efficient due to coroutine multiplexing.
- For multi-tenant or sharded environments, the connection lifecycle must incorporate dynamic connection resolution (per-tenant database, per-shard host).

## Performance Considerations

- Connect/disconnect overhead: 50–200ms per request without pooling. Pooling reduces this to microseconds.
- Each database connection consumes 2–10MB of RAM (on the database server). 500 connections = 1–5GB RAM.
- SSL handshake adds 10–50ms to initial connection time but has negligible per-query impact after handshake.
- Connection storms (many workers connecting simultaneously after deploy) can overwhelm the database's connection handler. Pooling absorbs this burst.
- Pool sizing formula: Pool = (PHP-FPM workers × connections per worker) / multiplexing ratio. With PgBouncer transaction mode, 50 connections may serve 300 workers.

## Security Considerations

- Connections should use TLS/SSL for encryption in transit, especially when crossing network boundaries.
- Connection credentials must be managed via environment variables or secret managers, never hardcoded.
- After credential rotation, purge and reconnect (`DB::purge`, `DB::reconnect`) without application restart.
- Monitor for unexpected connection attempts via database audit logs.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No pool configured for PHP-FPM | Developer assumes PHP-FPM connections are cheap | `max_connections` exceeded under load; application errors | Deploy PgBouncer or ProxySQL; configure pool in database config |
| 2 | Not purging after config change | Changing `config(['database.connections.*'])` without purge | Stale PDO objects reused; connection to wrong host/database | Always call `DB::purge()` after runtime config changes |
| 3 | Persistent connections with PDO::ATTR_PERSISTENT | Developer thinks this is "pooling" | Stale transactions, wrong search_path, hard-to-debug state leaks | Use dedicated pooler (PgBouncer, ProxySQL) or Octane built-in pool |
| 4 | No health check on reused connections | Connection silently dropped by DB timeout | "MySQL has gone away" errors mid-request | Configure pooler health checks or Octane automatic verification |

## Anti-Patterns

- **Connection-per-request without pool**: Each HTTP request opens and closes a TCP connection. At 500 req/s with 50ms connect overhead, 25 seconds of every second is spent connecting.
- **Using Eloquent models inside migrations**: Migrations run during deployment, and the model's connection lifecycle may differ from the migration's connection.
- **Unbounded connection growth**: Setting `max_connections` very high without pool sizing leads to memory exhaustion on the database server.

## Examples

```php
// PHP-FPM with PgBouncer (connection per request, pooler handles reuse)
// config/database.php
'pgsql' => [
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '6432'), // PgBouncer port
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
],

// Octane with built-in pool
'pgsql' => [
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'pool' => [
        'min' => 2,
        'max' => 10,
    ],
],
```

## Related Topics

- **Prerequisites**: TCP/IP fundamentals, PHP process model
- **Closely Related**: 10.2 Pool architecture, 10.7 Connection count management, 10.12 PHP-FPM vs Octane vs Swoole
- **Advanced**: 10.10 Transaction pooling limitations, 10.16 Failover connection behavior
- **Cross-Domain**: 5.6 Tenant-aware middleware, 7.2 Laravel read/write config

## AI Agent Notes

- When diagnosing connection issues, check if a pooler is present and configured correctly
- Look for `DB::purge` calls missing after runtime config changes
- Verify `pool` config exists for Octane connections
- Connection lifecycle differs fundamentally between PHP-FPM, Octane, and Swoole — recommend solutions specific to the runtime

## Verification

- [ ] Application connects to database successfully
- [ ] Connection pooling is active (PgBouncer/ProxySQL/Octane pool)
- [ ] No connection errors in logs under load
- [ ] `max_connections` on database is not exceeded during traffic spikes
- [ ] Connections are properly tagged for observability
- [ ] Stale connections are detected and recycled
