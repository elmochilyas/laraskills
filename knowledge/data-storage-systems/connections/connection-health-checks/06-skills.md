# Skill: Configure Connection Health Checks

## Purpose

Verify pooled connections are still alive using heartbeat queries (`SELECT 1`) configured at the pooler level (PgBouncer, ProxySQL) or application level (Octane), with appropriate timeouts and failure monitoring.

## When To Use

- All pooled connections — health checks prevent using silent dead connections
- Long-running worker processes (Octane, Horizon, Swoole)
- Connections through NAT gateways or load balancers
- Environments with aggressive idle timeouts
- Read replica connections recycled by load balancers

## When NOT To Use

- PHP-FPM short-lived requests (<5s) — connections used and closed immediately
- Embedded databases (SQLite) — no network to fail
- Non-pooled persistent connections with short idle periods
- Development environments

## Prerequisites

- Understanding of connection lifecycle (10-1)
- Understanding of connection count management (10-7)
- Pooler deployed (PgBouncer, ProxySQL) or Octane running

## Inputs

- Pooler type and configuration access
- PDO timeout settings
- Expected idle connection timeout values (DB + network)

## Workflow (numbered steps)

1. Configure pooler-level health checks:

   **PgBouncer:**
   ```ini
   [pgbouncer]
   server_idle_timeout = 600
   server_check_query = SELECT 1
   server_check_delay = 30
   query_timeout = 5
   ```

   **ProxySQL:**
   ```ini
   mysql-monitor_connect_interval=60000
   mysql-monitor_ping_interval=10000
   ```

2. For Octane without pooler, rely on built-in pool health checks:
   - Octane validates connection health on every `get()` from pool
   - No manual `SELECT 1` needed — just ensure pool config exists

3. Set PDO timeout for fast failure detection:
   ```php
   'options' => [
       PDO::ATTR_TIMEOUT => 2,  // Connection timeout: 2 seconds
   ],
   ```

4. Implement manual health check with reconnect (if no pooler):
   ```php
   function getHealthyConnection(string $name): Connection
   {
       $connection = DB::connection($name);
       try {
           $connection->select('SELECT 1');
       } catch (QueryException $e) {
           DB::purge($name);
           $connection = DB::reconnect($name);
       }
       return $connection;
   }
   ```

5. Distinguish between connection drop and backend failure:
   - Single failure: transient network blip
   - Multiple failures: backend may be dead — escalate

6. Monitor health check failure rate:
   - Track as percentage: `failures / total_checks`
   - Alert on rising failure rates

## Validation Checklist

- [ ] Pooler-level health checks configured
- [ ] PDO timeout set to 2–3 seconds
- [ ] Octane pool config exists (built-in health check active)
- [ ] Health check failure rate monitored with alerts
- [ ] Stale connections detected and recreated before causing errors
- [ ] No "MySQL has gone away" or "connection refused" errors in logs
- [ ] Health check queries are read-only (SELECT 1)

## Common Failures

- No health check on Octane pool — stale connection may be returned
- Manual SELECT 1 on every query in PHP-FPM — unnecessary DB load
- Health check timeout too high — worker blocks for 30s
- Not handling health check exception — app error instead of graceful reconnect
- No health check monitoring — silent backend failures

## Decision Points

- Pooler-level vs application-level health checks
- Health check interval: 30s vs 60s vs 120s
- Health check timeout: 2s vs 5s vs 10s
- Single failure = retry vs immediate backend removal

## Performance Considerations

- SELECT 1: ~0.1ms per query — negligible at 1000 req/s
- Pooler-level checks more efficient than application-level checks
- Octane built-in health check adds no configurable overhead
- Aggressive checks (every 1s) add unnecessary load

## Security Considerations

- Health check queries touch DB — ensure user has EXECUTE on SELECT 1
- Health checks should not log connection parameters on failure
- Monitor health check failures as security signal — spike may indicate attack
- Monitoring tools should use read-only connection, not app connection

## Related Rules

- 10-14-1: Let the Pooler Handle Health Checks
- 10-14-2: Set PDO::ATTR_TIMEOUT for Health Checks

## Related Skills

- Manage Connection Count
- Handle Connection Failover
- Configure Connection Encryption

## Success Criteria

- Pooler-level health checks detect dead backends automatically
- Octane pool health checks active (via pool config)
- Stale connections are detected and recreated proactively
- No connection failures reach application users
- Health check failure rate is monitored and alerted
