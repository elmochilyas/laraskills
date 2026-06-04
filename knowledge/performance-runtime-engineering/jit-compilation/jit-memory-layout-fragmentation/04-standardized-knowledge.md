# Standardized Knowledge: JIT Memory Layout and Fragmentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Memory Layout and Fragmentation |
| Difficulty | Advanced |
| Lifecycle | Analyze, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The JIT buffer is a pre-allocated contiguous memory region divided into segments for code, metadata, and profiling data. Over time, native code segments of varying sizes cause fragmentation — small gaps between compiled functions that cannot accommodate new compilations. PHP 8.4+ introduced buffer compaction to defragment the buffer without requiring reset.

## Core Concepts

- **Buffer Layout**: Header metadata → profiling counters → compiled code segments → free space. Allocated from a single mmap() or VirtualAlloc() call at JIT initialization.
- **Code Segment Allocation**: Each compiled function/trace gets a variable-length segment. Tracing JIT produces more uniform segments; Function JIT produces widely varying sizes.
- **Fragmentation Types**: External (gaps between segments) and internal (unused space within segments). External fragmentation is the primary concern.
- **Eviction Strategy**: When no free segment can accommodate a new compilation, the oldest compiled code is evicted (LRU-like). Fragmentation accelerates eviction.
- **Buffer Compaction (PHP 8.4+)**: Rearranges compiled code to consolidate free space. Triggered when free space < 20% of total buffer.

## When To Use

- Diagnosing JIT buffer performance degradation over time
- Tuning buffer size and JIT mode to minimize fragmentation
- Understanding eviction and compaction behavior
- Optimizing long-running processes where fragmentation accumulates

## When NOT To Use

- Initial JIT configuration (focus on buffer size first)
- Short-lived processes where fragmentation doesn't accumulate
- When buffer utilization is well below 80% (fragmentation unlikely to be an issue)

## Best Practices

- **Monitor eviction rate**: When evictions occur, JIT benefit diminishes. Increase buffer size or reduce fragmentation if evictions are frequent.
- **Use Tracing JIT**: Tracing JIT fragments 40-50% less than Function JIT due to more uniform code segment sizes.
- **Check compaction count**: opcache_get_status()['jit']['compaction_count'] shows how often compaction runs. High frequency indicates fragmentation pressure.
- **Increase buffer if compaction is frequent**: Frequent compaction means the buffer is too small for the working set. Increase jit_buffer_size.
- **Plan for 24h+ behavior**: Fragmentation develops over hours. Monitor buffer state at startup, 1h, 6h, and 24h to understand the degradation curve.

## Architecture Guidelines

- **Buffer Layout**: Single contiguous mmap'd region. Header at base, profiling counters, then variable-length compiled code segments toward the high end. Free space is tracked via a free-list.
- **Fragmentation Mechanics**: Small segments are freed when code is evicted, creating gaps. New compilations must fit into a contiguous gap. If no gap is large enough, eviction is triggered even if total free space is adequate.
- **Compaction Algorithm (PHP 8.4+)**: Mark-compact: mark live compiled code, compact to one end of the buffer, update all references. Pauses execution for ~50-200µs during compaction.
- **Eviction Policy**: Evicted code is selected by LRU order. Frequently-executed hot functions are less likely to be evicted, but fragmentation can force eviction of hot code if gaps can't accommodate new compilations.

## Performance Considerations

- Fragmentation reduces effective buffer capacity by 15-30% over 24h in Function JIT mode
- Tracing JIT fragments 40-50% less than Function JIT due to more uniform code sizes
- Buffer compaction pauses execution for ~50-200µs — negligible for web requests
- Eviction cost: recompilation of evicted code on next hot-path trigger (50-500µs)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Function JIT in 24h+ processes | Preference for function mode | 15-30% effective capacity loss from fragmentation | Use Tracing JIT for long-running processes |
| Not monitoring evictions | Focusing only on buffer_free | Unnoticed performance degradation | Track eviction count and compaction frequency |
| Ignoring fragmentation in capacity planning | Counting buffer_free as usable | Overestimating effective capacity | Estimate 20% fragmentation overhead in buffer sizing |
| Oversized buffer for fragmentation mitigation | Throwing memory at the problem | Wasted address space | Choose Tracing JIT + monitor rather than oversizing |

## Anti-Patterns

- **Assuming buffer_free accurately reflects usable space**: Fragmentation creates unusable gaps between segments. buffer_free overestimates usable capacity.
- **Disabling compaction**: PHP 8.4+ compaction is beneficial. Disabling it accelerates fragmentation-driven eviction.
- **Setting huge buffer to avoid monitoring**: Large buffers delay but don't prevent fragmentation. Monitor regardless of buffer size.

## Examples

```php
// Monitor JIT buffer state
$jit = opcache_get_status(false)['jit'];
echo "Buffer size: {$jit['buffer_size']} bytes\n";
echo "Buffer free: {$jit['buffer_free']} bytes\n";
echo "Compaction count: {$jit['compaction_count']}\n";
echo "Buffer usage: " . round((1 - $jit['buffer_free'] / $jit['buffer_size']) * 100) . "%\n";
```

## Related Topics

- JIT Buffer Sizing Guidelines
- JIT for Long-Running Processes
- JIT Mode Comparison
- JIT Configuration for Production

## AI Agent Notes

- Fragmentation reduces effective buffer capacity by 15-30% over 24h in Function JIT mode.
- Tracing JIT produces 40-50% less fragmentation than Function JIT.
- PHP 8.4+ compaction mitigates fragmentation but adds ~50-200µs pauses.
- Monitor eviction count — frequent evictions indicate fragmentation-driven buffer pressure.
- Buffer_free overestimates usable capacity due to fragmentation gaps.

## Verification

- [ ] Fragmentation understood (external vs internal)
- [ ] Tracing JIT used for long-running processes
- [ ] Eviction rate monitored (should be near zero)
- [ ] Compaction count tracked over process lifetime
- [ ] Buffer_free interpreted with fragmentation overhead in mind
- [ ] PHP 8.4+ compaction enabled (default)
- [ ] Buffer size validated against 24h fragmentation behavior
