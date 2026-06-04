# Laravel Octane Throughput & Cost Impact

## Metadata
- **ID**: KU-38-OCTANE-THROUGHPUT
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Laravel Octane Throughput & Cost Impact
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Laravel Octane delivers 3-10x throughput improvement over PHP-FPM by booting the framework once and keeping it in memory across requests. This directly reduces the number of server instances needed for a given traffic volume, cutting infrastructure costs by 50-70%. Octane with Swoole/RoadRunner/FrankenPHP is the single highest-ROI optimization for compute cost reduction in Laravel.

## Core Concepts
- **Throughput gain**: 3-10x requests per second vs PHP-FPM on identical hardware
- **Instance reduction**: A single Octane server replaces 3-10 PHP-FPM servers
- **Memory persistence**: Framework booted once, not per-request — eliminates 50-100ms bootstrap overhead
- **Concurrent request handling**: Swoole handles thousands of concurrent connections in a single PHP process
- **Cost impact**: Instance count reduction directly reduces EC2/Fargate/Lambda costs by 50-80%
- **Server options**: Swoole (most mature), FrankenPHP (Docker-native), RoadRunner (Go-based)

## When To Use
- Any Laravel production deployment with >100K requests/day
- Applications where compute cost is a significant portion of infrastructure spend
- Workloads with CPU-bound request processing (view rendering, API responses)
- Teams migrating to Laravel Cloud (Octane is default)
- New Laravel projects (Octane should be enabled from the start)

## When NOT To Use
- Very simple apps with <100 requests/day (PHP-FPM is simpler, cost difference negligible)
- Apps with heavy use of packages relying on per-request destructors or global state
- Development environments where hot-reload is not available (some IDEs conflict with long-running workers)
- Apps that cannot be tested thoroughly with Octane (static property leakage risk)
- Shared hosting environments without process management capabilities

## Best Practices
- **Enable Octane by default for all production Laravel deployments** (WHY: 3-10x throughput reduces compute costs 50-70%; the optimization effort is one-time; benefits compound with every request served)
- **Use FrankenPHP for new deployments; Swoole for maximum throughput** (WHY: FrankenPHP is Docker-native and PHP 8.3+ native; Swoole has the most mature ecosystem and highest throughput; RoadRunner offers simplest debugging with Go-based architecture)
- **Set max_requests per worker to prevent memory leaks**: 1,000-5,000 requests recommended (WHY: Octane workers accumulate memory over time; max_requests restarts a worker after N requests, releasing accumulated memory; prevents OOM kills that cause 5-30s downtime)
- **Monitor resident memory growth over 24h**: Track memory increase per worker per request (WHY: gradual memory leak detection; if a worker uses 100MB at start and 200MB after 1000 requests, leak rate = 100KB/request; investigate at >10KB/request)
- **Worker count: CPU-bound → n+1 workers; I/O-bound → 2n to 4n workers** (WHY: CPU-bound workers saturate CPU; extra workers context switch without benefit; I/O-bound workers yield during waits, so more workers can run concurrently without CPU contention)

## Architecture Guidelines
- Use Octane + FrankenPHP for Laravel Cloud deployments
- Use Octane + Swoole for self-managed EC2/Fargate with highest throughput needs
- Use Octane + RoadRunner when debugging simplicity matters more than peak throughput
- Separate Octane workers from queue workers on different servers
- Configure graceful worker restart to release accumulated memory without dropping requests
- Implement Laravel Horizon for queue workers alongside Octane for web serving

## Performance Considerations
- Worker memory: 50-100MB per idle worker, grows under load
- Connection pooling: Database connections reused across requests — reduces RDS connection count by 90%
- Real-world: Filament reported 3x faster requests, 4x smaller replicas after Cloud + Octane migration
- Octane's `tick` and `timer` can replace external cron for periodic tasks
- Actual throughput multiplier depends on app complexity: simple CRUD = 7-10x; complex I/O-heavy = 3-5x

## Security Considerations
- Octane state management: static properties must be stateless to prevent cross-request data leakage
- Singleton services must be request-scoped safe (no user-specific data in shared instances)
- Octane sandbox provides request-scoped state isolation
- Long-running workers mean memory-resident secrets persist longer — rotate credentials more frequently
- Package compatibility audit required before Octane deployment

## Common Mistakes
1. **Not testing with PHP extension compatibility**: Some PECL extensions conflict with Octane workers (Cause: extensions assume per-request lifecycle; Consequence: crashes after N requests; Better: test with `php artisan octane:start` and run 10,000 test requests before production)
2. **Using static properties for request-scoped data**: Data persists across requests in long-lived workers (Cause: PHP-FPM habits where static props reset per-request; Consequence: User A's data visible to User B; Better: use request-scoped containers or Octane's sandbox for per-request state)
3. **Not setting max_requests**: Workers accumulate memory indefinitely without restart (Cause: no memory leak monitoring; Consequence: worker reaches memory limit, gets OOM killed, all in-flight requests fail; Better: set max_requests=2000 and monitor memory usage)
4. **Ignoring package compatibility**: Packages using `__destruct()` for request cleanup break in Octane (Cause: Octane doesn't call destructors at request end; Consequence: resources not released, sessions not flushed; Better: test all critical packages; use `tap()` or explicit cleanup instead of destructors)

## Anti-Patterns
- **PHP-FPM as default**: Using traditional PHP-FPM for new deployments (abandoned 3-10x throughput)
- **No max_requests**: Running workers until OOM kills them
- **Static property abuse**: Storing request-scoped data in static class variables
- **Shared server for web + queues**: Running Octane web workers on the same server as queue workers

## Examples
- **Before**: 10 x t3.medium EC2 (PHP-FPM) handling 5K req/s, $1,200/month
- **After**: 2 x t3.medium EC2 (Octane) handling 5K req/s, $240/month = 80% cost reduction
- **Cloud deployment**: 2 Fargate tasks (Octane + FrankenPHP) at $180/month = 85% reduction from PHP-FPM baseline

## Related Topics
- Graviton Price-Performance (ku-26)
- Filament Forge to Cloud (ku-39)
- Octane Resource Usage (ku-??)
- Predictive Scaling (ku-37)

## AI Agent Notes
- Default: enable Octane for all production Laravel deployments
- Default: set max_requests=2000 for memory leak protection
- Default: use FrankenPHP for new deployments, Swoole for maximum throughput
- Test all critical packages before Octane production deployment
- Monitor resident memory daily; investigate leaks at >10KB/request growth
