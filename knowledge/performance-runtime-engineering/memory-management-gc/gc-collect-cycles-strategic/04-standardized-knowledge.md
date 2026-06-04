# gc_collect_cycles() Strategic Calling - Batch Boundaries, Not Per-Iteration

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | gc_collect_cycles() Strategic Calling - Batch Boundaries, Not Per-Iteration |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

gc_collect_cycles() manually triggers cycle collection. Calling it strategically at batch boundaries (after processing a job, after a batch of imports, at end of request) is the correct pattern. Calling per-iteration inside loops causes severe performance degradation due to O(n) cost of the Bacon-Rajan algorithm. In long-running processes, periodic gc_collect_cycles() at controlled intervals prevents unbounded root buffer growth.

## Core Concepts

- gc_collect_cycles() cost: 50-500us per full cycle depending on root buffer size and object graph complexity.
- Per-iteration overhead: Calling GC after every loop iteration in 1000-iteration loop adds 50-500ms of total GC time.
- Batch boundary pattern: Call after processing a batch (every 100 queue jobs, after each HTTP request in Octane).
- gc_status() pre/post: Monitor collection effectiveness with before/after measurements.

## When To Use

- Long-running processes (Octane, queue workers).
- After processing batches of items.
- When monitoring shows root buffer approaching threshold.

## When NOT To Use

- Inside hot loops (per-iteration).
- In PHP-FPM where process resets per request.
- When gc_status() shows consistently 0 cycles collected.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Call at batch boundaries, not per-iteration | Amortizes GC cost across meaningful work units. |
| Monitor gc_status() before calling | If consistently returns 0, cycles aren't forming - stop calling. |
| Use in Octane workers after each request | Prevents inter-request cycle accumulation. |

## Architecture Guidelines

- Automatic GC triggers when root buffer reaches 10,000 entries (stop-the-world pause).
- Proactive calling at controlled times prevents unpredictable pauses.
- PHP 8.5 reduces false positives from static fake closures and Enum singletons.

## Performance Considerations

- Each gc_collect_cycles() call: 50-500us.
- Per-iteration GC in 1000-iteration loop: 50-500ms added.
- Automatic GC at threshold: unpredictable pause during request.

## Security Considerations

- No direct security implications.
- OOM from unchecked cycle accumulation is a denial-of-service risk.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Calling gc_collect_cycles() before every DB query | GC has nothing to do with database memory. | Wasted CPU. | Only call when suspecting cycle accumulation. |

## Anti-Patterns

- Calling gc_collect_cycles() per-iteration in loops.
- Not calling gc_collect_cycles() in long-running Octane workers.

## Examples

```php
// Good: Octane request boundary
public function handle($request, $next) {
    $response = $next($request);
    gc_collect_cycles();
    return $response;
}

// Bad: inside hot loop
foreach ($items as $item) {
    process($item);
    gc_collect_cycles();  // 50-500us per iteration
}
```

## Related Topics

- Cyclic GC Algorithm
- GC Enable/Disable Patterns
- GC Telemetry and Root Buffer Monitoring

## AI Agent Notes

- The rule: call at boundaries (request end, batch end), never inside loops.
- Laravel Octane already calls gc_collect_cycles() after each request.
- PHP 8.5's GC improvements reduce false positives, making manual GC calls less necessary.
- monitor gc_status() to determine if calling is useful.

## Verification

- [ ] Verify Octane workers call gc_collect_cycles() after each request.
- [ ] Check hot loops for unnecessary gc_collect_cycles() calls.
- [ ] Monitor gc_status() before/after calls to measure effectiveness.
- [ ] Set up RSS monitoring for long-running workers.