# 10.14 Connection Health Checks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.14 |
| Knowledge Unit Title | Connection health checks (heartbeat queries, idle connection timeout) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.1 Connection lifecycle, 10.7 Connection count |
| Last Updated | 2026-06-02 |

## Overview

Connection health checks verify that pooled connections are still alive. Idle connections can be silently dropped by the database (`wait_timeout`, `idle_in_transaction_session_timeout`), the pooler (`server_idle_timeout`), or network equipment (firewalls, NAT gateways). A health check typically runs a heartbeat query (`SELECT 1`) before using a pooled connection. If the heartbeat fails, the dead connection is discarded and a new one is created.

## Core Concepts

- **Heartbeat query**: `DB::select('SELECT 1')` — a minimal, fast query that validates the connection is functional. If it fails (exception), the connection is stale and must be replaced.
- **Idle timeout**: MySQL `wait_timeout` (default 28800s = 8 hours), PostgreSQL `idle_in_transaction_session_timeout` (default 0 = disabled). Connections idle longer than the timeout are closed by the database server.
- **Octane automatic health check**: Octane checks connection health before returning a connection from the pool. Dead connections are automatically recreated. No manual heartbeat needed for Octane's pool.
- **PgBouncer server_idle_timeout**: PgBouncer closes backend connections that have been idle for longer than this setting (default 600s). Re-creates on next client request.
- **ProxySQL health monitoring**: ProxySQL periodically checks backend health with `mysql-monitor_connect_interval` and `mysql-monitor_ping_interval`. Dead backends are automatically removed from the hostgroup.

## When To Use

- All pooled connections — health checks prevent using silent dead connections
- Long-running worker processes (Octane, Horizon, Swoole) where connections may idle for extended periods
- Connections passing through NAT gateways or load balancers that may drop idle connections
- Environments with aggressive idle timeouts (cloud databases often have low idle timeouts)
- Read replica connections that may be recycled by database load balancers

## When NOT To Use

- PHP-FPM short-lived requests (<5s) — connections are used immediately and closed; health checks add unnecessary overhead
- Embedded databases (SQLite) — no network to fail
- Non-pooled persistent connections with very short idle periods
- Development environments where connection drops are expected and acceptable

## Best Practices

- **Let the pooler handle health checks**: PgBouncer, ProxySQL, and RDS Proxy all have built-in health check mechanisms. **Why**: The pooler is better positioned to check connection health — it operates at the network level, can run checks in parallel, and can automatically remove dead backends from the pool. Application-level health checks are redundant when a pooler is present.
- **For Octane without a pooler, rely on the built-in health check**: Octane automatically validates connections before returning them from the pool. **Why**: Octane's pool already verifies connection health on every `get()` call. A manual `SELECT 1` before each query would add unnecessary database load.
- **Set PDO::ATTR_TIMEOUT for health check queries**: Configure a low connection timeout (2–3 seconds) so health checks fail fast. **Why**: A health check that hangs for 30 seconds (default timeout) blocks the worker. Quick failure allows faster recovery.
- **Distinguish between connection drop and backend failure**: A single failed health check may indicate a transient network issue. Retry before marking the backend as dead. **Why**: Network blips are common. A conservative retry policy (2–3 attempts with backoff) prevents unnecessary failover.
- **Monitor health check failure rate**: Track `health_check_failures / total_checks` as a percentage. Alert on increases. **Why**: A rising failure rate may indicate a database server issue, network problem, or impending timeout expiration.

## Architecture Guidelines

- **PgBouncer**: Configure `server_idle_timeout` to reclaim connections from idle clients. `server_check_query` validates connection health (default: `SELECT 1`). `server_check_delay` controls how often to check.
- **ProxySQL**: Configure `mysql-monitor_connect_interval` (how often to test new connections) and `mysql-monitor_ping_interval` (how often to ping existing connections). ProxySQL automatically removes dead backends.
- **Octane**: Octane's connection pool validates health on every `get()`. No manual configuration needed beyond `pool` settings.
- **PHP-FPM without pooler**: Health checks are unnecessary — connections are used immediately and closed at request end. Each request gets a fresh connection.
- **Horizon workers**: Horizon workers may hold connections for extended periods. Configure heartbeat queries in the worker bootstrapper or use Octane's pool health check.

## Performance Considerations

- Health check query (`SELECT 1`) takes ~0.1ms on the database server. At 1000 req/s, that's 100ms/s of DB time — negligible.
- Heartbeat queries on every pool checkout add overhead proportional to pool checkout frequency.
- Pooler-level health checks (PgBouncer, ProxySQL) are more efficient than application-level checks because the pooler batches checks and uses lightweight network probes.
- Octane's built-in health check adds no configurable overhead — it's part of the pool implementation.
- Aggressive health checks (checking every 1 second) add unnecessary load. Every 30–60 seconds is sufficient for most environments.

## Security Considerations

- Health check queries touch the database — ensure the application user has `EXECUTE` on `SELECT 1` (always true).
- Health checks should not log connection parameters or credentials if they fail.
- Monitor health check failures as a security signal — a sudden spike may indicate a network-level attack or database compromise.
- Health checks from monitoring tools should use a read-only connection, not the application connection.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No health check on Octane pool | Assuming Octane's pool always has valid connections | Rare but possible: stale connection returned if pool isn't properly configured | Octane handles this automatically — just configure pool correctly |
| 2 | Manual SELECT 1 on every query in PHP-FPM | Developer adds heartbeat to every request | Unnecessary database load (1000 req/s × 1 query = 1000 QPS wasted) | Trust that PHP-FPM's per-request connections are fresh |
| 3 | Health check timeout too high | Default 30s timeout on health query | Worker blocks for 30s waiting for dead connection to timeout | Set PDO::ATTR_TIMEOUT to 2-3s for health check connections |
| 4 | Not handling health check exception | Health check throws unhandled exception | Application error instead of graceful reconnect | Catch exception, discard stale connection, create new one |
| 5 | No health check monitoring | Pooler checks health but never reports failures | Silent backend failures not detected until user impact | Monitor health check failure rate with alerts |

## Anti-Patterns

- **SELECT 1 on every database query**: Running `SELECT 1` before every real query doubles database load. Trust the connection unless proven otherwise.
- **Health checks that modify data**: Using `UPDATE last_heartbeat = NOW()` as a health check. Heartbeat queries must be read-only (`SELECT 1`).
- **Single point of health check failure**: Relying on a single health check mechanism. Pooler-level + application-level + monitoring-level health checks provide defense in depth.
- **Health check against wrong database**: Health-checking the connection but not verifying the correct database/schema is selected.

## Examples

```php
// config/database.php — PDO timeout for health checks
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'options' => [
        PDO::ATTR_TIMEOUT => 2,  // Connection timeout: 2 seconds
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ],
],

// Manual health check with reconnect
function getHealthyConnection(string $name): Connection
{
    $connection = DB::connection($name);

    try {
        $connection->select('SELECT 1');
    } catch (QueryException $e) {
        Log::warning('Connection health check failed, reconnecting', [
            'connection' => $name,
            'error' => $e->getMessage(),
        ]);
        DB::purge($name);
        $connection = DB::reconnect($name);
    }

    return $connection;
}

// pgbouncer.ini — health check settings
[pgbouncer]
server_idle_timeout = 600        # Close idle backend connections after 600s
server_check_query = SELECT 1    # Health check query
server_check_delay = 30          # Check health every 30 seconds
query_timeout = 5                # Query timeout: 5 seconds
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, connection timeout fundamentals
- **Closely Related**: 10.7 Connection count management, 10.16 Failover connection behavior
- **Advanced**: ProxySQL monitor configuration, PgBouncer server_check_delay tuning
- **Cross-Domain**: 7.6 Replica lag monitoring, 7.21 Replica health monitoring

## AI Agent Notes

- Health checks are most relevant for pooled and long-lived connections (Octane, pooled PHP-FPM)
- Octane handles health checks automatically — no manual SELECT 1 needed
- Pooler-level health checks are more efficient than application-level checks
- Low timeout on health check queries prevents worker blocking
- Monitor health check failure rates as an early warning system for database issues

## Verification

- [ ] Pooler-level health checks are configured (PgBouncer `server_check_query`, ProxySQL monitor)
- [ ] PDO timeout is set to 2–3 seconds for connection-level timeout
- [ ] Octane's pool health check is active (automatic — verify pool config exists)
- [ ] Health check failure rate is monitored with alerts
- [ ] Stale connections are detected and recreated before they cause application errors
- [ ] No "MySQL has gone away" or "connection refused" errors in logs
- [ ] Health check queries are read-only and use SELECT 1
