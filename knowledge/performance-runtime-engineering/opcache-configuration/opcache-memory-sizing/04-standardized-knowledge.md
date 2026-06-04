# OpCache Memory Sizing - memory_consumption, interned_strings_buffer

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Memory Sizing - memory_consumption, interned_strings_buffer |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

opcache.memory_consumption controls shared memory for cached opcodes. opcache.interned_strings_buffer controls memory for deduplicated strings shared across all requests. Undersizing causes cache eviction and recompilation (OpCache thrashing). For Laravel/Symfony: 256MB memory, 32-64MB interned strings. For WordPress: 128MB memory, 16MB interned strings.

## Core Concepts

- memory_consumption: Total shared memory pool for opcodes. Formula: num_files * avg_opcode_size + 20% headroom. A typical Laravel file is ~8-15KB compiled.
- interned_strings_buffer: Memory for deduplicated strings. Strings used across multiple files stored once. Larger for framework apps with many class/method names.
- Memory monitoring: opcache_get_status()['memory_usage'] shows used/free/wasted memory. cache_full indicator shows eviction.
- Shared memory consumption: Pre-allocated, never released until PHP-FPM restart.

## When To Use

- Configuring OpCache for any production PHP application.
- Sizing matters proportionally to application size.

## When NOT To Use

- Development environments where OpCache may be disabled.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Start at 256MB for Laravel/Symfony | 20,000 files x 10KB = 200MB + 20% headroom = 256MB. |
| Monitor memory_usage.free_memory | If approaching zero, increase memory_consumption by 50%. |
| Set interned_strings_buffer to 32MB for framework apps | Framework class/method name deduplication needs 8-16 entries per class. |

## Architecture Guidelines

- Memory layout: opcache_memory header, hash table, op_array structures, interned strings table.
- Two-phase eviction: mark as wasted, compact on restart.
- opcache_huge_pages: maps shared memory via 2MB huge pages for reduced TLB pressure.

## Performance Considerations

- Every 1% decrease in hit rate increases CPU usage ~0.5-1%.
- file_cache reduces cold-start latency by 50-70% in containers.
- Preloading reduces class loading time by 1-3ms per request.
- JIT requires adequate OpCache memory.

## Security Considerations

- Shared memory must not be accessible to untrusted processes.
- No direct security impact from memory sizing.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Setting memory_consumption too low (128MB for large apps) | Files evicted and recompiled. cache_full incremented. | CPU spikes, hit rate drops below 90%. | Monitor and set to 256MB+ for framework apps. |

## Anti-Patterns

- Setting memory_consumption to the maximum available RAM: Wastes memory. Size appropriately.
- Never monitoring OpCache memory usage: Silent performance degradation.

## Examples

```ini
# Laravel/Symfony production
opcache.memory_consumption=512
opcache.interned_strings_buffer=64

# WordPress production
opcache.memory_consumption=128
opcache.interned_strings_buffer=16
```

## Related Topics

- Max Accelerated Files Calculation
- OpCache Monitoring and Hit Rate
- Production Hardening Settings

## AI Agent Notes

- Three-tier sizing: small (<100MB), medium (256MB), large (512MB+).
- Always monitor. The cache_full indicator reveals under-provisioning.
- Resource model: OpCache is a library shelf. Too little shelf space means books (opcodes) get discarded.
- For Magento 2: 512MB+ memory, 50000+ max files.

## Verification

- [ ] Calculate memory_consumption = file_count * avg_compiled_size / 0.8.
- [ ] Set initial value (256MB for Laravel/Symfony, 128MB for WordPress).
- [ ] Deploy and monitor opcache_get_status()['memory_usage'].
- [ ] Verify free_memory is >20% of total after cache warmup.
- [ ] Alert if cache_full=true or hit rate <99%.