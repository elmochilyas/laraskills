# Standardized Knowledge: Swoole Architecture and Coroutine Model

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Swoole Architecture and Coroutine Model |
| Difficulty | Foundation |
| Lifecycle | Design, Evaluate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Swoole implements a coroutine-based, event-driven architecture within a single PHP process. An event loop backed by epoll/kqueue dispatches I/O events to coroutines. PHP functions are automatically hooked (PDO, MySQLi, Redis, cURL, file operations) to become non-blocking via one-click coroutineization, transparently converting synchronous PHP code into concurrent coroutine-based execution.

## Core Concepts

- **Event Loop**: epoll (Linux) / kqueue (macOS) / iocp (Windows) based. Monitors all file descriptors. When data is ready, the corresponding coroutine is resumed.
- **Coroutine**: Lightweight execution context (~2KB stack). Created per request. Yields on I/O (auto-hooked). Resumes when I/O completes. No OS thread involvement.
- **One-Click Coroutineization**: `Co\run()` or `swoole_async_set(['hook_flags' => SWOOLE_HOOK_ALL])` enables transparent hooking of PHP's synchronous functions.
- **Coroutine Scheduling Overhead**: ~1µs per yield/resume cycle. Under zero-I/O conditions, this overhead makes Swoole ~10% slower than FPM.

## When To Use

- High-latency I/O workloads with database/API calls exceeding 50ms per query
- Applications needing thousands of concurrent connections per worker process
- Real-time features requiring WebSocket, timer ticks, or task workers
- Workloads where per-request bootstrap overhead is the dominant bottleneck

## When NOT To Use

- Low-latency I/O workloads with sub-1ms database queries (Swoole overhead is net-negative)
- Teams lacking PHP extension compilation experience or deployment automation
- Applications using blocking libraries without coroutine-aware alternatives
- Memory-constrained environments where 128MB JIT buffer + extension overhead is prohibitive

## Best Practices

- **Always benchmark with production traffic**: Swoole's performance varies dramatically by I/O profile. Run 24-hour soak tests to detect memory leaks in long-running workers.
- **Set SWOOLE_HOOK_ALL**: Enable all coroutine hooks to maximize non-blocking coverage. Verify library compatibility in staging.
- **Match worker_num to CPU cores**: Set `worker_num = swoole_cpu_num()` for CPU-bound workloads. Increase 1.5-2x for I/O-bound workloads.
- **Configure max_request for recycling**: Set 1000-5000 to prevent memory drift without excessive process spawn overhead.
- **Use task_worker_num for blocking operations**: Isolate database writes, file operations, and external API calls to task workers to avoid blocking the coroutine event loop.

## Architecture Guidelines

- **Coroutine Safety**: All I/O must use coroutine-aware libraries. Blocking I/O in a coroutine blocks ALL coroutines on that thread.
- **Worker Process Model**: Each worker runs an independent event loop with thousands of coroutines. worker_num determines CPU scaling; `swoole_cpu_num()` returns the optimal value.
- **Task Worker Isolation**: Use a separate task worker pool for synchronous operations. Task workers are not coroutine-aware and operate in blocking mode.
- **OpenSwoole Considerations**: The community fork offers ~16% performance edge over original Swoole in some benchmarks. Evaluate both for your workload.

## Performance Considerations

- 1M+ coroutines on 1GB RAM (vs ~10,000 PHP-FPM workers on same hardware)
- Context switch: ~0.5µs coroutine vs ~5µs thread vs ~50µs process
- io_uring (Swoole 6.2+): Reduces syscall overhead for async I/O via submission/completion queue pairs. 2-5x improvement for filesystem-heavy workloads.
- Coroutine overhead is ~1µs per yield point — negligible for high-latency I/O but significant for sub-ms operations.

## Security Considerations

- Swoole runs as a PHP extension with direct memory access. Ensure extension is compiled from trusted sources.
- Coroutine context isolation prevents request data leakage between coroutines within the same worker.
- task_worker operations inherit the worker process security context — sanitize all task inputs.
- WebSocket connections persist beyond request lifecycle — implement proper authentication and rate limiting.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Choosing Swoole for low-I/O workloads | Assuming coroutines always improve throughput | 10%+ performance regression vs FPM | Benchmark with actual workload I/O profile |
| Blocking I/O in coroutines | Using standard PHP functions without coroutine hooks | All coroutines on thread blocked, partial site unresponsive | Use SWOOLE_HOOK_ALL, verify all libraries are coroutine-aware |
| Skipping 24-hour soak tests | Assuming short benchmarks are sufficient | Memory leaks surface after hours in production | Run extended soak tests before production deployment |
| Over-provisioning workers | Setting worker_num > CPU cores x 2 | Context switching overhead degrades performance | Set worker_num = CPU cores for CPU-bound, 1.5-2x for I/O-bound |

## Anti-Patterns

- **Treating Swoole as a drop-in FPM replacement**: Requires architectural changes, library auditing, and deployment process modifications.
- **Using Swoole with pure PHP event loops**: Mixing Swoole's coroutine system with ReactPHP/AMPHP event loops creates scheduling conflicts and undefined behavior.
- **Ignoring deployment complexity**: Swoole's PHP extension requirement complicates container builds, CI/CD pipelines, and rollback procedures.
- **Skipping rollback planning**: Swoole applications cannot be reverted to FPM without code changes. Always maintain a parallel FPM deployment path.

## Examples

```
// Basic Swoole HTTP server with coroutine hooks
$http = new Swoole\Http\Server('0.0.0.0', 9501);
$http->set([
    'worker_num' => swoole_cpu_num(),
    'max_request' => 2000,
    'hook_flags' => SWOOLE_HOOK_ALL,
]);
$http->on('request', function ($request, $response) {
    // PDO queries here are automatically coroutineized
    $response->end('Hello Swoole');
});
$http->start();
```

## Related Topics

- Runtime Comparison Overview
- Swoole Installation and Configuration
- Swoole io_uring Integration
- Laravel Octane Driver Selection

## AI Agent Notes

- Swoole's optimal workload is high-latency I/O (>50ms per query). For sub-1ms queries, RoadRunner or FrankenPHP is preferable.
- Coroutine safety is the most common source of production incidents. All I/O libraries must be verified for coroutine compatibility.
- Swoole 6.2+ io_uring support requires Linux 5.19+ kernel. Check kernel version during deployment validation.
- OpenSwoole is a separate fork with different version numbering and compatibility characteristics.

## Verification

- [ ] Swoole extension installed and loaded (`php -m | grep swoole`)
- [ ] coroutine hooks configured with SWOOLE_HOOK_ALL
- [ ] worker_num set to appropriate value based on CPU cores
- [ ] max_request configured (1000-5000)
- [ ] 24-hour soak test completed without memory growth
- [ ] All blocking I/O libraries verified for coroutine compatibility
- [ ] Rollback plan documented with FPM alternative path
