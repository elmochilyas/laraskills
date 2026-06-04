# Standardized Knowledge: Memory-Resident Architecture

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Memory-Resident Architecture |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Migrate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Memory-resident architectures (Laravel Octane, Swoole, RoadRunner, FrankenPHP) boot the PHP application **once per worker** and handle hundreds to thousands of requests within the same process. This eliminates per-request bootstrap overhead — the dominant cost for fast requests — and achieves 3-15x throughput gains over traditional PHP-FPM for API workloads.

## Core Concepts

- **Boot-once**: Framework bootstrap (service container, config loading, routing registration) happens once at worker start.
- **Handle-many**: Each incoming request is dispatched to an already-booted application instance.
- **State persistence risk**: Static properties, singletons, and global state persist across requests, requiring explicit management.
- **Memory overhead**: Each worker consumes 30-80MB baseline memory — FPM pays per-request, memory-resident pays continuously.

## When To Use

- High-throughput API workloads where bootstrap dominates response time
- Sub-50ms endpoints (bootstrap was 60-80% of request time)
- Dedicated application servers with controlled code deployments
- Teams willing to audit static property usage and service provider setup

## When NOT To Use

- Slow endpoints (>500ms database queries) see minimal gains from memory-resident architecture
- Applications with heavy global state that cannot be audited or refactored
- Multi-tenant environments where per-request isolation is a hard requirement
- Teams without the expertise to manage state leaks and memory drift

## Best Practices (WHY)

- **Profile bootstrap cost first**: If framework bootstrap is <20% of total request time, Octane gains will be modest. Measure before migrating.
- **Audit service providers**: Static properties, singletons, and deferred providers must be reviewed for cross-request state leaks.
- **Use connection pooling**: Database and Redis connections must be managed across requests — Octane provides built-in pooling.
- **Set max_requests for recycling**: Even in memory-resident mode, recycle workers after 1000-5000 requests to prevent memory drift.

## Architecture Guidelines

- **Throughput**: 3-15x vs PHP-FPM depending on workload. Sub-50ms endpoints see largest gains.
- **Memory**: Higher baseline but lower per-request allocation overhead. Baseline 30-80MB per worker.
- **Complexity**: Requires service provider auditing, static property elimination, connection pooling.
- **Compatibility**: Some packages (relying on per-request state) require modification.

## Performance

- Laravel Octane with RoadRunner achieves 41-111% throughput improvement over FPM in benchmarks
- FrankenPHP: 3-5x throughput vs PHP-FPM in worker mode
- Sub-50ms API endpoints see the largest relative gains (bootstrap was 60-80% of request time)
- Slow endpoints (>500ms database queries) see minimal gains

## Security

- Static properties persisting across requests can leak user data between requests
- Connection pooling requires careful handling of authentication context
- Memory-resident workers retain residual memory — sensitive data may persist until overwritten
- Regular worker recycling (pm.max_requests equivalent) mitigates data leakage

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Migrating without state audit | Assuming Octane is drop-in | User data leaks between requests | Audit all static properties and singletons |
| Expecting gains on slow endpoints | Not checking bootstrap proportion | Disappointment, wasted migration effort | Profile first; only migrate if bootstrap > 20% |
| No worker recycling | Forgetting memory drift | Worker RSS grows unbounded, OOM risk | Set max_requests = 1000-5000 |
| Improper connection management | Single-request mindset | Connection exhaustion, stale data | Use Octane's connection pooling |

## Anti-Patterns

- **Expecting drop-in replacement**: Memory-resident architectures require significant code auditing. Many Laravel packages break without modification.
- **Migrating the entire application at once**: Start with a single endpoint or service. Validate behavior before expanding.
- **Ignoring deployment differences**: Memory-resident workers need graceful reload for code changes. Plan deployment pipeline accordingly.

## Examples

```bash
# Laravel Octane with RoadRunner
composer require laravel/octane
php artisan octane:install --server=runtime:roadrunner
php artisan octane:start --server=roadrunner --host=0.0.0.0 --port=8000

# Laravel Octane with FrankenPHP
php artisan octane:install --server=frankenphp
php artisan octane:start --server=frankenphp
```

## Related Topics

- Shared-Nothing Architecture
- Concurrency Models
- Laravel Octane Architecture
- Swoole Architecture
- RoadRunner Architecture
- FrankenPHP Worker Mode

## AI Agent Notes

- Memory-resident architectures trade per-request bootstrap cost for continuous memory commitment.
- The gain is proportional to bootstrap proportion. Fast APIs (<50ms) benefit most. Slow apps (>500ms) benefit little.
- State management is the primary operational risk. Static properties, singletons, and globals must be audited.
- Always set max_requests to recycle workers and manage memory drift.
- RoadRunner offers the best all-around performance for Laravel Octane (41-111% over FPM).

## Verification

- [ ] Bootstrap cost measured and confirmed >20% of request time
- [ ] All service providers audited for static property usage
- [ ] Static properties and singletons reviewed for cross-request state leaks
- [ ] Connection pooling configured for database and Redis
- [ ] Worker recycling configured (max_requests = 1000-5000)
- [ ] Deployment pipeline handles graceful worker reload
- [ ] Before/after benchmark confirms expected throughput gain
