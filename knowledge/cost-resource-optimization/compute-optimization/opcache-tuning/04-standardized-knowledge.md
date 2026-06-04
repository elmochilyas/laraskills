# OPcache Tuning

## Metadata
- **ID**: KU-04-OPCACHE-TUNING
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: OPcache Tuning
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
OPcache stores compiled PHP scripts in shared memory, eliminating the need to parse and compile PHP files on every request. For Laravel, which loads hundreds of files per request (framework + vendor + app code), OPcache is the single most impactful performance optimization. Proper tuning reduces CPU usage by 50-70% and enables servers to handle 2-3x more requests with the same compute resources, directly reducing server count and cost.

## Core Concepts
- **opcache.memory_consumption**: Shared memory allocated for compiled scripts (MB)
- **opcache.max_accelerated_files**: Maximum number of PHP files cached
- **opcache.revalidate_freq**: Seconds between checks for file modifications (0 = check every request)
- **opcache.validate_timestamps**: If enabled, OPcache checks file mtime; disabling improves performance
- **opcache.interned_strings_buffer**: Memory for interned strings optimization (shared across requests)
- **opcache.enable_cli**: Whether to enable OPcache for CLI scripts (usually off)
- **opcache.jit**: PHP 8.x Just-In-Time compilation; additional 20-30% CPU improvement for CPU-bound workloads

## When To Use
- Standard OPcache: Always enabled in production for every Laravel deployment
- JIT: CPU-bound Laravel workloads (PDF generation, image processing, complex calculations)
- High memory_consumption: Large Laravel apps with many packages (300+ files)
- validate_timestamps = false: Production deployments where files don't change between deploys
- CLI cache: For long-running queue workers (opcache.enable_cli = 1 for workers)

## When NOT To Use
- OPcache: Should never be disabled in production
- JIT for I/O-bound: Laravel is primarily I/O-bound (database, cache, HTTP); JIT provides minimal benefit
- validate_timestamps = true in production: Checking file mtime on every request wastes CPU; unnecessary when deploys create new files
- OPcache CLI for short-lived commands: `php artisan tinker` or one-off commands don't benefit from cached compilation

## Best Practices
- **Set opcache.memory_consumption to 128MB**: Laravel framework + vendor + app code typically uses 80-120MB (WHY: insufficient memory (64MB) causes OPcache to evict entries, reducing cache hit rate; 128MB covers large Laravel apps with buffer)
- **Set opcache.max_accelerated_files to 10000**: Laravel projects have 2000-8000 PHP files (vendor + app + config) (WHY: default 2000 or 4000 is insufficient; OPcache won't cache files exceeding the limit, causing recompilation on every request)
- **Disable validate_timestamps in production**: Set `opcache.validate_timestamps = 0` (WHY: saving microseconds per file check per request; files only change on deploy; deploy script clears OPcache explicitly via `opcache_reset()`)
- **Enable JIT for CPU-bound tasks**: Set `opcache.jit = tracing`, `opcache.jit_buffer_size = 100M` (WHY: JIT compiles hot functions to machine code; 20-30% improvement for CPU-bound loops, numeric operations, array manipulations)
- **Enable OPcache for CLI workers**: `opcache.enable_cli = 1` in PHP CLI config (WHY: queue workers and Octane boot once and handle many requests; OPcache reduces initial boot overhead and JIT compilation benefit persists)

## Architecture Guidelines
- OPcache memory: 128MB for medium Laravel apps, 256MB for large (1000+ files)
- Deploy script must clear OPcache: Create/update `public/opcache-reset.php` or use `artisan opcache:clear` package
- For Octane: OPcache + JIT configuration is critical (Octane workers never restart; OPcache settings persist for hours/days)
- Monitor OPcache: Check `opcache_status()` for `memory_usage`, `misses`, `hit_rate`
- Set `opcache.revalidate_freq = 0` if validate_timestamps = 1 (immediate file change detection during development)

## Performance Considerations
- OPcache reduces PHP execution time by 50-70% (compilation skipped)
- JIT adds 20-30% gain for CPU-bound code paths
- OPcache memory exhaustion causes entries to be evicted via Least Recently Used (LRU); subsequent requests recompile
- `opcache.max_accelerated_files` exhaustion silently fails with no warning; entries simply not cached
- Hit rate target: >99% (monitor with `opcache_status()`); <95% indicates insufficient memory or file limit

## Security Considerations
- OPcache shared memory is owned by the PHP process user; not directly accessible by others
- JIT buffer contains compiled native code; potential attack surface if attacker controls PHP code execution
- Clear OPcache on deploy to prevent stale compiled code with known vulnerabilities
- Do not enable `opcache.file_cache` (file-based fallback) without securing the cache directory

## Common Mistakes
1. **Default OPcache memory (64MB)**: Not increasing from PHP default (Cause: assumption that defaults are adequate; Consequence: OPcache evictions cause 10-30% miss rate; unnecessary CPU waste; Better: set 128MB minimum)
2. **validate_timestamps enabled in production**: OPcache checking file modification time on every request (Cause: leaving default development settings; Consequence: stat() syscall on every PHP file per request; Better: disable in production, clear OPcache on deploy)
3. **No OPcache reset on deploy**: Updating PHP files without clearing cache (Cause: unaware that OPcache serves compiled code from memory; Consequence: stale code served until cache expires or FPM restarts; Better: add `opcache_reset()` to deploy script)

## Anti-Patterns
- **Disabling OPcache for "debugging"**: Running production without OPcache reduces throughput by 50-70%
- **Insufficient max_accelerated_files**: Limit lower than file count; PHP silently recompiles uncached files
- **JIT on I/O-bound workloads**: Expecting 5x improvement from JIT when app is database-bound (disappointment)

## Examples
- **Standard Laravel app**: memory_consumption=128, max_accelerated_files=10000, validate_timestamps=0, revalidate_freq=0, interned_strings_buffer=16
- **Large Laravel app (1000+ files)**: memory_consumption=256, max_accelerated_files=20000, jit=tracing, jit_buffer_size=100M
- **Octane production**: Same as standard + enable_cli=1 + JIT enabled

## Related Topics
- PHP-FPM Tuning (ku-03)
- Octane Resource Usage (ku-05)
- Performance vs Cost (ku-12)

## AI Agent Notes
- Default: memory_consumption=128, max_accelerated_files=10000, validate_timestamps=0
- Verify PHP version supports JIT (8.0+) before recommending
- Deploy script must clear OPcache

## Verification
- [ ] opcache.memory_consumption >= 128MB
- [ ] opcache.max_accelerated_files >= 10000
- [ ] opcache.validate_timestamps = 0 in production
- [ ] Deploy script includes opcache_reset()
- [ ] OPcache hit rate >99% (verified via opcache_status())
- [ ] JIT enabled for CPU-bound workloads
- [ ] opcache.enable_cli = 1 for queue workers
