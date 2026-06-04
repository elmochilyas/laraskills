# OpCache Max Accelerated Files — max_accelerated_files, Hash Table Prime Numbers, File Counting

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Max Accelerated Files — max_accelerated_files, Hash Table Prime Numbers, File Counting |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`opcache.max_accelerated_files` controls the maximum number of PHP files that OpCache can cache simultaneously. The hash table used to look up cached files is sized based on this value — OpCache rounds it to the nearest prime number. Undersizing causes hash collisions and cache churn (files evicted and recompiled frequently). Oversizing wastes memory and slightly slows down hash lookups. The correct value is based on your application's total PHP file count plus headroom for growth.

## Core Concepts

- **max_accelerated_files**: Maximum number of unique file entries in the OpCache hash table. Default: 10,000. Range: 200–1,000,000.
- **Hash table sizing**: OpCache rounds `max_accelerated_files` to the nearest prime number for optimal hash distribution. Prime sizes reduce hash collisions.
- **Known prime sizes**: 200, 400, 600, 800, 1000, 2000, ..., 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000.
- **Hash collision**: When two file paths hash to the same bucket. More collisions = slower lookups. A prime-numbered hash table size minimizes collisions.
- **hash_restarts**: Counter in `opcache_get_status()` that increments when hash table-related memory allocation fails. Indicates `max_accelerated_files` is set too low.
- **File count calculation**: Count all PHP files your application loads, including vendor/, packages/, config/, and generated files (cached routes, compiled views, Doctrine proxies).
- **Headroom**: Set `max_accelerated_files` to 1.5–2× your total file count to accommodate growth and temporary files.

## When To Use

- You are configuring OpCache for any production application — always tune this parameter.
- You notice `hash_restarts` incrementing in OpCache status.
- Your application has many PHP files (>10,000).
- You are analyzing low hit rates and want to rule out hash-table churn.
- You are adding new packages or features that increase file count.

## When NOT To Use

- Your application is very small (<5000 files) — default 10,000 likely sufficient.
- You haven't counted your PHP files — tune based on data.
- You use PHP-FPM in a development environment — file counts differ from production.
- You have already set a very high value (100,000+) and have no hash issues.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Count total PHP files: `find . -name '*.php' | wc -l` | Accurate counting is the only way to set the right value. Include vendor/, generated files, all packages. |
| Set `max_accelerated_files` to 1.5× total file count | Provides headroom for temporary files, generated classes, and future package additions. |
| Round up to the nearest known prime | Prime sizing reduces hash collisions. OpCache automatically rounds, but knowing the primes helps you set effective values. |
| Monitor `hash_restarts` counter | `hash_restarts > 0` means `max_accelerated_files` is too low. Files are being evicted due to hash table limitations. |
| Set higher for Magento/Shopware/Drupal | These applications generate many files (cache classes, factory classes, interceptors). Count may be 50,000–200,000+ files. |
| Re-evaluate after major dependency updates | `composer update` can add thousands of files. Re-count and adjust `max_accelerated_files`. |

## Architecture Guidelines

- **Hash table mechanics**: OpCache maps each cached file to a hash table bucket. The bucket index is: `hash(file_path) % max_accelerated_files` (using the nearest prime). When two files map to the same bucket, a collision chain forms.
- **Collision chain impact**: Long collision chains slow down cache lookups. At the default 10,000 entries with 20,000 files, collisions are common. At 40,000 entries for 20,000 files (double size), collisions are rare.
- **Cache eviction with hash full**: When the hash table is full (file count exceeds `max_accelerated_files`), OpCache must evict existing entries to make room. This causes recompilation when those files are accessed again.
- **Prime number rounding**: If you set `max_accelerated_files=20000`, OpCache rounds to the nearest prime (likely 20021 or similar). The hash table is sized at the prime number, not 20000.
- **Speed vs size tradeoff**: Larger hash tables have fewer collisions but use more memory and have slightly slower hash computation. The difference is negligible — prioritize avoiding eviction over hash table speed.

## Performance Considerations

- Hash table lookup: O(1) average, O(n) worst-case for collision chains. At 2× file count, collisions are rare.
- Cache eviction cost: An evicted file must be recompiled on next access. Recompilation takes 5–50ms per file depending on size.
- Hash table memory: Each entry adds ~100 bytes (hash, file path pointer, op_array pointer). 40,000 entries = ~4MB. Negligible compared to the opcode storage itself.
- `hash_restarts` impact: Each restart clears some file entries. The affected files are recompiled, adding CPU load and latency for those requests.
- Prime rounding precision: Setting values that are already close to a prime (e.g., 20000 → 20021) is fine. Setting values that round to a much larger prime wastes a few entries but doesn't harm performance.

## Security Considerations

- Hash collision attacks: In theory, an attacker could craft file paths that produce hash collisions, slowing down OpCache lookups. PHP uses randomized hash seeding (added in PHP 5.4) to prevent this.
- No direct security exposure: `max_accelerated_files` configuration does not affect security boundaries.
- Deployment safety: After adding many files in a deployment, ensure `max_accelerated_files` is sufficient. Files exceeding the limit won't be cached, increasing CPU usage.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting `max_accelerated_files` based on guesswork | Setting 10000 "because it's the default." | Not counting actual files. | Undersized for framework apps with 20K+ files. | Count files and set 1.5× the count. |
| Setting it very high (100000) "to be safe" | No harm in oversizing, but wastes the (negligible) hash table memory. | Not understanding that oversizing is harmless. | 100K entries → ~10MB hash table. Negligible. | Set high if you want safety — no performance penalty for big values. |
| Not counting generated files | Routes cache, compiled views, Doctrine proxies, cached config. | Only counting source files. | Underestimate of total files by 20–40%. | Count all PHP files, including cache/ and storage/ directories. |
| Forgetting to update after package additions | Installing 5 Composer packages adds thousands of files. | One-time configuration without review cycle. | File count grows past limit over time; hash_restarts increase. | Re-count quarterly or after major dependency updates. |
| Setting a non-prime value that rounds down | Setting 19999 rounds to a much smaller prime. | Not knowing about prime rounding. | Effective limit is lower than expected. | Use known prime values for predictable results. |

## Anti-Patterns

- **Setting max_accelerated_files below total file count**: At best, some files are never cached. At worst, frequently-used files are evicted and recompiled. Always set ≥ total file count.
- **Zero or very low values**: Values below 200 cause extreme cache churn. Minimum recommended: 10000.
- **Copying values from other applications**: A WordPress max_accelerated_files (5000) is wrong for Magento (100000+). Size per-application.

## Examples

```bash
# Count all PHP files in a Laravel project
find . -name '*.php' -not -path './vendor/*' | wc -l   # App files: ~200–500
find vendor -name '*.php' | wc -l                      # Vendor files: ~15K–25K
find bootstrap/cache -name '*.php' | wc -l             # Generated files: ~50–200

# Total for Laravel: ~16K–26K files
# Recommended max_accelerated_files: 25000–40000 (1.5×)
```

```ini
; max_accelerated_files by application size
; Small app (<5000 files)
opcache.max_accelerated_files=10000

; Medium app (5000–15000 files) — typical WordPress
opcache.max_accelerated_files=20000

; Large app (15000–40000 files) — typical Laravel/Symfony
opcache.max_accelerated_files=40000

; Very large app (40000+ files) — Magento, Shopware
opcache.max_accelerated_files=100000
```

## Related Topics

- OpCache Memory Consumption
- OpCache Monitoring and Hit Rate Analysis
- OpCache Revalidation Frequency
- OpCache File Cache Secondary Storage

## AI Agent Notes

- max_accelerated_files is the second most important OpCache tuning parameter after memory_consumption. Both must be sized together.
- The "nearest prime number" rounding means you should use well-known primes for predictable results. 10000, 20000, 40000, 100000, 200000 are common choices.
- Hash_restarts > 0 is the clearest signal that max_accelerated_files is too low. If you see this, increase immediately.
- Most developers underestimate their file count by not counting generated files (compiled routes, cached config, Doctrine proxies). Always count everything.

## Verification

- [ ] Count all PHP files: `find . -name '*.php' | wc -l`.
- [ ] Verify `max_accelerated_files` ≥ 1.5× total file count.
- [ ] Check `opcache_get_status()['opcache_statistics']['hash_restarts']` — should be 0.
- [ ] Check `opcache_get_status()['opcache_statistics']['max_accelerated_files']` — shows the rounded value.
- [ ] Document the file count and chosen max_accelerated_files value.
- [ ] Schedule quarterly file count reviews.
