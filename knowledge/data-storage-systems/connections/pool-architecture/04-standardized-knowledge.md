# 10.2 Pool Architecture (Client-Side vs Server-Side)

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.2 |
| Knowledge Unit Title | Pool architecture (client-side vs server-side, ProxySQL, PgBouncer, RDS Proxy) |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 10.9 Read/write separation |
| Related KUs | 10.3 PgBouncer, 10.4 Octane connections |
| Last Updated | 2026-06-02 |

## Overview

Client-side pooling means the application (e.g., Octane's PDO connection pool) manages connections. Server-side pooling means a proxy (ProxySQL, PgBouncer, RDS Proxy) sits between the application and database, managing a fixed set of backend connections shared across many client connections. Choosing between these architectures determines infrastructure complexity, connection efficiency, runtime compatibility, and failover behavior.

## Core Concepts

- **Client-side pool**: Lives in worker memory (Octane's `PDOConnectionPool`). Simple — no extra infrastructure. Requires Octane or Swoole. Not available in PHP-FPM.
- **Server-side pool**: A proxy handles connections from many workers. The proxy manages a pool of backend connections. Works with any runtime (PHP-FPM, Octane, Swoole). Adds an infrastructure component.
- **Multiplexing**: A server-side pool with 50 backend connections can serve 500 client connections via transaction multiplexing (PgBouncer transaction mode). This is the key efficiency gain.
- **PgBouncer**: PostgreSQL-only pooler. Session, transaction, and statement pooling modes. Lightweight (~2MB RAM). Max client connections typically 10× backend connections.
- **ProxySQL**: MySQL/MariaDB pooler with query routing, rewriting, caching, and read/write splitting. More feature-rich than PgBouncer but heavier.
- **RDS Proxy**: AWS-managed pooler for RDS/Aurora. Serverless, auto-scaling, IAM authentication. No manual configuration.

## When To Use

- **Server-side pool**: PHP-FPM deployments, any runtime requiring connection multiplexing, multi-tenant with per-tenant connections, environments needing centralized connection management
- **Client-side pool**: Octane-only deployments, simple architectures wanting to avoid extra infrastructure, workloads with predictable connection counts
- **RDS Proxy**: AWS RDS/Aurora, serverless or auto-scaling architectures, IAM-based auth requirements

## When NOT To Use

- **Server-side pool**: Octane-only small deployments (adds unnecessary complexity), single-worker environments
- **Client-side pool**: PHP-FPM (no built-in pooling), high worker count scenarios (Octane's per-worker pool adds up)
- **RDS Proxy**: Non-AWS environments, deployments needing custom query routing

## Best Practices

- **Use server-side pool for PHP-FPM**: PHP-FPM cannot pool connections internally. Without PgBouncer/ProxySQL, each worker opens its own database connection, quickly exhausting `max_connections`.
- **Use Octane built-in pool for Octane apps**: Avoid adding PgBouncer if your entire app runs on Octane. The built-in pool is sufficient and simpler. Reason: Octane's pool lives per worker, so total connections = workers × pool.max, which is predictable and manageable.
- **Right-size pool with formulas**: Backend pool = (peak concurrent requests × connections per request) / multiplexing efficiency. For transaction pooling, assume 5–10× multiplexing. For session pooling, assume 1× (no multiplexing).
- **Separate read/write pools**: Read replicas need larger pools (more connections, tolerant of failure). Write pools need smaller pools (strict consistency, health checks). Configure separate pool sizes in database config.
- **Monitor pool utilization**: Track pool utilization % (active connections / total pool size). Alert at >80% utilization. Add connections or scale out before exhaustion.

## Architecture Guidelines

- **Simple web app (1–5 PHP-FPM servers)**: Single PgBouncer instance per database server. Session or transaction mode depending on Laravel compatibility needs.
- **Octane app (no legacy PHP-FPM)**: Use Octane built-in pool with `pool.min` and `pool.max` per connection. No external pooler needed.
- **High-traffic MySQL app (10+ web servers)**: ProxySQL cluster (two instances for HA). Query rules for read/write split. Connection multiplexing enabled if session-state is managed.
- **AWS RDS/Aurora**: RDS Proxy — serverless, IAM auth, auto-scaling. No PgBouncer or ProxySQL needed.
- **Multi-tenant architecture**: Consider per-tenant pools with dynamic connection config + PgBouncer. Or use ProxySQL with query-based routing if shared pool is acceptable.

## Performance Considerations

- Pooling reduces per-request connection overhead from 1–2ms to microseconds after initial connection.
- Server-side pools add <1ms proxy latency per query (PgBouncer is extremely fast).
- Each backend connection uses DB memory: account for this in pool sizing.
- Transaction pooling maximizes multiplexing efficiency but breaks session state. Session pooling is safer but uses more backend connections.
- Optimal pool size per database core: `2 × core_count + spindle_count` (PostgreSQL rule of thumb).

## Security Considerations

- Poolers add a network hop — ensure TLS between app and pooler and between pooler and database.
- PgBouncer supports `auth_type = cert`, `md5`, `scram-sha-256`. Use SCRAM for PostgreSQL.
- ProxySQL supports MySQL native password and TLS. Configure `mysql-have_ssl=true`.
- RDS Proxy integrates with IAM — database credentials never reach the application.
- Log all pooler authentication failures. Monitor for brute-force attempts.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No pool at all in PHP-FPM | Developer unaware of connection overhead | `max_connections` exceeded; DB crashes under load | Deploy PgBouncer or ProxySQL |
| 2 | Octane without pool config | Default Octane config doesn't pool | Each request creates new connection — same as PHP-FPM | Always configure `pool` in database config |
| 3 | Same pool config for read and write | Copy-paste config | Writes waste connections; reads starve | Use asymmetric pool sizes (read: larger, write: smaller) |
| 4 | PgBouncer session mode for web | Session mode holds connections for entire HTTP request | Poor multiplexing: 200 workers = 200 backend connections | Use transaction mode; handle session-state via connection init queries |

## Anti-Patterns

- **Single huge pool for all environments**: A pool sized for production will waste resources in development. Use environment-specific config.
- **Nested poolers**: PgBouncer behind RDS Proxy, or vice versa. Adds latency with no benefit.
- **Pooler as single point of failure**: Deploy poolers in pairs (ProxySQL clustering, PgBouncer DNS with health checks). A single pooler failure drops all connections.
- **No monitoring on pooler**: Blindly trusting the pooler without tracking utilization, connection wait times, or query throughput.

## Examples

```php
// config/database.php — PgBouncer server-side pool config
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('PGBOUNCER_HOST', '127.0.0.1'),
    'port' => env('PGBOUNCER_PORT', '6432'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'options' => [
        PDO::ATTR_EMULATE_PREPARES => true, // Required for transaction pooling
    ],
],

// Octane client-side pool config
'pgsql' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'pool' => [
        'min' => 4,
        'max' => 12,
        'ttl' => 60,
    ],
],
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, TCP connection basics
- **Closely Related**: 10.7 Connection count management, 10.12 PHP-FPM vs Octane vs Swoole
- **Advanced**: 10.10 Transaction pooling limitations, 10.15 ProxySQL query rules
- **Cross-Domain**: 7.9 Load balancing across replicas, 7.17 ProxySQL for query routing

## AI Agent Notes

- When a developer reports "max_connections reached", first check if a pooler is deployed
- For Octane apps complaining of DB connection errors, verify pool config exists
- Recommend server-side pool for PHP-FPM, client-side pool for Octane
- PgBouncer is lightweight and easy — recommend as first pooler for PostgreSQL
- ProxySQL is more complex but necessary for MySQL read/write splitting at the proxy level

## Verification

- [ ] Pooler is deployed and configured (server-side) or pool config present (Octane)
- [ ] Total backend connections ≤ database `max_connections` at peak load
- [ ] Pooler health checks pass
- [ ] No "max_connections" errors in application logs
- [ ] Pool utilization stays below 80% at peak traffic
- [ ] Failover scenario: pooler correctly routes to new primary
