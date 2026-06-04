# 10.7 Connection Count Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.7 |
| Knowledge Unit Title | Connection count management (max_connections, pool sizing, avoiding connection storms) |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 10.2 Pool architecture |
| Related KUs | Connection tags observability |
| Last Updated | 2026-06-02 |

## Overview

Database `max_connections` limits concurrent connections. Pool sizing must respect this limit. Connection storms occur when a traffic spike or deployment restart causes many workers to open connections simultaneously, overwhelming the database connection handler. Proper pool sizing, reserved admin connections, and graceful startup patterns prevent these incidents.

## Core Concepts

- **max_connections**: MySQL default 151, PostgreSQL default 100. Each connection uses ~2–10MB RAM on the database server. 500 connections = 1–5GB RAM. Configurable but bounded by server memory.
- **Pool sizing formula**: Total pool connections = (PHP-FPM workers × connections per worker) / multiplexing ratio. With PgBouncer transaction mode: 50 connections may serve 300 workers. Without pooling: 300 workers = 300 connections.
- **Connection storm**: A deployment restart causes all workers to reconnect simultaneously. The database sees hundreds of new connections in a second, potentially exceeding `max_connections` and causing application-wide errors.
- **Reserved admin connections**: MySQL: `reserved_connections = 5`. PostgreSQL: `superuser_reserved_connections = 3`. Always reserve connections for admin access so the database can be reached even when the pool is full.
- **Connection per RAM cost**: Each connection ties up buffer pool memory, sort buffers, and metadata structures. Beyond RAM, connection count affects context switching and lock manager overhead on the database server.

## When To Use

- Every production database deployment — connection count management is mandatory, not optional
- Auto-scaling environments where the number of application servers varies
- Multi-tenant deployments where each tenant may consume connections differently
- Any application using PHP-FPM (which creates one connection per worker per request)

## When NOT To Use

- Single-worker CLI scripts (trivial connection count)
- Serverless databases (RDS Proxy, Aurora Serverless manage connections automatically)
- Embedded databases (SQLite — single connection per process)

## Best Practices

- **Always reserve admin connections**: Configure `superuser_reserved_connections = 3` (PostgreSQL) or `reserved_connections = 5` (MySQL). **Why**: When the pool is exhausted, only superuser/reserved connections can connect to diagnose and fix the issue. Without this, a connection storm can lock everyone out, requiring a database restart.
- **Calculate pool size from server memory**: `max_connections = (total_ram - OS_overhead - buffer_pool) / connection_memory_per_process`. **Why**: Setting max_connections arbitrarily high causes out-of-memory errors on the database server. Each connection consumes memory whether active or idle.
- **Stagger worker startup**: Configure workers to start with a random delay (100–500ms spread). **Why**: Simultaneous startup creates a connection storm. Staggering spreads connection creation over several seconds, giving the database time to handle each connection.
- **Use pooler multiplexing to reduce connection count**: With PgBouncer transaction mode, 50 backend connections serve 200+ PHP-FPM workers. **Why**: Backend connections are the scarce resource (each consumes DB RAM). Multiplexing maximizes the work per backend connection.
- **Monitor connection utilization, not just count**: Track `active_connections / max_connections` as a percentage. Alert at >80%. **Why**: Raw connection count doesn't indicate whether connections are being used efficiently. A pool at 50% utilization but growing indicates a scaling need before it reaches 100%.

## Architecture Guidelines

- **PHP-FPM without pooler**: Total connections = number of PHP-FPM workers. For 16 servers × 50 workers = 800 connections. This requires `max_connections >= 800 + admin_reserved`. Almost always needs a pooler.
- **PHP-FPM with PgBouncer**: Total backend connections = PgBouncer `default_pool_size`. For 50 pool connections serving 800 workers = 50 connections. `max_connections` can be 60 (50 pool + 10 admin).
- **Octane without pooler**: Total connections = workers × pool.max. For 8 workers × pool.max=10 = 80 connections. Manageable for small deployments.
- **Octane with PgBouncer**: Total connections = PgBouncer pool size. Octane's per-worker pool is unnecessary — reduce Octane pool to min=1, max=1 and let PgBouncer handle multiplexing.
- **Reserve 5–10 connections**: Always reserve connections for monitoring tools (Prometheus, Datadog), admin access, and backup processes.

## Performance Considerations

- Each connection consumes 2–10MB on the database server (depends on config: sort buffers, statement timeouts, etc.).
- More connections = more context switching on the database CPU. PostgreSQL is particularly sensitive to high connection counts (designed for few connections, each doing more work).
- Connection pooling reduces database-side memory by 5–10× compared to direct connections.
- Setting `max_connections` too low causes `too many connections` errors. Setting it too high causes out-of-memory crashes.
- `pgbouncer.default_pool_size` should be sized for the P95 concurrent query count, not P99 or max.

## Security Considerations

- `superuser_reserved_connections` prevents complete lockout but requires superuser credentials — protect them.
- Connection storms can be caused by DDoS attacks. Rate-limit new connection attempts at the network level (load balancer, firewall).
- Monitor for sudden connection spikes as a potential security incident indicator.
- Each connection is an authentication event. High connection churn increases the surface area for credential-based attacks.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | max_connections set too high | Arbitrarily setting 1000+ connections | Out-of-memory crash on DB server | Calculate from available RAM: max_connections = (RAM - overhead) / per_connection_memory |
| 2 | No reserved admin connections | Default config with no reserved slots | Connection storm locks everyone out, requiring DB restart | Configure reserved_connections / superuser_reserved_connections |
| 3 | Simultaneous worker startup | All workers restart at once after deploy | 300+ connections opened in 1 second | Stagger worker startup with 100–500ms random delay |
| 4 | No pooler for PHP-FPM | Direct connections from all workers | Connection count = worker count, often exceeding max_connections | Deploy PgBouncer or ProxySQL |
| 5 | Octane pool.max too high | Setting max=100 per worker without calculating total | 8 workers × 100 = 800 connections, exceeding DB capacity | Ensure workers × pool.max < max_connections - reserved |

## Anti-Patterns

- **Connection counting without monitoring**: Setting `max_connections` and never tracking actual usage. Connection patterns change with traffic — monitor actively.
- **`max_connections` as a scaling strategy**: Increasing `max_connections` to handle more traffic. The database server has finite RAM — at some point, more connections = OOM.
- **No pooler because "we use Octane"**: Octane's pool helps but doesn't replace PgBouncer for large deployments. Multiple Octane servers with Octane pools still create many connections.
- **Ignoring connection storms in CI/CD**: Deploy pipelines that restart all application servers simultaneously create connection storms in production.

## Examples

```ini
# PostgreSQL connection config
max_connections = 200                 # Total: 200 connections
superuser_reserved_connections = 10   # 10 reserved for admin
# Available for application: 190 connections

# PgBouncer calculation:
# default_pool_size = 50
# Workers: 200 PHP-FPM × 4 servers = 800 workers
# Multiplexing ratio (transaction mode): ~10×
# Backend connections needed: 800 / 10 = 80
# So: default_pool_size = 80, plus 10 reserved = 90 out of 190 available
```

```php
// Octane pool sizing calculation
// 8 workers, each with pool.max = 10
// Total = 8 * 10 = 80 connections
// DB max_connections = 100, reserved = 5
// Available = 95, needed = 80 ✓

'database' => [
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'pool' => [
                'min' => 2,
                'max' => 10,
            ],
            // ...
        ],
    ],
],
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, 10.2 Pool architecture
- **Closely Related**: 10.8 Connection tags observability, 10.14 Connection health checks
- **Advanced**: 10.10 Transaction pooling limitations, PgBouncer `default_pool_size` tuning
- **Cross-Domain**: Database server memory configuration, application auto-scaling strategies

## AI Agent Notes

- Connection count issues are the most common database scaling problem in Laravel apps
- First question when diagnosing: "Do you have a pooler?" If no, that's the root cause
- Calculate: current workers × servers — that's the minimum connection count without pooling
- With pooler, the ratio is ~5–10× multiplexing for transaction mode
- Always reserve admin connections — this single config prevents complete lockout scenarios
- Connection storms are a deployment-time problem, not a runtime problem — address in CI/CD pipeline

## Verification

- [ ] Database `max_connections` is set based on available RAM calculation
- [ ] Reserved/superuser connections are configured
- [ ] Pooler is deployed if using PHP-FPM (or Octane pool is configured)
- [ ] Worker startup is staggered to prevent connection storms
- [ ] Total potential connections (workers × pool.max) < max_connections - reserved
- [ ] Connection utilization is monitored with alerts at >80%
- [ ] No "too many connections" errors during peak traffic or deployments
