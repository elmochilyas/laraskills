# Skill: Call gc_collect_cycles() Strategically for Batch Processing

## Purpose

Use `gc_collect_cycles()` at the right points in batch processing to free cycle memory immediately rather than waiting for automatic GC.

## When To Use

- Processing large batches of items where each item may create temporary cycles
- Between major processing phases in long-running workers
- Before and after peak memory usage in batch jobs
- When immediate memory reclamation is needed (before the next memory-intensive operation)

## When NOT To Use

- On every request in PHP-FPM (cycles are cleaned at request end anyway)
- When GC is already keeping up (root buffer < 5000)
- Without profiling to confirm that explicit collection improves performance
- In tight loops (gc_collect_cycles() overhead adds up)

## Prerequisites

- Understanding of when automatic GC triggers (root buffer threshold)
- Profiling showing memory usage patterns in batch processing
- Knowledge of the gc_status() function

## Inputs

- Batch processing code with multiple phases
- Memory usage trends across phases
- GC telemetry: root_buffer_length, runs, collected

## Workflow (numbered steps)

1. Profile the batch process: measure memory usage at each phase
2. Check GC telemetry: `gc_status()['root_buffer_length']` before and after each phase
3. Identify phases where root buffer grows significantly (5000+ entries accumulated)
4. After each such phase, call `gc_collect_cycles()` to immediately process the root buffer
5. Measure memory after the call: should decrease as cycles are freed
6. If memory does not decrease, the root buffer entries are not cycles — investigate other leak sources
7. For very large batches (>100K items), consider calling gc_collect_cycles() every N items
8. Monitor CPU overhead from the explicit calls: each call takes 1-50ms
9. If CPU overhead exceeds the benefit, remove the explicit call and let automatic GC handle it
10. Document the gc_collect_cycles() placement and rationale

## Validation Checklist

- [ ] Batch process phases identified and memory profiled
- [ ] Root buffer growth monitored across phases
- [ ] gc_collect_cycles() called after memory-intensive phases
- [ ] Memory reclaimed confirmed after each call
- [ ] CPU overhead measured and justified
- [ ] Automatic GC triggers analyzed (threshold tuning if needed)
- [ ] Strategy documented

## Common Failures

- **Calling gc_collect_cycles() in tight loops**: Each call costs 1-50ms — calling it 1000 times adds seconds to processing time
- **Expecting memory to return to baseline**: gc_collect_cycles() only frees cycles — other allocations remain
- **Not checking root_buffer_length first**: If the buffer is empty, gc_collect_cycles() does nothing but still costs time
- **Replacing automatic GC**: gc_collect_cycles() runs the same algorithm — it does not collect more than automatic GC

## Decision Points

- Root buffer < 1000 after phase: no explicit call needed
- Root buffer 1000-5000 after phase: call if between expensive phases
- Root buffer > 5000 after phase: call to prevent automatic trigger during next phase
- Phase processes 10K+ items: call every 1000 items to keep buffer manageable
- Memory pressure is high: call gc_collect_cycles() before the next memory-intensive operation

## Performance Considerations

- gc_collect_cycles() overhead: 1-50ms per call depending on root buffer size
- Typical batch job call frequency: once per 1000-10000 items (0.1-0.01% overhead)
- Automatic GC (at threshold 10000): 1-50ms, triggered by root buffer reaching 10000
- Memory freed per call: varies by cycle prevalence — typically 1-50% of peak memory
- Explicit calls prevent the automatic GC from triggering at unpredictable times (reduces latency variance)

## Security Considerations

- gc_collect_cycles() does not affect security
- Explicit GC calls reduce peak memory usage, which can prevent OOM in memory-constrained environments
- No security implications from the function itself

## Related Rules (from 05-rules.md)

- Call gc_collect_cycles() Strategically After Batch Operations
- Never Disable GC Entirely in Production
- Monitor GC Root Buffer in Long-Running Workers

## Related Skills

- GC Algorithm and Cycle Collection
- GC Threshold Tuning
- GC Telemetry and Root Buffer
- Memory Leak Detection Patterns

## Success Criteria

- gc_collect_cycles() placed at optimal points in batch processing
- Memory reclaimed immediately after each explicit call
- CPU overhead from explicit calls measured and acceptable
- Automatic GC triggers prevented during critical phases (reduced latency variance)
- Strategy documented with rationale
