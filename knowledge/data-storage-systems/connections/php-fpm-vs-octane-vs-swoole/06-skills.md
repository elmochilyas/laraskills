# Skill: Match Connection Strategy to Runtime

## Purpose

Select and configure the correct connection pooling strategy based on runtime: PHP-FPM (server-side pooler), Octane (built-in pool), or Swoole (coroutine channel pool).

## When To Use

- Choosing runtime for a new Laravel application
- Migrating between runtimes (e.g., PHP-FPM to Octane)
- Diagnosing connection exhaustion related to runtime choice
- Deploying new application servers with different runtimes

## When NOT To Use

- Single-runtime application with working connection strategy
- Serverless deployments (runtime connection is managed by platform)

## Prerequisites

- Understanding of connection lifecycle (10-1)
- Understanding of pool architecture (10-2)
- Understanding of Octane pool (10-4)

## Inputs

- Application runtime (PHP-FPM vs Octane vs Swoole)
- Number of workers/processes
- Expected traffic concurrency
- Database max_connections

## Workflow (numbered steps)

1. Identify your runtime:
   - **PHP-FPM**: Short-lived process per request. New TCP connection per request. Server-side pooler REQUIRED.
   - **Octane**: Long-lived worker. Connection pool per worker. Built-in pool sufficient for small deployments.
   - **Swoole native**: Coroutine-based. Shared connection pool across coroutines. Most efficient but requires manual pool implementation.

2. Configure based on runtime:

   **PHP-FPM** — deploy server-side pooler:
   ```php
   // Direct connection to pooler (no pool config)
   'mysql' => [
       'host' => env('PROXYSQL_HOST'),
       'port' => env('PROXYSQL_PORT', '6033'),
   ];
   ```
   Total connections = workers × 1. Without pooler: connection exhaustion.

   **Octane** — configure built-in pool:
   ```php
   'mysql' => [
       'pool' => ['min' => 2, 'max' => 10],
   ];
   ```
   Total connections = workers × pool.max.

   **Swoole native** — implement coroutine-safe pool:
   ```php
   class ConnectionPool {
       private Channel $pool;
       public function get(): PDO { return $this->pool->pop(); }
       public function put(PDO $conn): void { $this->pool->push($conn); }
   }
   ```
   Total connections = shared pool size.

3. Match pool sizing formula to runtime:
   - PHP-FPM without pooler: workers × 1
   - PHP-FPM with pooler: default_pool_size (multiplexed)
   - Octane: workers × pool.max
   - Swoole: shared_pool_size

4. For mixed PHP-FPM + Octane, use a server-side pooler for both

## Validation Checklist

- [ ] PHP-FPM: PgBouncer or ProxySQL deployed
- [ ] Octane: `pool` config exists in all database connections
- [ ] Swoole: Coroutine-safe connection pool implemented (Channel-based)
- [ ] Total connections formula matches runtime
- [ ] No connection exhaustion under peak load
- [ ] Runtime version correctly identified in connection tags
- [ ] Migration between runtimes includes pooling strategy review

## Common Failures

- PHP-FPM without pooler — 200 workers = 200 connections, exhaustion
- Octane without pool config — every request creates new connection
- Same pool config for PHP-FPM and Octane — wrong behavior per runtime
- Swoole sharing PDO without Channel — race conditions, segfaults
- PgBouncer deployed when only Octane used — unnecessary complexity

## Decision Points

- PHP-FPM vs Octane vs Swoole for new projects
- Server-side pooler (PgBouncer) needed vs built-in pool sufficient
- Octane workers = CPU cores × 2 vs custom sizing
- Swoole: Channel pool implementation vs third-party library

## Performance Considerations

- PHP-FPM without pooler: 1–50ms connection overhead per request
- PHP-FPM with PgBouncer: ~0.01ms per request (pool hit)
- Octane without pool config: same as PHP-FPM
- Octane with pool: ~0.01ms per request
- Swoole coroutine pool: most efficient (shared across coroutines)

## Security Considerations

- PHP-FPM: ephemeral connections, no cross-request state leakage
- Octane: persistent connections across requests — reset state between requests
- Swoole: same concern as Octane but amplified (coroutines share pool concurrently)
- All runtimes: use connection tagging to identify runtime source

## Related Rules

- 10-12-1: PHP-FPM Must Use Server-Side Pooler
- 10-12-2: Octane Must Configure Pool

## Related Skills

- Configure Octane Connection Pool
- Configure Pool Architecture
- Use PgBouncer Pooling Modes

## Success Criteria

- Connection strategy matches runtime type
- Pool sizing formula correctly applied for runtime
- No connection exhaustion under peak load
- Migration from one runtime to another updates pooling strategy
