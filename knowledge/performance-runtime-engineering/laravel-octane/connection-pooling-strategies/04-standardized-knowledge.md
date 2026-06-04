# Connection Pooling Strategies — Database, Redis Across Workers

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Connection Pooling Strategies — Database, Redis Across Workers |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

In Octane, database and Redis connections are **persistent** (created once per worker, shared across requests). This eliminates connection establishment overhead (~0.5–2ms saved per request) but introduces two risks: transaction leakage (a failed transaction leaves a connection in a dirty state for the next request) and connection count budgeting (each worker's persistent connections multiplied by worker count must fit within database `max_connections`).

## Core Concepts

- **Persistent connections in Octane**: Octane creates connections at worker start. Each request within the same worker reuses the same PDO/Redis connection — no TCP handshake per request.
- **Transaction safety**: Octane resets connections after each request (rolls back open transactions, releases locks). Framework handles this automatically, but custom queries outside Eloquent may bypass the reset.
- **Connection budgeting**: `worker_count × connections_per_worker = database_max_connections × 0.8`. With 8 workers and 3 connections each (MySQL + Redis + HTTP), you need 24 DB connections.
- **Read/write splitting**: Separate read and write connections. Read replicas serve more concurrent queries without exhausting the write-primary connection pool.

## When To Use

- You are running Laravel Octane with persistent workers and need to avoid exhausting database connection limits.
- Your application has a large number of workers and needs to calculate safe connection budgets per database/Redis instance.
- You are migrating from PHP-FPM (short-lived connections) to Octane (persistent connections) and need to adjust database configuration.

## When NOT To Use

- Your application runs on traditional PHP-FPM where connections are created and destroyed per request — persistent connection pooling is not applicable.
- Your database connection pool is already sized for peak concurrent traffic and cannot be increased — consider reducing worker count instead.
- You are using a serverless deployment (e.g., Laravel Vapor) where the runtime manages connections independently.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Monitor connection count after Octane deployment | Each worker opens connections once and never closes them. If connections exhaust the database pool, reduce worker count or increase DB `max_connections`. |
| Set connection pool timeout | Prevents deadlocks when all connections are checked out and a request waits forever. |
| Ensure connections are returned after each request | Octane's sandbox reset handles this automatically for Eloquent, but custom PDO or Redis usage may bypass the reset. |
| Calculate connection budget as `workers × connections` | With N workers each holding M persistent connections, the total must stay within the database's limit with a 20% safety margin. |

## Architecture Guidelines

- **Connection pool health monitoring**: Track database connection count per worker. Alert when utilization exceeds 80% of `max_connections`.
- **Read/write splitting architecture**: Use separate read replicas for read queries to avoid exhausting write-primary connection pool. Configure `config/database.php` with `read` and `write` hosts.
- **Graceful degradation**: When connection pool is exhausted, implement queue-based fallback or return a 503 with Retry-After header instead of letting workers hang.
- **Per-driver considerations**: RoadRunner (process-per-worker) has the simplest connection model. Swoole coroutines can share connections across coroutines within the same worker, reducing total connection count. FrankenPHP follows the same model as RoadRunner.

## Performance Considerations

- Octane delivers 2.5–20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains.
- Each worker uses 30–80MB RSS; total memory = workers × per-worker memory.
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker.
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated).
- OpCache preloading further reduces cold-start latency by 2–5ms per worker.
- Connection establishment overhead saved: ~0.5–2ms per request per connection.

## Security Considerations

- Transaction leakage can expose data from one request to another. Octane's sandbox reset handles this, but always verify custom queries properly commit or rollback.
- Connection pooling does not authenticate per-request — authentication happens at worker start. Ensure the database user has minimal required privileges.
- Monitor for connection exhaustion attacks — when all connections are consumed, new requests cannot reach the database. Use connection pool limits and connection timeouts as guardrails.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Octane + transactions across requests | A transaction left open at request end (missing commit/rollback) causes the next request to inherit the transaction context. | Developer forgets to commit or rollback in custom queries outside Eloquent. | All queries in the next request run inside the stale transaction, potentially causing data corruption or deadlocks. | Always ensure commit/rollback in a `finally` block. Use database drivers that auto-rollback on request end. |
| Underestimating connection count | Deploying Octane with N workers without recalculating database connection limits. | Failure to account that each worker holds persistent connections. | Database `max_connections` is exhausted, causing connection refused errors. | Calculate `workers × connections-per-worker` and set `max_connections` to at least 1.25× that value. |
| No connection pool timeout | Workers hang indefinitely when all connections are checked out. | Default PHP PDO settings have no connection timeout. | Requests pile up, workers become unresponsive, and no monitoring alerts because the process is still alive. | Set `options` => [PDO::ATTR_TIMEOUT => 5] in database config and use a connection pool with a timeout. |

## Anti-Patterns

- **Single shared connection across all workers**: Using one database connection for all workers creates a bottleneck and eliminates the benefit of persistent connections. Each worker should maintain its own connection pool.
- **Opening new connections per request inside Octane**: Defeats the purpose of Octane's persistent worker model. Always use the framework's connection resolver, which returns the worker's persistent connection.
- **Ignoring transaction state across requests**: Assuming the connection is clean for each request without verifying. Custom raw queries (DB::statement, PDO direct) can leave uncommitted transactions.

## Examples

```
// Configuring read/write connections for Octane connection budgeting
// config/database.php
'mysql' => [
    'driver' => 'mysql',
    'read' => [
        'host' => ['10.0.0.1'],  // read replica
    ],
    'write' => [
        'host' => ['10.0.0.2'],  // write primary
    ],
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    'charset' => 'utf8mb4',
    // Connection timeout prevents worker hang when pool is exhausted
    'options' => extension_loaded('pdo_mysql') ? [
        PDO::ATTR_TIMEOUT => 5,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ] : [],
],
```

```
// Safe transaction handling in Octane workers
// Always commit or rollback in a finally block
DB::beginTransaction();
try {
    // ... queries ...
    DB::commit();
} catch (Throwable $e) {
    DB::rollBack();
    throw $e;  // rethrow — Octane catches this and resets sandbox
}
// No finally needed if using try/catch above — rollback happens on failure
```

## Related Topics

- State Management and Leak Prevention
- Worker Configuration by Driver
- Capacity Planning Safety Margins
- Database Query Optimization
- Redis Connection Management

## AI Agent Notes

- When assisting with connection pooling configuration, always compute the connection budget: `workers × connections-per-worker` and compare against the database's `max_connections`.
- Recommend starting with 4 workers for most applications and increasing based on monitoring.
- The most common mistake is deploying Octane without adjusting database connection limits — always flag this.
- For FrankenPHP and RoadRunner, connection behavior is identical (one persistent connection per worker per service). Swoole with coroutines can share connections across coroutines — account for this in connection budget calculations.

## Verification

- [ ] Calculate total persistent connections: `worker_count × connections_per_worker` and ensure database `max_connections` has 20% headroom.
- [ ] Verify that all custom query code properly commits or rolls back transactions (no open transactions at request boundary).
- [ ] Configure connection pool timeouts in database configuration for all environments.
- [ ] Set up monitoring alerts for database connection utilization exceeding 80%.
- [ ] Test with `php artisan octane:status` to verify worker health after connection configuration changes.
- [ ] Verify read/write splitting configuration routes SELECT queries to read replicas.
- [ ] Run load test to confirm connection count does not exceed database limits under peak traffic.
