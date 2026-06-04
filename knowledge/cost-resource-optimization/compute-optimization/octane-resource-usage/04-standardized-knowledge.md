# Octane Resource Usage

## Metadata
- **ID**: KU-05-OCTANE-RESOURCE-USAGE
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Octane Resource Usage
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Laravel Octane boots the application once in long-lived worker processes (Swoole or RoadRunner), then handles requests within the same process. This eliminates the per-request boot overhead that PHP-FPM incurs. Octane reduces CPU usage by 30-50% compared to PHP-FPM for the same throughput, enabling fewer servers or lower instance sizes. However, Octane workers consume more memory per process because they persist between requests and hold connections, caches, and state.

## Core Concepts
- **Octane worker**: Long-lived PHP process that handles multiple requests sequentially
- **Memory persistence**: Services, connections, and singletons stay in memory across requests
- **CPU efficiency**: No boot overhead per request (Laravel boot + autoloader + service providers = ~30-80ms saved)
- **Request rate**: Octane handles 3-10x more requests per second than PHP-FPM on same hardware
- **Memory per worker**: ~80-150MB (vs ~30-80MB for PHP-FPM) because persistent connections and cached data
- **Concurrent request limit**: Limited by worker count, not process count (default = workers * 1)

## When To Use
- High-traffic apps: >500 req/s benefit most from Octane's CPU efficiency
- Latency-sensitive apps: <100ms target response time (Octane eliminates boot latency)
- CPU-bound workloads: Octane reduces CPU by eliminating repeated boot overhead
- Cost-sensitive: Same throughput with 30-50% fewer servers = proportional cost reduction
- RoadRunner: When Go binary helps with deployment simplicity (single binary)

## When NOT To Use
- Low-traffic apps: <50 req/s; PHP-FPM savings don't justify Octane complexity
- Memory-constrained environments: Octane workers use 2-3x memory per process
- Apps with global state leaks: Octane amplifies memory leak problems (persistent between requests)
- Development environment: Octane adds complexity; PHP-FPM is simpler for local dev
- Incompatible packages: Some packages assume per-request lifecycle (singletons reset)

## Best Practices
- **Set worker count to CPU cores**: For Swoole, `octane:start --workers=4` for 4-core server (WHY: CPU-bound scaling; more workers than cores causes context switching overhead; I/O-bound apps can exceed cores slightly)
- **Monitor memory growth per worker**: Track over 1 hour; each worker should stabilize at a ceiling (WHY: memory leaks compound across thousands of requests; stabilizing workers indicate clean singleton lifecycle; growth indicates leak)
- **Use `Octane::tick()` for periodic cleanup**: Run garbage collection or cache pruning every N requests (WHY: prevents unbounded memory growth; refreshes connections that may time out)
- **Enable OPcache + JIT for Octane**: Workers boot once; compiled code efficiency matters more (WHY: JIT compiles hot functions; Octane workers handle millions of requests, JIT amortizes perfectly)
- **Run RoadRunner for simpler deployment**: RoadRunner binary simplifies container images (WHY: single Go binary instead of PHP extension; easier multi-stage Docker builds; no Swoole extension dependency)

## Architecture Guidelines
- Add 1-2 extra workers beyond CPU count for I/O-heavy apps (database, cache, API calls)
- Set memory limit per worker: `ini_set('memory_limit', '256M')` or `512M` in Octane config
- Monitor worker restarts: workers restarting frequently indicates memory issues
- Use supervisord or Kubernetes liveness probes to restart stuck workers
- For container/orchestration: Octane + RoadRunner in Docker image (~30MB) vs Swoole (requires extension)

## Performance Considerations
- Octane vs PHP-FPM: 2-5x requests/second on same hardware for typical Laravel app
- Memory: Octane workers 80-150MB vs PHP-FPM 30-80MB (2x baseline)
- 4-core server: 6 Octane workers (~600MB) vs 40 PHP-FPM workers (~2GB); Octane uses less total memory for same throughput
- Swoole vs RoadRunner: ~5-10% performance difference (Swoole slightly faster for CPU-bound)
- Request latency: Octane p50 = 30ms vs PHP-FPM p50 = 80ms for same app (boot time eliminated)

## Security Considerations
- Octane runs as a single PHP process; if compromised, attacker has access to all in-memory data
- Long-lived workers: database connections persist; ensure connection encryption is configured
- Memory inspection: attacker with process access can read other users' data from memory
- `flush()` state: explicitly reset singletons per request to prevent cross-request data leakage
- Use Octane's `Sandbox` and `State` separation for tenant data

## Common Mistakes
1. **Too many workers configured**: Setting workers = 32 on 4-core server (Cause: "more workers = more throughput" assumption; Consequence: extreme context switching, throughput drops; Better: start with workers = CPU cores, benchmark, add max 2x for I/O heavy)
2. **No memory monitoring**: Running Octane without tracking per-worker memory (Cause: assuming PHP-FPM memory patterns apply; Consequence: workers grow to memory_limit, OOM killed, 50x errors; Better: graph worker memory, set restart threshold at 80% of limit)
3. **Global state mutation**: Storing request-specific data in class properties or static variables (Cause: PHP-FPM mindset where each request is a fresh process; Consequence: data leaks across requests; Better: use Octane's state management or reset state per request)

## Anti-Patterns
- **Octane for simple CRUD apps**: Overhead of managing Octane deployment not worth benefit for low-traffic apps
- **No OPcache with Octane**: Multiple workers compiling same code wastes CPU; OPcache eliminates this
- **Singleton abuse**: Storing database results in singletons that are never reset (serves stale data)

## Examples
- **API server (1000 req/s)**: 8-core server, 8 Swoole workers, RoadRunner on port 8000, supervisor managed
- **Memory-optimized**: RoadRunner binary in Docker (30MB image), 6 workers on 4-core, 256MB memory limit each
- **Octane + JIT**: Workers = 8, JIT buffer = 100M, memory_limit = 512M, OPcache memory = 256M

## Related Topics
- RoadRunner Binary (ku-06)
- Worker Pool Sizing (ku-07)
- PHP-FPM Tuning (ku-03)
- OPcache Tuning (ku-04)

## AI Agent Notes
- Default: workers = CPU cores (2x for I/O heavy)
- Octane not recommended for apps under 50 req/s
- Always monitor memory growth; set restart limits

## Verification
- [ ] Octane worker count = CPU cores (or N-1 for management overhead)
- [ ] Memory growth per worker monitored for 24 hours
- [ ] OPcache + JIT enabled for Octane workers
- [ ] Global state reset per request (Sandbox/State pattern)
- [ ] Worker restart configured (memory limit, health checks)
- [ ] Benchmark confirms throughput improvement over PHP-FPM
