# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Engine Performance & Version Migration
Knowledge Unit: Benchmarking vs Load Testing — Throughput Capacity vs User-Journey Simulation
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

**Benchmarking** measures maximum throughput capacity under idealized conditions (synthetic load, fixed endpoint). **Load testing** simulates realistic user journeys with think times, variable concurrency, and multiple endpoints. Benchmarking tells you the ceiling; load testing tells you how your system behaves under that ceiling.

---

# Core Concepts

- **Benchmarking**: wrk/wrk2, Apache Bench, Vegeta. Single endpoint. Fixed concurrency. Measures RPS and latency distributions. Used for A/B comparisons (PHP version, framework config, hardware).
- **Load testing**: k6, JMeter, Gatling, Locust. Multi-step user journeys. Variable ramp-up. Measures throughput, error rate, and response times under realistic conditions.
- **Key metrics**: RPS (requests per second), p50/p95/p99 latency, error rate, memory footprint, CPU utilization
- **Coordinated omission**: Closed-loop benchmarks (wrk) underestimate tail latency during saturation. Open-loop models (wrk2, constant-rate) avoid this bias.

---

# Common Mistakes

**Benchmarking with Hello World**: Production applications with database queries, template rendering, and caching layers behave completely differently. Always benchmark with realistic workloads.

---

# Performance Considerations

- PHP 8.4 computed goto dispatch improved throughput by 5-8% in benchmarks; real-world 2-4%
- Typed properties reduce opcode count; public int  uses fewer ops than docblock-typed 
- Function calls require stack frame setup; JIT inlining eliminates this for hot paths
- Per-request heap allocation is fast (~0.1us per allocation) due to slab allocator
- PHP's synchronous I/O blocks entire process; Octane/Swoole use process/coroutine parallelism

---

# Related Knowledge Units

Benchmarking Concepts and Terminology | wrk/wrk2 Usage | k6 Scripting | Coordinated Omission

---

## Mental Models

**Pipeline model**: PHP request processing is an assembly line â€” lexing (raw material), parsing (blueprint), compilation (fabrication), execution (final product). OpCache is a warehouse storing finished parts between runs. JIT adds a custom machine shop that builds specialized tools for repeated operations.

---

## Internal Mechanics

The Zend Engine executor uses zend_execute_data as its call frame structure. Each opcode is a zend_op struct containing opcode number, operands (op1, op2, esult), and handler function pointer. PHP 8.4 introduced computed goto dispatch for ~5-8% execution speedup. The executor loop is a while(1) that fetches, dispatches, and chains opcodes. opcache.jit intercepts at the opcode dispatch level, redirecting hot traces to compiled native code paths.

---

## Patterns

**Bottleneck-first approach**: Profile to find bottleneck. If CPU-bound: optimize loops, enable JIT, cache results. If I/O-bound: reduce query count, add Redis cache, implement async processing. Measure before and after each change.

---

## Architectural Decisions

- **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Shared-nothing (FPM) | Complete isolation, simple debugging | Per-request bootstrap overhead (10-40ms) |
| Memory-resident (Octane) | Sub-10ms request latency | State management complexity, memory leak risk |
| JIT compilation | 10-95% CPU-bound code speedup | 128MB+ memory overhead, compilation pause |
| OpCache | 2-4x throughput over uncached | Stale cache during deployments, memory consumption |

---

## Production Considerations

- **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

---

## Failure Modes

- **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.

---

## Ecosystem Usage

- **Laravel**: The dominant PHP framework runs on PHP-FPM with OpCache. Laravel applications benefit most from OpCache tuning (memory_consumption 512MB, max_accelerated_files 20000). Version requirements: Laravel 11 requires PHP 8.2+.
- **Symfony**: Symfony 7 requires PHP 8.2+. Symfony's performance is heavily dependent on OpCache preloading. The Symfony Docker recipe includes optimized OpCache settings.
- **WordPress**: Runs on minimal PHP configuration. OpCache memory_consumption=128MB sufficient. JIT provides negligible benefit due to I/O-bound nature.
- **Magento**: Requires significant OpCache memory (512MB+). Magento's code generation produces many PHP files, requiring max_accelerated_files=50000+.

---

## Research Notes

- PHP 8.4 introduced computed goto opcode dispatch â€” measured ~5-8% improvement in synthetic benchmarks. Real-world impact in framework-heavy apps is 2-4%.
- PHP 8.5 (upcoming) focuses on JIT improvements and property access optimizations. Early benchmarks show 3-5% improvement over 8.4.
- Long-term research: JIT for async operations, typed arrays for reduced opcode count, and property access type specialization.
