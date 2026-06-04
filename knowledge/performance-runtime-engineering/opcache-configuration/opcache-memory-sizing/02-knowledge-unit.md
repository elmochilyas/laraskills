# Metadata

Domain: Performance & Runtime Engineering
Subdomain: OpCache Configuration & Preloading
Knowledge Unit: OpCache Memory Sizing — memory_consumption, interned_strings_buffer
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`opcache.memory_consumption` controls the total shared memory for cached opcodes. `opcache.interned_strings_buffer` controls memory for deduplicated strings shared across all requests. Undersizing causes cache eviction and recompilation (OpCache thrashing). Sizing guidelines: 128MB for small apps, 256MB for medium (Laravel/Symfony), 512MB+ for large applications. Interned strings: 16MB-64MB depending on application string diversity.

---

# Core Concepts

- **memory_consumption**: Total shared memory pool for opcodes. Shared by all PHP-FPM workers. Formula: `num_files * avg_opcode_size` + 20% headroom. A typical Laravel file is ~8-15KB compiled.
- **interned_strings_buffer**: Memory for interned (deduplicated) strings. Strings used across multiple files are stored once. Larger for framework applications with many class names, method names, and constant strings.
- **Memory monitoring**: `opcache_get_status()['memory_usage']` shows used/free/wasted memory. `cache_full` indicator shows whether eviction has occurred.
- **Shared memory consumption**: OpCache memory is pre-allocated and never released until PHP-FPM restart. Over-allocation wastes RAM; under-allocation causes thrashing.

---

# Formulas

- **memory_consumption = `file_count * avg_compiled_size / 0.8`** (assuming 20% headroom)
- **Laravel baseline**: 20,000 files × 10KB = 200MB + 20% = 256MB
- **WordPress baseline**: 3,000 files × 8KB = 24MB + 20% = 32MB (but 128MB recommended for plugins)

---

# Common Mistakes

**Setting memory_consumption too low (128MB for large apps)**: When cache fills, PHP evicts old entries and recompiles. The `cache_full` counter increments. Monitor it.

---

# Performance Considerations

- Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation
- Too small memory_consumption causes eviction of frequently-used files; monitor cache_full indicator
- opcache.file_cache reduces cold-start latency by 50-70% in containerized environments
- Preloading reduces per-request class loading time by 1-3ms for preloaded classes
- JIT requires adequate OpCache memory; eviction forces recompilation of JIT-compiled files

---

# Related Knowledge Units

Max Accelerated Files Calculation | OpCache Monitoring and Hit Rate | Production Hardening Settings

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
