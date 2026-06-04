# OpCache Memory Consumption — memory_consumption Directive, Memory Sizing by Framework, Monitoring

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Memory Consumption — memory_consumption Directive, Memory Sizing by Framework, Monitoring |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`opcache.memory_consumption` controls the total shared memory pool for cached opcodes. Undersizing causes cache eviction and recompilation (OpCache thrashing), which eliminates the performance benefit. Oversizing wastes RAM that could be used for other processes. The optimal size depends on your application's file count and average compiled file size. For Laravel/Symfony applications, 256–512MB is typical. Monitoring `opcache_get_status()['memory_usage']` provides the data needed to calibrate precisely.

## Core Concepts

- **memory_consumption**: Total shared memory (in MB) for opcode storage. This memory is pre-allocated at PHP-FPM startup and shared across all workers.
- **Per-file compiled size**: A typical PHP file compiles to ~8–15KB of opcodes. Framework files tend to be larger (more classes, functions) than simple scripts.
- **Total memory formula**: `num_files × avg_compiled_size / 0.8` (adding 20% headroom). For Laravel (20K files × 10KB / 0.8 = 256MB).
- **Memory monitoring**: `opcache_get_status(false)['memory_usage']` returns `used_memory`, `free_memory`, `wasted_memory`, `current_wasted_percentage`.
- **cache_full indicator**: When `opcache_get_status()['cache_full']` is true, the cache has been full at some point and eviction has occurred.
- **wasted_memory**: Memory that was used by files that have been evicted (not yet compacted). High wasted memory means the cache is too small.
- **Shared memory persistence**: OpCache memory is never released to the OS until PHP-FPM restart. Over-allocation permanently wastes RAM.

## When To Use

- You are configuring OpCache for a new server or application.
- You are investigating low OpCache hit rates (<99%).
- You have observed `cache_full` or `oom_restarts` in OpCache status.
- You need to determine the right `memory_consumption` for your specific application.
- You are planning capacity for a new deployment.

## When NOT To Use

- Your application is very small (<1000 PHP files) — default 128MB is sufficient.
- You are using PHP-FPM with container auto-scaling — memory is provisioned per container.
- You haven't first confirmed that OpCache is enabled and working — small adjustments matter less than basic enablement.
- You are running in a development environment — hit rate and cache pressure are not production-accurate.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Size for all files + 20% headroom | 20% headroom accommodates temporary files, generated classes, and future growth. Below this, eviction triggers under load. |
| Monitor free memory weekly | Application size grows with features. Check `free_memory` weekly and increase `memory_consumption` if <50MB remains. |
| Set `memory_consumption` higher than calculated for safety | Extra memory costs nothing in performance — only reserved RAM. Better to have 50% free than 5% free. |
| Increase by 50% when cache_full occurs | `cache_full=true` means memory is critically undersized. Increase by 50% (not 10–20%) to provide meaningful headroom. |
| Watch wasted percentage | `current_wasted_percentage > 5%` indicates active eviction and thrashing. Increase memory until waste drops. |
| Differentiate between application types | Laravel/Symfony: 256–512MB. WordPress: 128MB. Magento 2: 512MB+. Custom apps: calculate from file count × 10KB. |

## Architecture Guidelines

- **Memory structure**: The allocated memory holds: hash table (mapping file paths → cached entries), op_array structures (compiled opcodes per function/class), interned strings table, and cache header (locking, statistics).
- **Eviction mechanics**: When new files need caching but memory is full, OpCache marks old entries as "wasted." These entries are removed from the hash table but their memory isn't reused until PHP-FPM restart (compaction). This is why `wasted_memory` grows over time.
- **Memory fragmentation**: The shared memory segment can fragment over time as files of different sizes are added and evicted. Fragmentation increases wasted memory but doesn't affect cache correctness.
- **OOM restart**: When OpCache's memory allocator (`zend_accel_shared_alloc`) cannot satisfy an allocation, it increments `oom_restarts`. This is a restart of the OpCache internal allocator, not a PHP-FPM restart. It causes all cached files to be lost and recompiled.

## Performance Considerations

- 1% hit rate decrease → ~0.5–1% CPU increase from recompilation. At 80% hit rate, CPU usage is ~20–30% higher than at 99%.
- OpCache memory is allocated once and never released. 256MB reserved is 256MB not available for PHP workers or other processes.
- Preloading adds to memory consumption. Preloaded files consume memory from the same pool. Account for preloaded files when sizing.
- JIT uses a separate buffer (`jit_buffer_size`) but requires OpCache memory for compiled opcodes. JIT'd files consume both OpCache and JIT buffer memory.
- `opcache.file_cache` (PHP 8.5+) stores opcodes to disk, supplementing shared memory. Can reduce shared memory requirements at the cost of disk I/O on cold start.

## Security Considerations

- Shared memory segments are readable by other processes on the same host (SysV IPC permissions). On shared hosting, ensure `kernel.shm_*` kernel parameters isolate tenants.
- OpCache memory contains compiled PHP code. In theory, a process with shm access could read opcodes. In practice, opcodes are PHP's internal format — not a meaningful security exposure.
- `memory_consumption` set too high can cause swap if total shared memory plus other processes exceeds RAM. Monitor total shared memory allocation.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting too low for framework apps | 128MB default for Laravel (20K+ files). | Assuming default is sufficient. | cache_full → eviction → 80% hit rate → 50% more CPU used. | Set 256–512MB for Laravel/Symfony. |
| Setting too high for small apps | 512MB for WordPress (3K files). | Overcompensating without calculation. | 480MB RAM permanently reserved and unused. | Calculate from file count: 3K × 10KB / 0.8 ≈ 38MB. Set 64MB. |
| Not monitoring after initial config | Application grows, memory doesn't. | "Set and forget" configuration management. | Hit rate gradually declines over months as more files are added. | Monitor `free_memory` weekly. Increase as the application grows. |
| Ignoring wasted memory | `wasted_memory` grows but is not monitored. | Only checking `used_memory` and `free_memory`. | Fragmentation causes gradual performance decline even with adequate total memory. | Monitor `current_wasted_percentage`. Restart PHP-FPM periodically to compact. |

## Anti-Patterns

- **Setting memory_consumption to max RAM**: OpCache memory is permanently reserved. Setting it to 4GB on a 8GB server starves other processes. Size based on actual need.
- **Frequent PHP-FPM restarts to compact memory**: Restarting PHP-FPM clears OpCache entirely. The performance cost (all files recompiled) outweighs the fragmentation benefit.
- **Copying settings between different applications**: A WordPress memory config is wrong for Magento. Size per-application based on its file count and compiled size.

## Examples

```php
// Calculate recommended memory_consumption
$status = opcache_get_status(false);
$memory = $status['memory_usage'];
$usedMB = round($memory['used_memory'] / 1024 / 1024, 1);
$freeMB = round($memory['free_memory'] / 1024 / 1024, 1);
$wastedMB = round($memory['wasted_memory'] / 1024 / 1024, 1);

echo "Used: {$usedMB}MB / Free: {$freeMB}MB / Wasted: {$wastedMB}MB";
echo "Wasted %: {$memory['current_wasted_percentage']}%";

if ($memory['current_wasted_percentage'] > 5 || $status['cache_full']) {
    echo "Increase memory_consumption by 50%";
}
```

```ini
; Framework-specific memory_consumption examples
; Laravel (20K–30K files)
opcache.memory_consumption=256

; Symfony (25K–40K files)
opcache.memory_consumption=512

; WordPress + plugins (5K–10K files)
opcache.memory_consumption=128

; Magento 2 (50K+ files)
opcache.memory_consumption=512

; Custom app — calculate from file count
; file_count * 10KB / 0.8 = minimum in MB
```

## Related Topics

- OpCache Overview — Purpose and Mechanics
- Interned Strings Buffer — interned_strings_buffer
- Max Accelerated Files Calculation
- OpCache Monitoring and Hit Rate Analysis
- OpCache File Cache Secondary Storage

## AI Agent Notes

- memory_consumption is the most frequently misconfigured OpCache setting. The default 128MB is insufficient for virtually all framework applications.
- The "set and forget" trap is real — configure memory_consumption, then monitor it. Application file counts grow, but memory_consumption stays the same.
- A quick rule of thumb: Laravel → 256MB, Symfony → 512MB, WordPress → 128MB, Magento → 512MB. Monitor and adjust from these baselines.
- Wasted memory is the hidden performance killer. Even with adequate total memory, fragmentation can cause effective memory pressure. Periodic restarts or compaction helps.

## Verification

- [ ] Run `opcache_get_status(false)` and note `used_memory`, `free_memory`, `wasted_memory`.
- [ ] Calculate recommended memory_consumption: total PHP file count × 10KB / 0.8.
- [ ] Verify free_memory > 20% of total. If not, increase by 50%.
- [ ] Check `cache_full` is false.
- [ ] Check `current_wasted_percentage` — should be <5%.
- [ ] Count PHP files: `find . -name '*.php' | wc -l` in your project.
- [ ] Document the memory_consumption value and the calculation used.
