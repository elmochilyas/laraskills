# 10.16 Connection Failover Behavior

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.16 |
| Knowledge Unit Title | Connection failover behavior (transparent reconnect, connection string rotation) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.11 Failover, 10.6 Connection purging |
| Last Updated | 2026-06-02 |

## Overview

When the primary database fails, connections must be re-established to the new primary. Connection failover strategies include DNS-based (update DNS, wait for TTL), proxy-based (ProxySQL detects failure and routes to new primary), and config-based (Laravel detects failure, updates config, purges, and reconnects). Transparent failover means the application retries the failed query without returning an error to the user. The choice of strategy determines recovery time, complexity, and transparency.

## Core Concepts

- **DNS failover**: Update the `DB_HOST` DNS record to point to the new primary host. TTL determines the delay before all applications use the new record. Simple but slow (TTL-dependent). Connections already established remain pointed at the old (failed) host.
- **Proxy failover (ProxySQL, RDS Proxy)**: The proxy monitors backend health. When the primary fails, the proxy routes new queries to the promoted replica. Existing connections are transparently moved. The application never sees the failure.
- **Application-level failover**: The application detects a connection failure (PDO exception), reads the new primary host from a configuration service or API, updates the database config, purges the stale connection, and retries the query. Most flexible but requires code changes.
- **Transparent reconnect**: The application retries the failed query without user-visible error. May involve multiple retry attempts with backoff.
- **Connection string rotation**: The failover may also involve rotating credentials (new primary may have different credentials). Config-based failover must handle credential changes.

## When To Use

- **DNS failover**: Simple architectures, applications tolerant of 30–300s failover delay, no proxy infrastructure
- **Proxy failover (recommended)**: All production deployments where downtime tolerance is <30s. Most transparent and reliable strategy.
- **Application-level failover**: Environments without proxies, custom failover logic needed (multi-region, multi-cloud), failover must respect application-specific consistency requirements

## When NOT To Use

- **DNS failover**: Applications requiring <30s recovery time, environments with long DNS TTLs that can't be shortened
- **Proxy failover**: Single-database deployments with no replica to fail over to (failover is meaningless)
- **Application-level failover**: If a proxy is available, application-level failover adds unnecessary complexity

## Best Practices

- **Use proxy-level failover as the primary strategy**: ProxySQL, RDS Proxy, or PgBouncer (with DNS-based backend resolution) handle failover transparently. **Why**: The proxy detects backend failure faster than the application (<1s vs 30s+ PDO timeout). The proxy can route existing connections to the new primary without the application knowing. No code changes are needed for failover.
- **Implement application-level failover as a fallback**: Even with a proxy, add application-level retry logic with purge/reconnect. **Why**: Proxies can fail too. If the proxy itself goes down, or if the proxy's failover doesn't work correctly, application-level retry provides a second layer of defense.
- **Use retry with exponential backoff**: Retry failed queries 2–3 times with increasing delays (100ms, 500ms, 2s). **Why**: Network blips resolve quickly. Aggressive retry (immediate, without backoff) can overwhelm the database during recovery. Exponential backoff gives the system time to stabilize.
- **Test failover regularly**: Perform chaos engineering — kill the primary database in staging and verify the application recovers. **Why**: Failover is a "configure and forget" feature that often doesn't work when first needed. Regular testing validates the entire chain: failure detection → host promotion → connection re-routing → query retry.
- **Log failover events with context**: When failover occurs, log the old host, new host, failover trigger, and recovery time. **Why**: Post-mortem analysis requires data about what happened during failover. Detailed logs help identify bottlenecks (slow DNS update, slow proxy detection, application retry failures).

## Architecture Guidelines

- **Proxy failover architecture**: App → Proxy (ProxySQL/RDS Proxy) → [Primary, Replicas]. Proxy detects primary failure (health check timeout), promotes a replica, and starts routing queries to the new primary. App sees a brief pause (1–10s) during detection + promotion.
- **DNS failover architecture**: App → DNS → [Primary, Replica]. Application connects to `db.example.com`. On failure, DNS is updated to point to the new primary. TTL determines propagation delay. Existing connections (already resolved to old IP) continue to fail until the application reconnects (Octane workers must be restarted or purge connections).
- **Application-level failover architecture**: App detects connection failure → reads `$newHost` from config/API → `config()->set("database.connections.mysql.host", $newHost)` → `DB::purge('mysql')` → `DB::reconnect('mysql')` → retry query.
- For multi-region failover: Each region has its own database cluster. On cross-region failover, the connection string must point to the new region's cluster. This usually requires application-level or DNS-level failover.
- Read replica failover: When a read replica fails, the read pool should automatically route to remaining replicas. Read requests may failover to the write connection (degraded but functional).

## Performance Considerations

- Proxy failover: 1–10s detection + promotion time. Query latency during this window is increased (failed queries + retries).
- DNS failover: 30–300s propagation (TTL-dependent). During this window, some instances connect to the old (failed) host, some to the new host.
- Application-level failover: adds purge (~0.01ms) + reconnect (1–50ms) to the first retried query. Subsequent queries use the new connection.
- Retry adds latency proportional to the number of retries. 3 retries with exponential backoff: ~2.6s added latency.
- Octane workers that hold stale connections after failover must be restarted or purged. Rolling restart adds 10–60s to recovery time.
- Connection pooler health check intervals determine how quickly failover is detected. Aggressive intervals (1s) detect faster but add more monitor load.

## Security Considerations

- Failover to a new primary may involve different credentials. Ensure Credential rotation is handled during failover.
- Multi-region failover must respect data residency requirements. The new primary must be in a compliant region.
- Log all failover events — they may indicate an attack (database compromise, network partition).
- DNS failover can be exploited by DNS spoofing. Use DNSSEC if using DNS-based failover.
- Proxy failover must use TLS between proxy and backends to prevent man-in-the-middle attacks during the failover window.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No failover handling | App connects directly to primary with no proxy or fallback | Complete downtime when primary fails | Deploy a proxy (ProxySQL, RDS Proxy) or implement app-level failover |
| 2 | DNS failover with long TTL | TTL set to 300s or more | Slow recovery: some instances still try old host for 5+ minutes | Reduce DNS TTL to 30–60s for database hostnames |
| 3 | No retry after connection failure | PDO exception propagates to user | 500 error on transient DB failure | Add retry with backoff for connection-related exceptions |
| 4 | Not purging after failover in app-level | Config changed but DB::purge not called | Stale PDO still points to dead primary | Always purge before reconnect |
| 5 | Assuming proxy handles all failover | No application-level retry fallback | Proxy failure cascades to application failure | Implement retry at both proxy and application levels |

## Anti-Patterns

- **Single failover strategy**: Relying entirely on DNS failover (slow) or entirely on proxy failover (single point of failure). Layer multiple strategies: proxy-level + application-level retry.
- **No failover testing**: Configuring failover but never testing it. First test during a real outage → incomplete recovery, extended downtime.
- **Ignoring read replica failover**: Primary failover is well-planned, but read replica failures cause degraded reads with no alerting. Plan failover for all components.
- **Failover without monitoring integration**: Failover happens silently — no alert, no log, no dashboard update. Operations team doesn't know a failover occurred.
- **Manual failover as the only option**: Requiring SSH access to run failover scripts. Should be automated or at least triggerable from a runbook.

## Examples

```php
// Application-level failover with retry
function dbQueryWithFailover(callable $query, int $maxRetries = 3): mixed
{
    $attempt = 0;
    $lastException = null;

    while ($attempt < $maxRetries) {
        try {
            return $query();
        } catch (QueryException $e) {
            $lastException = $e;
            $message = $e->getMessage();

            $isConnectionError = Str::contains($message, [
                'lost connection', 'gone away', 'could not connect',
                'connection refused', 'server has gone away',
            ]);

            if (!$isConnectionError) {
                throw $e; // Non-connection error — don't retry
            }

            $attempt++;
            Log::warning('Database connection failed, attempting failover', [
                'attempt' => $attempt,
                'max_retries' => $maxRetries,
                'error' => $message,
            ]);

            // Attempt to failover
            try {
                $newHost = ConfigService::getPrimaryDatabaseHost();
                config(['database.connections.mysql.host' => $newHost]);
                DB::purge('mysql');
                DB::reconnect('mysql');
            } catch (\Exception $configException) {
                Log::error('Failover configuration failed', [
                    'error' => $configException->getMessage(),
                ]);
            }

            // Exponential backoff
            if ($attempt < $maxRetries) {
                usleep(100_000 * pow(2, $attempt - 1)); // 100ms, 200ms, 400ms
            }
        }
    }

    throw new RuntimeException(
        'Query failed after '.$maxRetries.' failover attempts',
        0,
        $lastException
    );
}

// Proxy-level failover (ProxySQL) — application just connects to proxy
// No failover code needed in application
// ProxySQL handles detection, promotion, and routing

// config/database.php for proxy failover
'mysql' => [
    'driver' => 'mysql',
    'host' => env('PROXYSQL_HOST', '127.0.0.1'),
    'port' => env('PROXYSQL_PORT', '6033'),
    // Proxy handles failover — no need for application-level logic
],
```

## Related Topics

- **Prerequisites**: 10.6 Connection purging and reconnection, 10.7 Connection count management
- **Closely Related**: 10.14 Connection health checks, 7.11 Replica promotion and failover
- **Advanced**: Multi-region failover, automated failover testing (chaos engineering)
- **Cross-Domain**: 7.1 Replication overview, 7.13 Synchronous vs async replication

## AI Agent Notes

- Proxy-level failover is the recommended strategy — simplest, most reliable, transparent
- Application-level failover is a fallback, not a primary strategy
- DNS failover is slow and unreliable for sub-minute recovery
- Always test failover in staging — untested failover is no failover at all
- Retry logic must distinguish connection errors from query errors
- Read replica failover is often neglected — include in planning
- Octane workers with stale connections need purge or restart after failover

## Verification

- [ ] Primary failover strategy is defined (proxy, DNS, or application-level)
- [ ] Retry logic with exponential backoff is implemented for connection errors
- [ ] Failover has been tested in staging with actual primary failure
- [ ] DNS TTL is set to 30–60s (if using DNS failover)
- [ ] Proxy health check intervals are configured for fast failure detection
- [ ] Failover events are logged with host, trigger, and recovery time
- [ ] Read replica failover is also planned and tested
- [ ] Application recovers cleanly from primary failure without manual intervention
- [ ] Octane worker reconnection after failover is verified
