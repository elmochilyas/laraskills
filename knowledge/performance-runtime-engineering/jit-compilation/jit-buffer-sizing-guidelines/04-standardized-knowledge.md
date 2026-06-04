# Standardized Knowledge: JIT Buffer Sizing Guidelines

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Buffer Sizing Guidelines |
| Difficulty | Intermediate |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The JIT buffer (opcache.jit_buffer_size) stores compiled native code in memory. An undersized buffer causes compilation thrashing (compiling, evicting, and recompiling). An oversized buffer wastes memory. The 128MB default suits most applications; 256MB is recommended for large applications or when using aggressive inlining (optimization levels 4-5).

## Core Concepts

- **Buffer Allocation**: Contiguous memory segment at JIT initialization. Cannot be resized at runtime — requires PHP-FPM restart.
- **Buffer Utilization**: Monitor via opcache_get_status()['jit']['buffer_size'] and buffer_free.
- **Fragmentation**: Native code segments of varying sizes cause fragmentation over long-running processes. More severe with Function JIT than Tracing JIT.
- **Buffer Overflow**: When full, oldest compiled code is evicted (LRU-like). Recompilation on next hot-path triggers, negating JIT benefits.

## When To Use

- Initial JIT configuration for a new deployment
- Diagnosing performance issues related to JIT buffer pressure
- Tuning buffer size for large applications
- Planning JIT memory budget

## When NOT To Use

- When JIT is disabled (no buffer needed)
- For development environments where buffer tuning isn't a priority
- When OpCache memory is the primary constraint (fix OpCache first)

## Best Practices

- **Start with 128MB**: This covers most applications. Only increase if monitoring shows >80% utilization.
- **Monitor utilization in first week**: Check jit_buffer_free daily. If it drops below 20% over 24h, increase buffer.
- **Use 256MB for large codebases**: Applications with >500K PHP LOC or those using aggressive inlining (O=4,5) benefit from larger buffers.
- **Account for fragmentation**: Monitoring buffer_free underestimates usable space due to fragmentation. If buffer_free is low but no eviction is happening, fragmentation is likely the issue.
- **Balance with OpCache memory**: JIT buffer + OpCache memory_consumption + interned_strings_buffer must fit within available RAM. Don't oversize one at the expense of others.

## Architecture Guidelines

- **Buffer Layout**: Header metadata + profiling counters + compiled code segments + free space. Allocated from a single mmap()/VirtualAlloc() call.
- **Fragmentation Types**: External (gaps between segments) and internal (unused space within segments). External fragmentation is the primary concern.
- **Eviction Strategy**: When no free segment can accommodate a new compilation, the oldest compiled code is evicted (LRU-like). Fragmentation accelerates eviction.
- **Buffer Compaction (PHP 8.4+)**: Rearranges compiled code to consolidate free space. Triggered when free space < 20% of total buffer.

## Performance Considerations

- 64MB minimum, 128MB default, 256MB recommended for large applications
- Buffer too small: compilation thrashing, JIT benefit diminished
- Buffer too large: wastes virtual memory (not physical until used)
- Fragmentation reduces effective buffer capacity by 15-30% over 24h in Function JIT mode
- Tracing JIT fragments 40-50% less than Function JIT

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Undersized buffer | Not monitoring utilization | Compilation thrashing, hot paths revert to interpreter | Monitor jit_buffer_free; increase if <20% |
| Oversized buffer for small app | Assuming bigger is always better | Wasted address space | Start with 128MB; only increase if needed |
| Not accounting for fragmentation | Checking buffer_free only | Underestimating usable capacity | Also monitor eviction count and compaction count |
| Function JIT with 64MB buffer | Aggressive mode with small buffer | Constant eviction, no JIT benefit | Use 256MB for Function JIT with inlining |

## Anti-Patterns

- **Resizing buffer without restart**: JIT buffer is allocated at startup. Changes require PHP-FPM restart. Plan changes during maintenance windows.
- **Setting buffer to 1GB unnecessarily**: Huge buffers waste address space. Physical memory is allocated on demand, but virtual address space can be constrained in 32-bit environments.
- **Ignoring fragmentation in long-running processes**: Over hours/days, fragmentation reduces effective capacity. Monitor compaction count and eviction rate.

## Examples

```ini
; php.ini — Buffer sizing
; Small to medium application (< 500K PHP LOC)
opcache.jit_buffer_size=128M

; Large application or aggressive inlining
opcache.jit_buffer_size=256M

; Memory-constrained environment
opcache.jit_buffer_size=64M
opcache.jit=1254 ; Tracing JIT (less fragmentation)
```

## Related Topics

- JIT Configuration for Production
- JIT Memory Layout and Fragmentation
- JIT Mode Comparison
- OpCache Memory Consumption

## AI Agent Notes

- 128MB is the recommended starting point. Monitor utilization and increase if >80% full.
- Buffer is pre-allocated — changes require PHP-FPM restart.
- Fragmentation reduces effective capacity by 15-30% over 24h in Function JIT mode.
- Tracing JIT produces less fragmentation than Function JIT (40-50% less).
- JIT buffer + OpCache memory must fit within available RAM. Budget both together.

## Verification

- [ ] Initial buffer size set (128MB or 256MB for large apps)
- [ ] Utilization monitored (jit_buffer_free > 20%)
- [ ] Compaction count checked for fragmentation issues
- [ ] Eviction rate monitored (should be near zero at steady state)
- [ ] Buffer size balanced with OpCache memory_consumption
- [ ] Restart planned if buffer size needs adjustment
