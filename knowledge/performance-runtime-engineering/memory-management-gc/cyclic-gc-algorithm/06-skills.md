# Skill: Understand and Leverage PHP's Cyclic GC Algorithm

## Purpose

Use knowledge of PHP's concurrent cycle collection algorithm (purple/grey/white marking) to predict GC behavior and optimize memory management in long-running processes.

## When To Use

- Debugging why certain cycles are not collected
- Understanding GC timing and overhead
- Tuning GC for long-running workers
- Writing code that works optimally with GC

## When NOT To Use

- For short-lived PHP-FPM requests (GC never runs during a typical request)
- Without understanding the purple/grey/white marking algorithm
- When standard GC defaults are sufficient

## Prerequisites

- Understanding of reference counting as the primary memory management
- Knowledge that GC handles cycles that refcounting cannot
- PHP 7.3+ runtime

## Inputs

- GC telemetry from gc_status()
- Object graphs with suspected cycles
- Code that creates temporary cycles during processing

## Workflow (numbered steps)

1. Monitor GC activity: `gc_status()` shows runs, collected, threshold, roots
2. The GC algorithm: purple nodes (possible cycle roots) are stored in the root buffer
3. When root buffer reaches threshold (default 10000), GC runs: marks all nodes grey, then scans for cycles using purple/grey/white algorithm
4. Nodes in a true cycle remain white after scanning — these are collected
5. Nodes reachable from outside the cycle become grey/black — these are kept
6. After collection, freed memory is returned to the Zend MM
7. To optimize: minimize the number of buffer entries by avoiding unnecessary cycles
8. For batch operations: call `gc_collect_cycles()` after the batch to clean up before the buffer auto-triggers
9. For long-running workers: monitor root_buffer_length — if it stays high, investigate cycle sources
10. Document the GC algorithm behavior relevant to the application

## Validation Checklist

- [ ] GC activity monitored (runs, collected, threshold, roots)
- [ ] Purple/grey/white algorithm understood
- [ ] Root buffer entries minimized through cycle prevention
- [ ] gc_collect_cycles() used strategically after batch operations
- [ ] Long-running workers monitored for buffer accumulation
- [ ] GC behavior documented

## Common Failures

- **Assuming gc_collect_cycles() is always needed**: GC runs automatically when the threshold is reached — explicit calls are only for specific timing requirements
- **Not understanding purple nodes**: Any node with refcount decreased but > 0 is "possible purple" — not all purples are cycles
- **Expecting GC to collect all cycles immediately**: GC runs only when the root buffer reaches threshold — cycles accumulate between runs
- **Calling gc_collect_cycles() on every request**: Unnecessary overhead — the GC will collect when needed

## Decision Points

- Root buffer < 1000: GC overhead is negligible — no action needed
- Root buffer 1000-5000: moderate — monitor for trends
- Root buffer 5000-10000: high — investigate cycle sources
- Root buffer > 10000: GC will trigger — ensure GC CPU overhead is acceptable
- For PHP-FPM: root buffer is reset at request end — no long-term concern
- For Octane: root buffer accumulates — monitor and investigate

## Performance Considerations

- GC collection pause: 1-50ms depending on root buffer size and object graph complexity
- GC CPU overhead per run: ~0.1-5ms per 10000 root entries scanned
- Root buffer accumulation: 100-1000 entries per request is normal for framework apps
- gc_collect_cycles(): costs the same as an automatic GC run — only call when timing matters
- Cycle prevention (WeakReference) eliminates both root buffer entries and GC runs

## Security Considerations

- GC is a memory management detail — no direct security implications
- GC pauses are pauses in PHP execution — they do not affect request isolation
- In Octane, long GC pauses may affect request latency — monitor if latency-sensitive

## Related Rules (from 05-rules.md)

- Tune GC Threshold for Long-Running Workers
- Never Disable GC Entirely in Production
- Call gc_collect_cycles() Strategically After Batch Operations
- Monitor GC Root Buffer in Long-Running Workers

## Related Skills

- GC Threshold Tuning
- GC Telemetry and Root Buffer
- Circular Reference Detection
- WeakReference API Usage

## Success Criteria

- GC algorithm (purple/grey/white) understood
- Root buffer size monitored and managed
- gc_collect_cycles() used strategically, not profligately
- Cycle prevention reduces unnecessary GC runs
- GC behavior documented for team reference
