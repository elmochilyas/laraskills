# Metadata

Domain: Performance & Runtime Engineering
Subdomain: OpCache Configuration & Preloading
Knowledge Unit: Inheritance Cache Deep Dive — Class Hierarchy Pre-Resolution, Method Table Caching
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PHP 8.1 introduced the **inheritance cache**, an OpCache feature that pre-resolves class hierarchy relationships (parent classes, interfaces, traits) at compile time rather than at class-load time. This eliminates the runtime cost of resolving inheritance chains during autoloading — saving 2-5ms per request in framework-heavy applications by caching method tables and constant inheritance lookups.

---

# Core Concepts

- **Inheritance resolution cost**: Without inheritance cache, each class load requires walking the parent chain to build the method table (including inherited, overridden, and abstract methods). For deep hierarchies (Laravel's 5-7 level deep class trees), this costs 1-3ms per class.
- **Inheritance cache mechanism**: When `opcache.inheritance_cache` is enabled (default in PHP 8.1+), OpCache pre-computes the method table during compilation and stores it alongside the opcodes. Class loading becomes: allocate zend_class_entry ? copy pre-computed method table from cache.
- **Enabled by default**: Opcache.inheritance_cache=1 in PHP 8.1+. No configuration needed. Just ensure OpCache is enabled.

---

# Performance Considerations

- Reduces class-loading time by 40-60% for framework classes
- Most impactful for applications with deep inheritance hierarchies (Laravel Eloquent models, Symfony bundles)
- Benefit scales with number of classes — negligible for small apps, significant for 1000+ class codebases
- Works transparently with preloading — preloaded classes also benefit

---

# Common Mistakes

- Setting memory_consumption too small: frequent eviction negates OpCache benefit; monitor cache_full
- Not configuring max_accelerated_files: default is often too small; set to count of PHP files + 20%
- Ignoring validate_timestamps=1 in production: file stat overhead on every request; set to 0
- Not using opcache.file_cache in containers: each container cold-start recompiles all files
- Mixing opcache.preload with incompatible packages: preloading incompatible classes causes errors

---

# Related Knowledge Units

Preloading Script Design Patterns | OpCache Optimization Level Bitmask | OpCache Purpose and Mechanics

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
