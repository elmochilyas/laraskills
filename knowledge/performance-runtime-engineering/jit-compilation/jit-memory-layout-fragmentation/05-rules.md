## Monitor JIT eviction rate — frequent evictions indicate buffer pressure
---
Category: Performance
---
Track eviction count via opcache_get_status(). Frequent evictions mean JIT benefit is diminished because code is constantly recompiled.
---
Reason: When evictions occur, compiled code is discarded and must be recompiled on next hot-path trigger. This re-introduces compilation overhead that JIT is supposed to eliminate. Increasing buffer size or switching to Tracing JIT reduces evictions.
---
Bad Example:
```php
// No eviction monitoring — silent performance degradation
$jit = opcache_get_status(false)['jit'];
// Unchecked eviction count
```

Good Example:
```php
$jit = opcache_get_status(false)['jit'];
$evictions = $jit['compilation_errors'] ?? 0; // Track over time
if ($evictions > 100) {
    // Increase jit_buffer_size or switch to Tracing JIT
}
```
---
Exceptions: Short-lived processes where fragmentation doesn't accumulate.
---
Consequences Of Violation: Constant recompilation, negated JIT benefit, unexplained CPU usage.

## Never rely solely on buffer_free for capacity planning
---
Category: Performance
---
Account for fragmentation when interpreting JIT buffer_free. Actual usable capacity is 15-30% lower than buffer_free indicates.
---
Reason: Fragmentation creates unusable gaps between compiled code segments. Buffer_free reports total free space including these gaps, overestimating usable capacity. External fragmentation is the primary concern.
---
Bad Example:
```php
// buffer_free=40MB, assumed usable
// Actual usable is ~28MB due to fragmentation
if ($jit['buffer_free'] > 20 * 1024 * 1024) {
    // False confidence — fragmentation gaps are unusable
}
```

Good Example:
```php
// Account for 20% fragmentation overhead
$usableFree = $jit['buffer_free'] * 0.8;
if ($usableFree < 20 * 1024 * 1024) {
    // Increase buffer size
}
```
---
Exceptions: Freshly initialized JIT buffer with zero fragmentation at startup.
---
Consequences Of Violation: Premature eviction, overestimated effective capacity, unexpected performance degradation.
