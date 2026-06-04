# Metadata

Domain: Performance & Runtime Engineering
Subdomain: OpCache Configuration & Preloading
Knowledge Unit: OpCache Hit Rate Inversely Correlates with CPU Load
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

When OpCache hit rate drops, every miss triggers file compilation — a CPU-intensive operation. Lower hit rates directly increase CPU load as the Zend Engine recompiles uncached files on every request. This creates a **performance death spiral**: as traffic increases, more cache misses occur (if under-provisioned), increasing CPU load, which slows request processing, causing queue buildup.

---

# Core Concepts

- **Each miss costs**: 5-15ms of CPU time for lexing, parsing, and compiling a PHP file. With 200 files per request, one miss = 1-3 seconds of compilation.
- **Hit rate ? CPU correlation**: 95% hit rate with 500 req/s and 200 files/request = 5,000 compilations per second ? ~25-75 seconds of CPU time per second ? server saturated.
- **Cache sizing prevents this**: Proper `memory_consumption` and `max_accelerated_files` ensure >99% hit rate, eliminating compilation as a CPU consumer.

---

# Patterns

**OpCache thrashing**: When max_accelerated_files or memory_consumption is too low, OpCache constantly evicts and recompiles files. CPU spikes, request latency increases, and the FPM listen queue grows.

---

# Common Mistakes

**Diagnosing CPU spikes without checking OpCache**: First check `opcache_get_status()['cache_full']` and hit rate before investigating application code. An under-provisioned cache mimics a CPU-bound bottleneck.

---

# Performance Considerations

- Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation
- Too small memory_consumption causes eviction of frequently-used files; monitor cache_full indicator
- opcache.file_cache reduces cold-start latency by 50-70% in containerized environments
- Preloading reduces per-request class loading time by 1-3ms for preloaded classes
- JIT requires adequate OpCache memory; eviction forces recompilation of JIT-compiled files

---

# Related Knowledge Units

OpCache Monitoring and Hit Rate | OpCache Memory Sizing | Max Accelerated Files Calculation

---

## Mental Models

**Library model**: Without OpCache, every visitor to the library must rewrite every book from scratch. OpCache is the librarian who keeps all books pre-written on shelves. Memory sizing is shelf space â€” too little and books get discarded.

---

## Internal Mechanics

OpCache stores compiled opcodes in System V shared memory segments accessible by all PHP-FPM workers. The memory layout includes: opcache_memory header (locking, statistics), hash table mapping file paths to cached entries, op_array structures (compiled opcodes per function/class), and interned strings table. Cache entries are lazily populated on first file access. Eviction uses a two-phase approach: mark entries as wasted when their memory is needed, then compact on restart. The opcache_huge_pages setting maps shared memory via 2MB huge pages for reduced TLB pressure.

---

## Patterns

**Tiered cache warming**: 1) Preload core framework classes, 2) First user request triggers OpCache population for remaining files, 3) Run a warmup script hitting all critical endpoints after deployment, 4) Monitor hit rate. If below 99%, increase memory or file limits.

---

## Architectural Decisions

- **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| validate_timestamps=0 | Zero stat() calls, max CPU throughput | Manual cache reset on every deploy |
| Preloading | Zero cold-start for framework files | 500ms-5s longer startup, preload memory |
| Large memory_consumption | Caches all files, no eviction | 512MB+ shared memory reservation |
| High max_accelerated_files | All files cached | Larger hash table, slightly slower lookups |

---

## Production Considerations

- **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code â†’ opcache_reset() â†’ cache warm â†’ health check (hit rate > 99%).
- **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

---

## Failure Modes

- **Cache full â€” no restart**: cache_full=true but wasted memory below max_wasted_percentage. Symptom: hit rate drops below 90%. Files recompile on every request. Mitigation: Increase memory_consumption or max_wasted_percentage.
- **OOM restart**: Memory allocation fails. Symptom: oom_restarts counter increments. Mitigation: Increase memory_consumption. Root cause: memory_consumption set too low for application size.
- **Hash collision thrashing**: max_accelerated_files too low. Symptom: hash_restarts counter increments. Files evicted and recompiled frequently. Mitigation: Increase max_accelerated_files to 1.5x total PHP file count.
- **Stale preloading**: Preloaded classes from old deployment survive opcache_reset(). Symptom: Mixed old/new class definitions. Mitigation: Always restart PHP-FPM when preloading script changes.

---

## Ecosystem Usage

- **Laravel**: Default OpCache settings insufficient (128MB memory, 10000 files). Recommended: memory_consumption=512, max_accelerated_files=20000. Laravel Forge includes OpCache optimization recipes.
- **Symfony**: Symfony Recipes include optimized OpCache configuration. Preloading is strongly recommended for Symfony.
- **WordPress**: Smaller OpCache needs (128MB, 5000 files). WP Rocket and other caching plugins handle the page-level cache. OpCache handles the PHP layer only.
- **Magento 2**: Largest OpCache requirements. Magento generates hundreds of factory and interceptor classes. Recommended: memory_consumption=512+, max_accelerated_files=50000+.

---

## Research Notes

- PHP 8.5 makes OpCache an integral part of PHP (always installed, not always enabled). This simplifies deployment and configuration.
- Research on shared memory fragmentation in long-running OpCache instances suggests that periodic restarts (every 24-48 hours) may improve hit rate by 0.5-1% in large deployments.
- File cache in containers: Experimental research shows combining opcache.file_cache with opcache.file_cache_only=1 in immutable container images eliminates shared memory overhead entirely.
