# Skill: Handle Connection Failover

## Purpose

Configure connection failover strategies (proxy-level, DNS-based, or application-level) so that when the primary database fails, connections are transparently re-established to the new primary with retry and backoff.

## When To Use

- **Proxy failover (recommended)**: All production deployments where downtime tolerance is <30s
- **DNS failover**: Simple architectures, apps tolerant of 30–300s failover delay
- **Application-level failover**: Environments without proxies, custom failover logic

## When NOT To Use

- DNS failover for <30s recovery time
- Proxy failover for single-database with no replica
- Application-level failover if proxy is available (adds complexity)

## Prerequisites

- Understanding of connection purging (10-6)
- Understanding of connection health checks (10-14)
- Replication configured (primary + replica)

## Inputs

- Primary database hostname/IP
- Replica hostname/IP (to be promoted)
- DNS TTL (if using DNS failover)
- Proxy configuration (if using proxy failover)

## Workflow (numbered steps)

1. Choose and implement failover strategy:

   **Proxy failover (recommended) — ProxySQL, RDS Proxy:**
   ```php
   'mysql' => [
       'host' => env('PROXYSQL_HOST'),
       'port' => env('PROXYSQL_PORT', '6033'),
       // Proxy handles failover — no app-level logic needed
   ];
   ```
   Proxy detects backend failure (<1s), promotes replica, routes queries to new primary.

   **DNS failover:**
   - Set DNS TTL to 30–60s for database hostnames
   - Update DNS A record to point to new primary on failure
   - Existing connections (already resolved) continue to fail until reconnect

   **Application-level failover:**
   ```php
   // Detect failure → update config → purge → reconnect → retry
   $newHost = ConfigService::getPrimaryDatabaseHost();
   config(['database.connections.mysql.host' => $newHost]);
   DB::purge('mysql');
   DB::reconnect('mysql');
   ```

2. Implement retry with exponential backoff:
   ```php
   $attempts = 3;
   for ($i = 0; $i < $attempts; $i++) {
       try {
           return $query();
       } catch (QueryException $e) {
           // failover + reconnect
           usleep(100_000 * pow(2, $i)); // 100ms, 200ms, 400ms
       }
   }
   ```

3. Test failover regularly in staging:
   - Kill the primary database
   - Verify application recovers within expected time

4. Log failover events with context:
   - Old host, new host, trigger, recovery time

5. Plan read replica failover separately:
   - Failed replicas should be removed from read pool automatically
   - Reads may fall back to write connection (degraded but functional)

## Validation Checklist

- [ ] Primary failover strategy defined (proxy, DNS, or application-level)
- [ ] Retry logic with exponential backoff implemented
- [ ] Failover tested in staging with actual primary failure
- [ ] DNS TTL set to 30–60s (if using DNS failover)
- [ ] Proxy health check intervals configured for fast detection
- [ ] Failover events logged with host, trigger, recovery time
- [ ] Read replica failover also planned and tested
- [ ] App recovers cleanly from primary failure without manual intervention
- [ ] Octane worker reconnection after failover verified

## Common Failures

- No failover handling — complete downtime when primary fails
- DNS failover with long TTL (300s+) — slow recovery, some instances try old host
- No retry after failure — PDO exception propagates to user as 500 error
- Not purging after failover in app-level — stale PDO points to dead primary
- Assuming proxy handles all failover — proxy failure cascades to app failure

## Decision Points

- Proxy failover vs DNS failover vs application-level failover
- Retry count: 2 vs 3 vs 5 attempts
- Backoff strategy: exponential vs fixed vs random jitter
- Failover detection: proxy health check vs app-level catch

## Performance Considerations

- Proxy failover: 1–10s detection + promotion
- DNS failover: 30–300s propagation (TTL-dependent)
- App-level failover: purge (~0.01ms) + reconnect (1–50ms)
- 3 retries with exponential backoff: ~2.6s added latency
- Octane workers with stale connections need restart or purge

## Security Considerations

- Failover may involve different credentials — handle rotation
- Multi-region failover must respect data residency
- Log failover events — may indicate attack (compromise, partition)
- DNS failover exploitable by DNS spoofing — use DNSSEC
- Proxy failover must use TLS between proxy and backends

## Related Rules

- 10-16-1: Use Proxy-Level Failover as Primary Strategy
- 10-16-2: Implement App-Level Failover as Fallback

## Related Skills

- Purge and Reconnect Connections
- Configure Connection Health Checks
- Configure Read/Write Connection Separation

## Success Criteria

- Failover works without manual intervention
- Retry logic recovers from transient connection failures
- Failover tested in staging — recovery time measured
- Failover events logged with complete context
- Application returns errors only after all retries exhausted
