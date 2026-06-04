# Max Accelerated Files Calculation - Hash Table Prime Number Rounding

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | Max Accelerated Files Calculation - Hash Table Prime Number Rounding |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

opcache.max_accelerated_files sets the maximum number of PHP files OpCache can cache. PHP internally rounds this value up to the nearest prime number for hash table efficiency. Setting this below the actual file count means some files are never cached, forcing recompilation on every request. Count your project's PHP files and set this 20-30% higher.

## Core Concepts

- File counting: find /path -name '*.php' | wc -l - count all PHP files including vendor.
- Prime number rounding: Values like 10000, 20000, 40000 are rounded to the nearest prime internally.
- Default value: 10000 (rounded to 10007) - sufficient for small apps but too low for Laravel/Symfony.
- Common values: 20000 for medium apps, 40000 for large apps, 100000+ for monorepos.

## When To Use

- You are configuring OpCache for any PHP application in production.
- You want to ensure all PHP files are cached and avoid recompilation overhead.
- Your application uses a framework with many dependencies (Laravel, Symfony, Magento).

## When NOT To Use

- Your application has very few files (<1000) and the default 10000 suffices.
- You are running in a development environment where OpCache is disabled.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Count all PHP files including vendor | Vendor files are compiled on first access. If not counted, they evict app files. |
| Set to 1.5x your total file count | Provides headroom for future growth and hash table efficiency. |
| Monitor cache_full indicator | If true, max_accelerated_files is too low. Increase by 50% and redeploy. |

## Architecture Guidelines

- Prime number rounding: Values are rounded up to nearest prime: 10000->10007, 20000->20021, 40000->40009.
- Hash table sizing: Too-large values waste memory. Too-small values cause cache_full and eviction.
- Relationship to memory_consumption: Both must be sized together.

## Performance Considerations

- Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation.
- Too small memory_consumption causes eviction of frequently-used files.
- opcache.file_cache reduces cold-start latency by 50-70% in containerized environments.
- Preloading reduces per-request class loading time by 1-3ms.

## Security Considerations

- No direct security implications. Setting this too high only wastes shared memory.
- Ensure OpCache shared memory is not accessible to untrusted processes on multi-tenant systems.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Not counting vendor files | Composer install adds thousands of PHP files. | Large apps see cache_full=true and <80% hit rate. | Always include vendor in file count. |
| Setting max_accelerated_files too low | Default 10000 is too small for modern frameworks. | Files evicted and recompiled, CPU spikes. | Count files, set to 1.5x count. |

## Anti-Patterns

- Setting max_accelerated_files to an arbitrarily high value: Wastes shared memory without benefit.
- Ignoring cache_full after deployment: Monitor and alert on this metric.

## Examples

```bash
# Application guide:
# WordPress: 3000-8000 files -> set 10000
# Laravel: 5000-15000 files -> set 20000
# Laravel + packages: 15000-30000 -> set 40000
# Monorepo: 30000-100000+ -> set 100000
```

## Related Topics

- OpCache Memory Sizing
- OpCache Monitoring and Hit Rate
- Production Hardening Settings

## AI Agent Notes

- Always count project files including vendor. The most common mistake is forgetting vendor.
- Default 10000 is from an era when PHP apps had fewer files. Modern frameworks need 20000-100000.
- When a user reports high CPU, check cache_full before investigating application code.
- Hash table prime rounding means setting 20000 is equivalent to 20021.

## Verification

- [ ] Count total PHP files in your project (including vendor).
- [ ] Set max_accelerated_files to 1.5x that count.
- [ ] Deploy and monitor opcache_get_status()['cache_full'].
- [ ] Verify hit rate >99% after cache warms up.