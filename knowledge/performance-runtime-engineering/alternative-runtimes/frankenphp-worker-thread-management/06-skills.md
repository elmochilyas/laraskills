# Skill: Configure and Manage FrankenPHP Worker Threads

## Purpose

Set the optimal number of FrankenPHP worker threads, configure per-thread memory limits, and manage thread lifecycle for production workloads.

## When To Use

- Configuring FrankenPHP for production
- Tuning thread count based on workload profile
- Debugging thread-related issues (stuck threads, memory leaks)
- Capacity planning for FrankenPHP

## When NOT To Use

- For development environments (single thread is sufficient)
- Without first profiling the workload (CPU vs I/O bound)
- When the application has thread-unsafe PHP extensions

## Prerequisites

- FrankenPHP installed and running
- Understanding of CPU vs I/O bound workloads
- Profiling data showing request duration and I/O wait

## Inputs

- CPU core count
- Application I/O profile (I/O wait percentage)
- Per-request memory usage (peak)
- Request duration (average, P95, P99)

## Workflow (numbered steps)

1. Determine workload type: I/O-bound (threads > cores) vs CPU-bound (threads <= cores)
2. For I/O-bound: set `frankenphp.num_threads = CPU_cores × 2-4` (threads wait for I/O)
3. For CPU-bound: set `frankenphp.num_threads = CPU_cores` (threads compete for CPU)
4. For mixed: start with `CPU_cores × 2` and adjust based on CPU utilization
5. Set per-thread memory limit: `php.memory_limit = total_memory / num_threads × 0.8`
6. Configure max_execution_time for threads via `php.max_execution_time = 30` (or appropriate value)
7. For Laravel Octane with FrankenPHP: use `php artisan octane:start --server=frankenphp --workers=num_threads`
8. Monitor CPU utilization: if >80%, reduce thread count
9. Monitor 504 errors: if increasing, threads may be overloaded — increase count
10. Document the thread configuration and rationale

## Validation Checklist

- [ ] Workload classified (CPU vs I/O bound)
- [ ] num_threads set based on workload and core count
- [ ] Per-thread memory_limit configured
- [ ] max_execution_time configured
- [ ] CPU utilization <80% at peak
- [ ] No 504 errors from thread exhaustion
- [ ] Octane FrankenPHP workers configured
- [ ] Configuration documented

## Common Failures

- **Setting threads >> cores for CPU-bound workload**: Threads compete for CPU — context switching overhead increases latency
- **Not setting per-thread memory_limit**: A single thread can consume all container memory
- **Assuming more threads = more throughput**: Beyond the optimal point, threads add overhead without benefit
- **Ignoring thread stack size**: Each thread allocates a stack (~2-8MB) — multiplied by num_threads
- **Using thread-unsafe extensions**: Some PHP extensions are not ZTS-safe — test thoroughly

## Decision Points

- CPU-bound (CPU > 50% utilization per request): threads = CPU_cores
- I/O-bound (I/O wait > 50%): threads = CPU_cores × 2-4
- Mixed: start with CPU_cores × 2, adjust based on monitoring
- Memory-constrained: reduce threads, increase per-thread memory_limit
- Octane FrankenPHP: workers = num_threads (maps 1:1)

## Performance Considerations

- Each thread: ~50-200MB PHP heap, 2-8MB stack
- Thread context switch: ~1-5µs (faster than process context switch at ~5-20µs)
- CGO overhead per request: 5-10% (Go ↔ PHP boundary crossing)
- Thread pool: threads are created at startup and reused — no spawn latency
- OpCache sharing: all threads share the same OpCache (saves 128-512MB vs FPM)

## Security Considerations

- Threads share memory — a vulnerability in one thread can affect all threads
- Thread-safe extensions required — non-ZTS extensions may cause crashes
- FrankenPHP runs as a single process — an OOM kill takes down all threads
- Health checks should verify thread health (not just process health)

## Related Rules (from 05-rules.md)

- Match Thread Count to CPU Cores for CPU-Bound Workloads
- Set Per-Thread Memory Limit
- Verify ZTS Compatibility of All Extensions

## Related Skills

- FrankenPHP Architecture Caddy/CGO/SAPI
- FrankenPHP Container Memory Management
- Octane Worker Configuration by Driver

## Success Criteria

- thread count matched to workload and core count
- Per-thread memory_limit configured
- CPU utilization <80% at peak
- No 504 errors from thread exhaustion
- Configuration documented with rationale
