# Persistent Connections

## Metadata
- **ID**: KU-02-PERSISTENT-CONNECTIONS
- **Subdomain**: connection-pooling-network-cost
- **Domain**: cost-resource-optimization
- **Topic**: Persistent Connections
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Persistent database connections reuse a single connection across multiple requests, avoiding TCP handshake and MySQL/PostgreSQL auth overhead on every request. With PHP-FPM, connections are persistent per-worker (worker lives for multiple requests). With Octane, connections persist across all requests in a worker's lifecycle. Persistent connections reduce database CPU usage (fewer auth cycles) and improve response times, but require careful connection management to prevent stale connection issues.

## Core Concepts
- **PHP-FPM persistent connections**: `PDO::ATTR_PERSISTENT` or `pdo_mysql.default_socket` enables per-worker connection reuse
- **Octane persistent connections**: Connections are implicitly persistent (worker never restarts between requests)
- **Connection overhead**: TCP handshake (1 RTT) + MySQL auth (1 RTT) + SSL negotiation (2 RTT) = ~4 RTT saved per request
- **Stale connection**: Connection that drops silently (network issue, server restart) without the application knowing
- **Connection health checks**: Heartbeat queries or `MYSQL_OPT_RECONNECT` to detect stale connections
- **max_requests vs persistent connections**: PHP-FPM restarts workers after max_requests (500), closing persistent connections

## When To Use
- PHP-FPM: Enable persistent connections when request volume > 100 req/s per worker pool
- Octane: Connections are persistent by default (no extra configuration needed)
- High-latency connections: Cross-AZ database connections benefit more from persistence (saving 5-15ms per request)
- SSL connections: SSL handshake overhead (2 RTT) is avoided with persistence
- Queue workers: Workers process many jobs sequentially; persistence saves auth overhead per job

## When NOT To Use
- PHP-FPM with low max_requests: If max_requests = 100, persistence benefit is limited (worker restarts frequently)
- Connection pooler in front: RDS Proxy/PgBouncer already multiplexes connections; per-worker persistence doesn't help
- PHP-FPM with low traffic: <10 req/s per worker; connection overhead isn't significant
- Apps with frequent database server changes: Blue/green deployment or failover causes stale connections

## Best Practices
- **Enable persistent connections in PHP-FPM**: Set `PDO::ATTR_PERSISTENT => true` or use Laravel's built-in `persistent` config in `config/database.php` (WHY: saves 4 RTT (20-60ms) per request; Database CPU reduces by 5-10% from avoided auth cycles)
- **Implement connection health checks**: Run `SELECT 1` before executing the first query or use a middleware that validates connection (WHY: prevents "MySQL has gone away" errors from silent connection drops; check with 30-second heartbeat interval)
- **Use Octane's connection management**: Octane workers maintain persistent connections; use `DB::disconnect()` in memory-sensitive sections (WHY: Octane connections never close naturally; they accumulate memory and can become stale; disconnecting after heavy jobs prevents leak)
- **Set `wait_timeout` higher than idle time**: Database `wait_timeout` should exceed longest period between requests (WHY: if idle time > wait_timeout, MySQL kills the connection, next request gets "gone away" error; set wait_timeout = 86400 for 24h max idle)
- **Test with connection pooler**: RDS Proxy + persistent connections sometimes cause connection leaks; validate in staging (WHY: RDS Proxy may interpret persistent connections differently than direct connections; test before production rollout)

## Architecture Guidelines
- PHP-FPM: Enable persistent in `config/database.php` (`'persistent' => true` in mysql connection)
- Octane: Persistent by default; configure `DB::disconnect()` after long-running jobs
- Set `PDO::ATTR_EMULATE_PREPARES` to false for prepared statement reuse (memory saving)
- Configure `MYSQL_ATTR_INIT_COMMAND` to set session variables (e.g., timezone, charset)
- Monitor connection age (old connections are more likely to be stale)
- Use connection pooler with persistent connections for maximum efficiency

## Performance Considerations
- Connection creation saved: 20-60ms per request (TCP + TLS + MySQL auth)
- CPU saved: 5-10% database CPU from avoided auth overhead
- Memory cost: Each persistent connection uses ~100KB at PHP-FPM level
- Stale connection cost: Detection + reconnect adds 50-200ms for the affected request
- max_requests 500: Worker restarts every 500 requests; persistence benefit is 499/500 = 99.8% of requests

## Security Considerations
- Persistent connections may hold user-specific session state (session variables, temporary tables)
- Use connection pooler to isolate connections between requests
- Ensure TLS connection persists correctly (some TLS implementations expire)
- Monitor failed connection attempts (stale connections can cause repeated auth failures)

## Common Mistakes
1. **Persistent connections without health checks**: Connection silently drops, next request fails (Cause: assuming TCP connections never break; Consequence: "MySQL has gone away" errors affecting 0.1-1% of requests; Better: implement SELECT 1 health check every 30 seconds)
2. **Persistent connections + PgBouncer transaction pooling**: PgBouncer holds transaction-scoped connections; persistent connections at PHP level conflict (Cause: two layers of pooling with incompatible assumptions; Consequence: connection count blowup, unexpected disconnects; Better: disable PHP persistent connections when using PgBouncer)
3. **No max_requests with persistence**: Workers never restart, connections accumulate memory, grow stale indefinitely (Cause: "persistent connection forever" assumption; Consequence: connections eventually fail or leak memory; Better: set max_requests = 500 to refresh workers and connections periodically)
4. **Octane without connection refresh**: Long-running Octane workers holding same connections for days (Cause: workers process millions of requests; Consequence: connections become stale, network timeouts break them; Better: use Octane::tick() to refresh connections every N requests)

## Anti-Patterns
- **Persistent connections across tenants**: Multi-tenant app reuses connection with session variables; tenant A's settings affect tenant B
- **Persistent connections on ephemeral workers**: Lambda or Fargate Spot workers with short lifespan; persistence benefit is zero
- **No connection timeout**: Infinite idle persistent connections; database has max_connections but app holds them indefinitely

## Examples
- **PHP-FPM persistent**: `'persistent' => true` in config/database.php; `PDO::ATTR_ERRMODE => EXCEPTION` for error handling
- **Health check middleware**: Before first query: `DB::select('SELECT 1')`; if exception, `DB::reconnect()` and retry
- **Octane refresh**: `Octane::tick('db-refresh')->seconds(300)->tap(function() { DB::disconnect('mysql'); })`

## Related Topics
- Connection Pool Sizing (ku-01)
- Region Data Affinity (ku-03)
- Database Connection Pool (ku-09 in compute-optimization)
- RDS Proxy vs PgBouncer

## AI Agent Notes
- Default: enable persistent connections for PHP-FPM with health check middleware
- Disable persistent when using connection poolers (RDS Proxy, PgBouncer)
- Always implement health check for persistent connections

## Verification
- [ ] Persistent connections enabled for PHP-FPM
- [ ] Health check implemented (SELECT 1 before queries)
- [ ] wait_timeout configured higher than max idle period
- [ ] Connection refresh in Octane workers
- [ ] No persistent connections conflict with pooler (if using both)
- [ ] max_requests configured to refresh connections periodically
- [ ] "MySQL has gone away" error rate = 0%
