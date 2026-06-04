# Skill: Determine Whether Synchronous or Asynchronous I/O Fits a Workload

## Purpose

Analyze the application's I/O profile and decide whether synchronous (PHP-FPM) or asynchronous (Swoole, ReactPHP) I/O model provides the best throughput and resource utilization.

## When To Use

- Evaluating whether to adopt an asynchronous runtime (Swoole, ReactPHP, AMPHP)
- Profiling shows significant I/O wait time in request processing
- Designing a new application with high I/O requirements

## When NOT To Use

- When I/O wait time is <20% of request time (benefit from async I/O is minimal)
- For CPU-bound workloads where I/O is not the bottleneck
- When the team has no experience with async programming patterns

## Prerequisites

- Profiling data showing I/O wait vs CPU execution breakdown
- Understanding of PHP-FPM's synchronous blocking I/O model
- Knowledge of the application's external dependencies (database, cache, APIs)

## Inputs

- Average database query latency and count per request
- External API call frequency and average response time
- Redis/memcached operation latency
- File I/O operations per request

## Workflow (numbered steps)

1. Profile a representative request to measure total I/O wait time vs PHP execution time
2. Break down I/O wait by dependency: database, Redis, external APIs, file system
3. If total I/O wait <20% of wall time, synchronous I/O (PHP-FPM) is sufficient — no need for async runtime
4. If I/O wait >20%, identify the specific I/O operations that consume the most wait time
5. For database-heavy workloads with queries >50ms: asynchronous coroutines (Swoole) provide the highest benefit
6. For mixed I/O with moderate latency: RoadRunner's concurrent worker model handles parallel I/O efficiently
7. For pure PHP async without extensions: ReactPHP or AMPHP (fiber-based) for CLI/streaming workloads
8. Benchmark the candidate async model against the current synchronous baseline
9. If async runtime provides <15% throughput improvement, stay with synchronous — added complexity not justified
10. Document the decision with I/O profile data and benchmark results

## Validation Checklist

- [ ] I/O wait time measured as percentage of wall time
- [ ] I/O wait broken down by dependency type
- [ ] If I/O wait >20%, async runtime evaluated
- [ ] Candidate async runtime benchmarked against synchronous baseline
- [ ] Decision documented with data
- [ ] Team trained on async programming patterns if migrating

## Common Failures

- **Assuming async I/O always improves throughput**: For sub-1ms I/O operations, async overhead (coroutine switches, event loop) can make performance worse
- **Choosing async without profiling I/O proportion**: If I/O is <20% of wall time, async provides minimal benefit
- **Ignoring blocking I/O in async runtimes**: Using synchronous file_get_contents() in Swoole blocks the entire event loop
- **Not handling backpressure**: Async runtimes can accept requests faster than I/O can complete, leading to connection pool exhaustion

## Decision Points

- If average I/O wait per request <20%: stay synchronous, focus on other optimizations
- If I/O wait 20-50%: async runtime provides moderate benefit (15-40% throughput gain)
- If I/O wait >50%: async runtime provides significant benefit (2-5x throughput gain)
- If database queries average >50ms: Swoole's coroutine auto-hooking provides the most benefit with least refactoring

## Performance Considerations

- PHP-FPM synchronous I/O blocks the entire worker process — each I/O wait reduces available workers
- Swoole coroutines yield during I/O wait, freeing the thread for other coroutines — 1µs overhead per yield point
- RoadRunner spawns multiple PHP workers per goroutine — handles I/O wait by processing other requests in parallel
- FrankenPHP threads handle I/O wait by context-switching to another thread

## Security Considerations

- Asynchronous runtimes share memory between requests — state leaks are a security concern
- Swoole's C extension must be compiled from trusted sources
- RoadRunner's process isolation provides stronger security boundaries than Swoole or FrankenPHP
- All async runtimes require regular updates for security patches

## Related Rules (from 05-rules.md)

- Match Runtime to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Concurrency Model Selection
- Runtime Comparison Overview
- Swoole Architecture and Coroutine Model

## Success Criteria

- I/O profile accurately measured and documented
- Async vs sync decision justified by data
- If migrating to async: 24-hour soak test passed
- If staying synchronous: I/O wait time confirmed <20% of wall time
- Throughput improvement from async migration (if applicable) meets projections
