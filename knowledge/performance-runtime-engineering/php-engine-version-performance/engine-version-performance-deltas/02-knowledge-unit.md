# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Engine Performance & Version Migration
Knowledge Unit: PHP Engine Version Performance Deltas (7.4 through 8.5+)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

PHP 8.x delivers cumulative throughput gains of 48.6% over PHP 7.4 in real-world benchmarks. However, incremental gains between 8.2?8.3?8.4?8.5 are marginal (~1-3% per version) for typical web applications. PHP 8.0 (JIT introduction) and 8.1 (fibers, readonly properties, Enums) were the most impactful releases. PHP 8.5 added property hooks and JIT refinements but no major engine-level throughput boost.

---

# Core Concepts

- **PHP 7.4?8.0**: ~26% throughput gain. JIT compiler, named arguments, match expression, union types, mixed type.
- **PHP 8.0?8.1**: ~10-15% gain. Fibers, readonly properties, Enums, intersection types, array unpacking with string keys.
- **PHP 8.1?8.2**: ~8-10% gain. Readonly classes, standalone types (true, null, false), random extension improvements, opcode optimizations.
- **PHP 8.2?8.3**: ~3-5% gain. Lazy objects (RFC), json_validate(), typed class constants, opcode improvements.
- **PHP 8.3?8.4**: ~3% gain (with noted 5.2% regression under light I/O in some benchmarks). Property hooks (PHP 8.4+), asymmetric visibility, lazy objects stabilization.
- **PHP 8.4?8.5**: Minimal throughput change (~1-2%). Pipe operator, JIT blacklist function, GC improvements for Enums/closures.

---

# Patterns

**Jump multiple versions**: Upgrade from 7.4 directly to 8.2+ rather than stepping through each version. Each upgrade requires a testing cycle; minimize cycles.

---

# Performance Considerations

- The 48.6% cumulative gain from 7.4?8.3 dwarfs OpCache tuning gains (2-4x) and runtime migration gains (3-15x)
- Tideways benchmarks show 8.2?8.5 moves <3% for Laravel, Symfony, WordPress on standard configurations
- Optimization effort is better spent on OpCache tuning and runtime architecture than chasing minor version bumps

---

# Common Mistakes

- Upgrading PHP version without testing: minor versions can contain BC breaks; run test suite first
- Assuming all opcodes are equal: property access, arrays, function calls have different CPU costs
- Not using typed properties: untyped require runtime type checks; typed eliminate this overhead
- Ignoring OpCache for development: enable with validate_timestamps=1 in dev for faster feedback
- Overlooking memory for large apps: Laravel/Symfony need 256-512MB; default 128MB is insufficient

---

# Related Knowledge Units

PHP Version Numbering | JIT Concepts and Terminology | Version Migration Planning

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
