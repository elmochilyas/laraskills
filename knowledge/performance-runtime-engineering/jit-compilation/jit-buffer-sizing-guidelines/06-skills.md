# Skill: Size and Monitor the JIT Buffer for a Given Application

## Purpose

Determine the optimal JIT buffer size (opcache.jit_buffer_size) to avoid compilation thrashing while minimizing wasted virtual memory.

## When To Use

- Initial JIT configuration for a PHP 8.0+ deployment
- JIT buffer utilization exceeds 80% and thrashing is suspected
- After adding significant new code (package upgrades, new features) that increases compiled code volume

## When NOT To Use

- When OpCache is not yet configured (configure OpCache first)
- For applications that are entirely I/O-bound with negligible JIT benefit
- Without first monitoring current buffer utilization

## Prerequisites

- JIT enabled and running in production
- Access to `opcache_get_status()` PHP function or monitoring tool
- Understanding of JIT compilation thrashing symptoms (high CPU, low JIT benefit)

## Inputs

- Current jit_buffer_size configuration
- Current buffer utilization from `opcache_get_status()['jit']`
- Application size (PHP file count, code complexity)
- Workload type (CPU-bound, I/O-bound, or mixed)

## Workflow (numbered steps)

1. Check current JIT buffer utilization: `$status = opcache_get_status(false)['jit']; $freePercent = $status['buffer_free'] / $status['buffer_size'] * 100;`
2. If free percent >20%, the current buffer size is adequate — no change needed
3. If free percent <20%, increase jit_buffer_size by 50% (e.g., 128MB -> 192MB) and restart PHP-FPM
4. For initial configuration: start with 128MB for most applications, 256MB for large applications (20K+ files)
5. For containerized environments: 64MB minimum, monitor after deployment
6. After changing buffer size, monitor utilization over 24 hours of production traffic
7. If free percent is consistently >50% after monitoring, consider reducing buffer size to save virtual memory
8. Document the final buffer size and the utilization data that justifies it

## Validation Checklist

- [ ] Current buffer utilization measured and documented
- [ ] Buffer size increased if free <20% (or decreased if free >50%)
- [ ] Buffer utilization re-checked after 24 hours of production traffic
- [ ] No compilation thrashing symptoms (CPU spikes, high JIT compilation count)
- [ ] Buffer sizing rationale documented

## Common Failures

- **Setting and forgetting**: Application code grows over time — buffer that was adequate at launch may become insufficient
- **Massive over-allocation**: Setting 1GB buffer for a small application wastes virtual memory (though not physical until used)
- **Not monitoring after change**: Buffer needs may change with traffic patterns — verify after deployment
- **Confusing buffer size with OpCache memory**: jit_buffer_size is separate from opcache.memory_consumption

## Decision Points

- If free <10%: urgent increase needed — thrashing is actively degrading performance
- If free 10-20%: increase at next maintenance window
- If free 20-50%: adequate, continue monitoring
- If free >50%: consider reducing if virtual memory is constrained (containers, 32-bit systems)

## Performance Considerations

- Each 1MB of JIT buffer holds compiled native code for approximately 100-200 PHP functions
- 128MB is sufficient for most web applications (10-20K functions)
- 256MB+ is recommended for large applications with extensive CPU-bound code
- JIT buffer is committed as virtual memory — on 32-bit systems, 256MB may be significant portion of address space
- Insufficient buffer causes eviction and recompilation, increasing CPU usage by 10-30%

## Security Considerations

- JIT buffer is per-worker and not shared — no cross-worker information disclosure
- Virtual memory address space in 32-bit containers may be limited — monitor for out-of-memory errors
- Container memory limits must account for JIT buffer allocation

## Related Rules (from 05-rules.md)

- Monitor JIT Buffer Utilization — Increase if <20% Free
- Configure OpCache Before JIT
- Pre-warm JIT in Long-Running Processes

## Related Skills

- JIT Configuration for Production
- JIT Memory Layout and Fragmentation
- OpCache Memory Sizing

## Success Criteria

- JIT buffer utilization maintained between 20-80% free
- No compilation thrashing observed (stable CPU, consistent JIT compilation count)
- Buffer size justified by utilization data
- Virtual memory allocation appropriate for the environment
