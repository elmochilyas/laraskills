# K38: Laravel Octane Throughput & Cost Impact

## Metadata
- **ID**: K38
- **Subdomain**: Compute Optimization
- **Topic**: Laravel Octane Throughput
- **Source**: Laravel Documentation, Benchmarks, Dev Community (2025-2026)
- **Reliability**: High

## Executive Summary
Laravel Octane delivers 3-10x throughput improvement over PHP-FPM by booting the framework once and keeping it in memory across requests. This directly reduces the number of server instances needed for a given traffic volume, cutting infrastructure costs by 50-70%. Octane with Swoole/RoadRunner/FrankenPHP is the single highest-ROI optimization for compute cost reduction in Laravel.

## Core Concepts
- **Throughput gain**: 3-10x requests per second vs PHP-FPM on identical hardware
- **Instance reduction**: A single Octane server replaces 3-10 PHP-FPM servers
- **Memory persistence**: Framework booted once, not per-request — eliminates 50-100ms bootstrap overhead
- **Concurrent request handling**: Swoole handles thousands of concurrent connections in a single PHP process
- **Cost impact**: Instance count reduction directly reduces EC2/Fargate/Lambda costs by 50-80%

## Mental Models
- **Octane as turbocharger**: Same engine (Laravel), more power per unit of fuel (compute)
- **Boot once, serve many**: Traditional PHP restarts the engine for every passenger; Octane keeps it running
- **Instance multiplier**: 10x throughput = 1/10th the instances at same traffic

## Internal Mechanics
Octane boots the Laravel application once per worker process. Service providers run once, config is cached, routes are preloaded. Requests are handled by the worker pool without re-booting the framework. Memory is shared across requests but must be managed carefully to avoid leaks. Swoole provides event-driven, async I/O; RoadRunner uses Goroutines; FrankenPHP uses C-level PHP embedding with worker mode.

## Patterns
- **Octane + Fargate**: 5x throughput on same Fargate task sizing; reduces task count by 80%
- **Octane + EC2 Graviton**: Best cost-performance; 3-5x throughput at 20% lower instance cost
- **Octane + FrankenPHP**: Docker-native, PHP 8.3+, recommended path for new deployments
- **Octane + Laravel Cloud**: Native support; Cloud uses Octane by default

## Architectural Decisions
- Enable Octane by default for all production Laravel deployments (2026 recommendation)
- Use FrankenPHP for new deployments; Swoole for highest throughput; RoadRunner for debugging simplicity
- Worker count: CPU-bound apps → n+1 workers; I/O-bound → 2n to 4n workers

## Tradeoffs
- **Throughput increase vs memory management complexity**: Octane requires careful static property handling and memory leak monitoring
- **Stateful concerns**: Singletons must be stateless; request-scoped data must be properly managed
- **Library compatibility**: Some PHP libraries assume per-request lifecycle; test thoroughly
- **Debugging difficulty**: Stack traces across long-running workers are harder to interpret

## Performance Considerations
- Worker memory: 50-100MB per idle worker, growing under load
- Memory leak detection: Monitor resident memory growth over 24h period
- Connection pooling: Database connections reused across requests — reduces RDS connection count by 90%
- Real-world: Filament reported 3x faster requests, 4x smaller replicas after Cloud+Octane migration

## Production Considerations
- Use Octane's `tick` and `timer` for periodic tasks without external cron
- Implement graceful worker restart to release accumulated memory
- Configure `max_requests` per worker to prevent memory leaks (1,000-5,000 recommended)
- Monitor `php artisan octane:status` for worker health
- Use Octane's `Sandbox` for request-scoped state management

## Common Mistakes
- Not testing with PHP-Swoole extension compatibility (some PECL extensions conflict)
- Using static properties for request-scoped data (leads to cross-request data leakage)
- Not setting `max_requests` — workers accumulate memory indefinitely
- Ignoring Octane's incompatibility with packages using `__destruct()` for request cleanup

## Failure Modes
- Memory leak cascade: Unhandled leaks consume all worker memory, causing OOM kills
- State leakage: User A's data visible to User B via static properties or singletons
- Package incompatibility: `__destruct()` methods not called at request end
- Supervisor restart loop if `max_requests` too low and workers restart too frequently

## Ecosystem Usage
- **Laravel Octane + FrankenPHP**: Docker-native, modern, PHP 8.3+
- **Laravel Octane + Swoole**: Most mature, highest throughput
- **Laravel Octane + RoadRunner**: Go-based, simpler debugging
- **Laravel Cloud**: Octane enabled by default with FrankenPHP
- **Laravel Forge**: Octane configurable via UI

## Related Knowledge Units
- K26: Graviton Price-Performance
- K37: Predictive Scaling
- K50: Scheduled Scaling
- K39: Filament Forge to Cloud

## Research Notes
Octane adoption exceeded 40% in Laravel ecosystem by 2026. FrankenPHP emerged as the recommended server for new deployments in 2025-2026 due to its PHP-native architecture. The 3-10x throughput claim is validated by multiple production case studies (Filament, community reports). Actual multiplier depends on application complexity — simple CRUD apps see 7-10x; complex apps with heavy I/O see 3-5x. The cost reduction compound effect (fewer instances × Graviton × Savings Plans) can yield 70-80% total compute savings.
