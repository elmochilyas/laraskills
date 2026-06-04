## Call gc_collect_cycles() at batch boundaries, never per-iteration
---
Category: Performance
---
Only trigger gc_collect_cycles() at batch boundaries (after queue job, after request, after import). Never call inside loop iterations.
---
Reason: gc_collect_cycles() costs 50-500µs per full cycle. Calling per-iteration in a 1000-iteration loop adds 50-500ms of total GC time. Call it after meaningful work units to amortize the cost.
---
Bad Example:
```php
foreach ($items as $item) {
    process($item);
    gc_collect_cycles(); // 50-500µs per iteration → 500ms for 1000 items
}
```

Good Example:
```php
foreach ($items as $item) {
    process($item);
}
gc_collect_cycles(); // Called once after batch is complete
```
---
Exceptions: Iterations processing very large objects where memory pressure is immediate.
---
Consequences Of Violation: 50-500ms wasted CPU time on unnecessary GC calls in hot loops.

## Call gc_collect_cycles() after each Octane request
---
Category: Performance
---
Always call gc_collect_cycles() after each request in Octane workers to prevent inter-request cycle accumulation.
---
Reason: In persistent workers, circular references accumulate across requests. Without periodic collection, the root buffer grows, eventually triggering unpredictable stop-the-world GC pauses during request processing.
---
Bad Example:
```php
// No GC after request — cycles accumulate across requests
public function handle($request, $next) {
    return $next($request);
}
```

Good Example:
```php
public function handle($request, $next) {
    $response = $next($request);
    gc_collect_cycles(); // Prevents cross-request accumulation
    return $response;
}
```
---
Exceptions: PHP-FPM where the process resets per request (cycles are freed with the heap).
---
Consequences Of Violation: Unpredictable GC pauses during requests, root buffer overflow.

## Monitor gc_status() before calling — skip if consistently zero
---
Category: Performance
---
Check gc_status()['collected'] before and after manual gc_collect_cycles(). If consistently zero, stop calling it.
---
Reason: If the application doesn't form circular references, gc_collect_cycles() does nothing but still incurs overhead. Monitoring effectiveness prevents waste.
---
Bad Example:
```php
// Blindly calling without monitoring effectiveness
gc_collect_cycles(); // May be doing nothing
```

Good Example:
```php
$before = gc_status()['collected'];
gc_collect_cycles();
$after = gc_status()['collected'];
if ($after - $before === 0) {
    // Stop calling — no cycles to collect
}
```
---
Exceptions: Applications with known circular reference patterns where GC is confirmed effective.
---
Consequences Of Violation: Wasted CPU on GC calls that collect nothing.
