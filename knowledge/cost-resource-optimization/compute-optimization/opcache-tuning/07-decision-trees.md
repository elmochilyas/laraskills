# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** OPcache Tuning
**Generated:** 2026-06-03

---

# Decision Inventory

1. OPcache Memory Allocation Sizing
2. validate_timestamps in Production
3. JIT Compilation Decision

---

# Architecture-Level Decision Trees

---

## Decision Name: OPcache Memory Allocation Sizing

---

## Decision Context

Determine opcache.memory_consumption for Laravel application codebase size.

---

## Decision Criteria

performance

---

## Decision Tree

Application PHP file count?

< 2000 files -> 64MB may suffice, use 128MB safe default
2000-5000 files -> 128MB (standard Laravel + vendor)
> 5000 files -> 256MB (large apps with many packages)

Current OPcache hit rate?
< 95% -> Increase memory (evictions occurring)
95-99% -> Current allocation adequate
> 99% -> No change needed

Verified via opcache_status()?
YES -> Adjust based on memory_usage metrics
NO -> Run opcache_get_status() to check hit rate

---

## Rationale

Insufficient OPcache memory causes entry eviction via LRU, forcing PHP recompilation on subsequent requests. 128MB covers most Laravel applications.

---

## Recommended Default

**Default:** 128MB for standard Laravel; 256MB for large applications; verify hit rate >99%

---

## Risks Of Wrong Choice

Insufficient memory causes 10-30% miss rate, wasting 50-70% CPU on recompilation.

---

## Related Rules

Rule: Follow standardized OPcache Tuning practices

---

## Related Skills

Analyze and Optimize OPcache Tuning

---

---

## Decision Name: validate_timestamps in Production

---

## Decision Context

Decide whether to disable OPcache file modification checking for production performance.

---

## Decision Criteria

performance, security

---

## Decision Tree

Production environment?

YES -> Disable validate_timestamps (opcache.validate_timestamps=0)
NO (development) -> Keep enabled for code changes to reflect

Deployment strategy?
Atomic deploys (new files) -> validate_timestamps=0 safe
In-place updates -> Needs explicit cache clear

Cache clear mechanism?
Deploy script includes opcache_reset() -> Safe to disable
No cache clear -> Keep enabled or add cache clear

---

## Rationale

validate_timestamps causes stat() syscall on every PHP file every request. Disabling saves microseconds per file; across hundreds of Laravel files, this translates to 50-70% CPU reduction.

---

## Recommended Default

**Default:** validate_timestamps=0 in production with deploy-time opcache_reset()

---

## Risks Of Wrong Choice

Enabling in production wastes CPU on stat() calls. Disabling without deploy cache clear serves stale code.

---

## Related Rules

Rule: Follow standardized OPcache Tuning practices

---

## Related Skills

Analyze and Optimize OPcache Tuning

---

---

## Decision Name: JIT Compilation Decision

---

## Decision Context

Determine whether to enable PHP JIT compilation based on workload type.

---

## Decision Criteria

performance

---

## Decision Tree

Workload type?

CPU-bound (image, PDF, calculations) -> Enable JIT (20-30% CPU improvement)
I/O-bound (database, cache, HTTP) -> Minimal benefit
Mixed -> Enable if CPU-bound paths are significant

PHP version?
PHP 8.0+ -> JIT available
PHP < 8.0 -> Upgrade PHP first

Runtime?
Octane (long-lived workers) -> JIT beneficial (amortized across millions of requests)
PHP-FPM (per-request) -> JIT less impactful

---

## Rationale

JIT compiles hot PHP functions to native machine code. For CPU-bound workloads, this provides 20-30% improvement. I/O-bound apps spend most time waiting on database/cache.

---

## Recommended Default

**Default:** Enable JIT (mode=tracing, buffer=100M) for Octane CPU-bound tasks; skip for I/O-heavy PHP-FPM

---

## Risks Of Wrong Choice

Enabling JIT for purely I/O-bound apps adds complexity and memory overhead without meaningful improvement.

---

## Related Rules

Rule: Follow standardized OPcache Tuning practices

---

## Related Skills

Analyze and Optimize OPcache Tuning

---

