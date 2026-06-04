# 10.4 Laravel Octane Connection Pool Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.4 |
| Knowledge Unit Title | Laravel Octane connection pool configuration (min/max connections) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.2 Pool architecture, 10.7 Connection count management |
| Last Updated | 2026-06-02 |

## Overview

Octane maintains a pool of database connections per worker. Configured via `'pool' => ['min' => 2, 'max' => 10]` in the database config. `min` = connections created at worker boot (pre-warmed). `max` = maximum connections this worker can open during traffic peaks. The pool prevents connection exhaustion and reduces per-request connection overhead to near zero. Without pool config, Octane creates a new connection per request, defeating the purpose of persistent workers.

## Core Concepts

- **Min connections (`pool.min`)**: Pre-warmed connections created when the worker starts. Available immediately for the first request without connection latency. Should be set to the expected baseline concurrent requests per worker.
- **Max connections (`pool.max`)**: Upper limit per worker. Prevents a single worker from opening too many connections during traffic spikes. Should be set to the peak concurrent requests per worker.
- **Connection reclamation (`pool.ttl`)**: Idle connections above `pool.min` are closed after the TTL expires (default 60 seconds). Keeps the pool lean during low traffic while maintaining pre-warmed connections for baseline traffic.
- **Per-worker isolation**: Each Octane worker has its own independent pool. Total database connections = (number of workers × pool.max). This is critical for capacity planning.

## When To Use

- Every Octane application — the pool config is mandatory, not optional
- Read/write separated connections with different pool sizes per connection type
- Worker-per-core or worker-per-N-requests Octane configurations

## When NOT To Use

- PHP-FPM deployments (Octane pool config has no effect)
- Long-running daemon processes that perform sequential work (single connection sufficient)
- Serverless environments (e.g., Laravel Vapor) where connection lifecycles are managed by the platform

## Best Practices

- **Always configure pool**: Without `pool` config, Octane defaults to creating a new connection per request. This eliminates the performance benefit of persistent workers. **Why**: The pool is what makes Octane efficient. Without it, you have the same connection overhead as PHP-FPM but with the complexity of a long-running process.
- **Set min to expected baseline concurrency**: If a worker typically handles 4 concurrent requests, set `pool.min = 4`. This ensures no request waits for a connection. **Why**: Connection creation is fast (~1ms) but not free. Pre-warming avoids the latency for the first 4 requests.
- **Set max to peak concurrency + buffer**: If peak is 8 concurrent requests per worker, set `pool.max = 10`. The buffer handles temporary spikes. **Why**: Setting max too low causes request queuing (waiting for a connection). Setting it too high risks exhausting database `max_connections`.
- **Separate pool configs for read and write connections**: Read pool: larger (more read requests), `min=4, max=12`. Write pool: smaller (fewer write requests), `min=2, max=4`. **Why**: Read and write workloads have different concurrency patterns. A single pool sized for reads wastes connections on writes.
- **Consider total connections across all workers**: With 8 workers and pool.max=10, total potential connections = 80. Ensure database `max_connections` is > 80 + admin connections.

## Architecture Guidelines

- Octane workers = (CPU cores × 2) is a common starting point. Each worker maintains its own pool.
- For Octane + read replicas: configure separate pool sizes for read and write connections.
- For Octane + PgBouncer: reduce Octane pool to `min=1, max=2` per worker and rely on PgBouncer for multiplexing. The combination adds complexity — usually one or the other is sufficient.
- For Octane + Swoole: Swoole's coroutine pool can be shared across coroutines, making it more efficient than Octane's per-worker pool.

## Performance Considerations

- Pool hit (connection from pool): ~0.01ms overhead
- Pool miss (create new connection): ~1–50ms depending on network and SSL
- Without pool config: every request pays connection overhead
- Total DB connections = workers × pool.max. For 16 workers × pool.max=8 = 128 connections.
- `pool.ttl` = 60s default. Adjust lower for dynamic environments (auto-scaling) or higher for stable workloads.
- Monitor pool utilization via Octane dashboard or custom metrics. High pool wait times indicate pool.max is too low.

## Security Considerations

- Each connection in the pool holds database credentials in memory. If a worker is compromised, all pooled connections are exposed. Minimize pool size.
- Rotate credentials: after credential rotation, force pool refresh by restarting Octane workers or using `DB::purge` + reconnect logic.
- The pool does not encrypt connections — configure TLS at the database driver level.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | No pool config in Octane | Developer assumes Octane pools by default | Every request creates a new connection; no pooling benefit | Always add `pool` array to database config |
| 2 | pool.max too high | Developer sets max=100 per worker | With 8 workers: 800 connections → database crash | Calculate: workers × pool.max < db max_connections |
| 3 | pool.min = pool.max | No room for traffic spikes | Under load, requests queue for connections | Set min for baseline, max for peak |
| 4 | Same pool config for all connections | Copy-paste between read and write configs | Write pool wastes connections, read pool starves | Differentiate: read pool larger, write pool smaller |
| 5 | Not monitoring pool utilization | Pool configured but never checked | Silent connection starvation during traffic spikes | Monitor via Octane dashboard or metrics |

## Anti-Patterns

- **pool.max = 1 for all workers**: Single connection per worker means serialized query execution. Requests queue for the connection.
- **No pool config at all**: Octane without pool config = PHP-FPM connection behavior with persistent process complexity.
- **Pool config on non-Octane driver**: Setting `pool` in database config for a `sqlite` or `sqlsrv` connection that Octane doesn't manage.

## Examples

```php
// config/database.php — Octane with separate read/write pool sizes
'mysql' => [
    'driver' => 'mysql',
    'write' => [
        'host' => env('DB_HOST_WRITE'),
        'pool' => [
            'min' => 2,
            'max' => 4,
            'ttl' => 60,
        ],
    ],
    'read' => [
        'host' => [
            env('DB_HOST_READ_1'),
            env('DB_HOST_READ_2'),
        ],
        'pool' => [
            'min' => 4,
            'max' => 12,
            'ttl' => 60,
        ],
    ],
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
],

// Worker boot — connection warmup via ServiceProvider
public function boot(): void
{
    if ($this->app->bound('octane')) {
        // Pre-warm connection
        DB::connection('mysql')->select('SELECT 1');
    }
}
```

## Related Topics

- **Prerequisites**: 10.1 Connection lifecycle, 10.2 Pool architecture
- **Closely Related**: 10.7 Connection count management, 10.12 PHP-FPM vs Octane vs Swoole
- **Advanced**: Octane + PgBouncer co-existence, Octane + Swoole coroutine pool comparison
- **Cross-Domain**: Octane configuration, Swoole coroutine connection management

## AI Agent Notes

- When Octane users report DB errors, check if pool config exists — this is the most common mistake
- Calculate total connection impact: workers × pool.max
- Recommend separate pool sizes for read vs write
- pool.ttl = 60s is good default; only adjust if connections are recycled too frequently or not frequently enough
- Pre-warming connections in a ServiceProvider boot() method avoids first-request latency

## Verification

- [ ] `pool` config array exists in all database connections used by Octane
- [ ] `pool.min` <= `pool.max` for all connections
- [ ] Total potential connections (workers × pool.max) < database `max_connections`
- [ ] No connection wait times in Octane dashboard during peak load
- [ ] Read and write connections have separate pool configurations
- [ ] Pool utilization stays under 80% at peak traffic
