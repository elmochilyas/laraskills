# 10.12 Connection Behavior in PHP-FPM vs. Octane vs. Swoole

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.12 |
| Knowledge Unit Title | Connection behavior in PHP-FPM vs. Octane vs. Swoole |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.2 Pool architecture, 10.4 Octane pool, 6.16 Swoole coroutine dispatch |
| Last Updated | 2026-06-02 |

## Overview

PHP-FPM creates a new connection per request (connect + disconnect overhead). Octane maintains persistent connections per worker (connect once, reuse across requests). Swoole uses coroutine-based connection pooling (shared pool across coroutines). The connection pooling requirement differs fundamentally per runtime: PHP-FPM needs a server-side pool (PgBouncer). Octane uses a built-in pool per worker. Swoole uses a shared coroutine pool. Choosing the wrong connection strategy for your runtime leads to connection exhaustion or wasted resources.

## Core Concepts

- **PHP-FPM**: Short-lived process (per-request). New TCP connection per request. Total connections = (PHP-FPM workers × connections per worker). High overhead — each request pays 1–50ms connection latency. Server-side pooling (PgBouncer, ProxySQL) is required to multiplex connections.
- **Octane**: Long-lived worker (RoadRunner, Swoole server). Connection pool per worker. Total connections = (workers × pool.size). Built-in PDO pool (`pool.min`, `pool.max`). No external pooler needed for small deployments. Connections persist across requests within the same worker.
- **Swoole native**: Coroutine-based. Shared connection pool across all coroutines. Total connections = pool size (shared, not per worker). Most efficient model — coroutines share a single pool, maximizing connection reuse. Requires manual pool implementation with `Swoole\Coroutine\Channel`.
- **Laravel Octane (Swoole driver)**: Combines Octane's per-worker pool with Swoole's coroutine capabilities. Each worker has its own pool, but within a worker, coroutines share that pool.
- **RoadRunner**: Similar to Octane — persistent workers, per-worker pool. RoadRunner does not have built-in coroutine support, so it behaves like Octane's RoadRunner driver.

## When To Use

- **PHP-FPM**: Traditional Laravel deployments, shared hosting, compatibility with older PHP packages, simple deployment models
- **Octane**: High-traffic Laravel applications, need for persistent workers, built-in connection pooling, compatibility with Laravel ecosystem
- **Swoole native**: Maximum performance requirements, non-Laravel PHP applications, coroutine-based architectures, custom protocols

## When NOT To Use

- **PHP-FPM**: Applications with very high concurrency requirements (500+ req/s per server), latency-sensitive applications
- **Octane**: Applications with memory leaks, applications with incompatible global state, deployment environments without process management (supervisor)
- **Swoole native**: Laravel applications (Octane provides better Laravel integration), teams without coroutine programming experience

## Best Practices

- **PHP-FPM must use a server-side pooler**: Deploy PgBouncer or ProxySQL. **Why**: PHP-FPM creates one connection per worker per request. With 50 workers and 10 servers = 500 connections. A pooler multiplexes this to 50–100 backend connections. Without a pooler, `max_connections` is easily exhausted.
- **Octane must configure pool**: Always set `pool.min` and `pool.max` in database config. **Why**: Without pool config, Octane creates a new connection per request — the same behavior as PHP-FPM but with the memory overhead of a persistent worker. The pool is what makes Octane efficient.
- **Match pool sizing to runtime**: PHP-FPM total connections = workers × 1. Octane total connections = workers × pool.max. Swoole total connections = shared_pool_size. **Why**: Each runtime has a different connection accounting formula. Sizing for the wrong formula leads to either wasted connections or connection exhaustion.
- **Use server-side pooler with PHP-FPM + Octane mixed**: If the same application runs both PHP-FPM (legacy) and Octane, use PgBouncer in session mode for both. **Why**: A shared pooler provides consistent connection behavior regardless of runtime. The pooler handles multiplexing for PHP-FPM while Octane's built-in pool is redundant but harmless.
- **Swoole coroutine pool requires manual management**: Octane handles pooling automatically. Native Swoole requires implementing `ConnectionPool` with `Swoole\Coroutine\Channel`. **Why**: Coroutines cannot share PDO instances directly. A channel-based pool provides safe concurrent access.

## Architecture Guidelines

- **PHP-FPM only**: App → PgBouncer/ProxySQL → Database. Pooler is mandatory.
- **Octane only**: App → Database. Built-in pool is sufficient. Pooler is optional and only needed for large-scale deployments.
- **Swoole native**: App → Database. Coroutine pool manages connections. Pooler is optional.
- **Mixed PHP-FPM + Octane**: All traffic → PgBouncer/ProxySQL → Database. The pooler normalizes connection behavior.
- **Multi-server Octane**: Each server has Octane workers with their own pools. Server-side pooler balances across database. Pooler is recommended for multi-server Octane deployments.
- **Octane + read replicas**: Separate pool configs for read and write connections. Read pool: larger. Write pool: smaller.

## Performance Considerations

- PHP-FPM without pooler: 1–50ms connection overhead per request. 500 req/s = 0.5–25 seconds of connection time per second.
- PHP-FPM with PgBouncer: Connection overhead reduced to ~0.01ms (pool hit). Negligible per-request cost.
- Octane without pool config: Same as PHP-FPM (connection per request). With pool: ~0.01ms per request.
- Swoole coroutine pool: Most efficient — connections are shared across all coroutines, minimizing total connections.
- Memory per connection is the same regardless of runtime: ~2–10MB on the database server.
- Swoole coroutine pool adds pooling overhead in PHP memory (not database memory). Octane's pool adds per-worker overhead.

## Security Considerations

- PHP-FPM: Connections are ephemeral — each request gets a fresh connection. No cross-request state leakage risk.
- Octane: Connections persist across requests within the same worker. State (SET SESSION, temp tables) must be explicitly reset between requests.
- Swoole: Same concern as Octane but amplified — coroutines share the pool concurrently. Connection state management is critical.
- For all runtimes: Use connection tagging (`application_name`) to identify the runtime source in monitoring.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | PHP-FPM without pooler | Default config, no PgBouncer | Connection exhaustion under load | Deploy PgBouncer or ProxySQL |
| 2 | Octane without pool config | Config copied from PHP-FPM app | Every request creates new connection | Add `pool` array to database config |
| 3 | Same pool config for PHP-FPM and Octane | Copy-pasted config between environments | Pool behavior differs per runtime | Understand each runtime's connection model |
| 4 | Swoole coroutine pool without Channel | PDO instances shared naively across coroutines | Race conditions, segmentation faults | Use Swoole\Coroutine\Channel for safe pool access |
| 5 | PgBouncer deployed when only Octane is used | Over-engineered infrastructure | Unnecessary complexity; Octane's pool alone is sufficient | Only add pooler when scaling beyond single-server Octane |

## Anti-Patterns

- **Migrating from PHP-FPM to Octane without pool review**: PHP-FPM's PgBouncer config may be unnecessary (or harmful) with Octane. Review pooling strategy during migration.
- **Swoole coroutines sharing a single PDO instance**: PDO is not coroutine-safe. Always use connection pooling with Channel.
- **Using PHP-FPM's `pdo_options` in Octane`: Some options (like persistent connections) are irrelevant or harmful in Octane.
- **Runtime changes for connection switching in PHP-FPM**: PHP-FPM's short-lived processes make dynamic connection config viable but wasteful (config must be re-read per request anyway).

## Examples

```php
// PHP-FPM config — server-side pooler required
// config/database.php (no pool — pooler handles it)
'mysql' => [
    'driver' => 'mysql',
    'host' => env('PROXYSQL_HOST'),
    'port' => env('PROXYSQL_PORT', '6033'),
    // No pool config — PDO connection per request
],

// Octane config — built-in pool
'mysql' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
    'pool' => [
        'min' => 2,
        'max' => 8,
    ],
],

// Swoole coroutine pool
use Swoole\Coroutine\Channel;

class ConnectionPool
{
    private Channel $pool;

    public function __construct(int $size)
    {
        $this->pool = new Channel($size);
        for ($i = 0; $i < $size; $i++) {
            $this->pool->push($this->createConnection());
        }
    }

    public function get(): PDO
    {
        return $this->pool->pop();
    }

    public function put(PDO $connection): void
    {
        $this->pool->push($connection);
    }
}
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, 10.2 Pool architecture
- **Closely Related**: 10.4 Octane connection pool, 10.7 Connection count management
- **Advanced**: Swoole coroutine pool internals, RoadRunner connection behavior
- **Cross-Domain**: 6.16 Swoole/Octane coroutine shard dispatching, Octane deployment configuration

## AI Agent Notes

- The biggest mistake is using PHP-FPM config in Octane (no pool) or Octane config in PHP-FPM (pool ignored)
- PHP-FPM always needs a server-side pooler (PgBouncer, ProxySQL)
- Octane without pool config = PHP-FPM connection behavior with persistent worker memory cost
- Swoole coroutine pool is the most efficient but requires manual implementation
- When migrating runtimes, always review the connection pooling strategy — don't carry forward old patterns

## Verification

- [ ] PHP-FPM: PgBouncer or ProxySQL is deployed and configured
- [ ] Octane: `pool` config exists in all database connections
- [ ] Swoole: Coroutine-safe connection pool is implemented (Channel-based)
- [ ] Total connections formula matches the runtime (PHP-FPM: workers × 1, Octane: workers × pool.max, Swoole: pool.size)
- [ ] No connection exhaustion under peak load
- [ ] Runtime version is correctly identified in connection tags
- [ ] Migration from one runtime to another includes pooling strategy review
