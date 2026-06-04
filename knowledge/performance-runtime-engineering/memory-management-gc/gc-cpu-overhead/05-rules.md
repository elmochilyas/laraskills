## Profile GC overhead before tuning
---
Category: Performance
---
Always measure GC CPU cost via flame graphs or `gc_status()` before disabling or tuning the cycle collector.
---
Reason: GC is invisible overhead when it triggers rarely. Profiling confirms whether the cost justifies the optimization risk.
---
Bad Example:
```php
// Disabling GC "to be safe" without profiling
gc_disable(); // May save nothing — or cause leaks
```

Good Example:
```php
// Profile first: if gc_collect_cycles < 3% of CPU in flame graph, leave it
$status = gc_status();
if ($status['collected'] / max($status['runs'], 1) < 0.1) {
    // Low collection rate — consider disabling
}
```
---
Exceptions: None. Profile data is required before any GC setting change.
---
Consequences Of Violation: Unnecessary CPU waste (if disabling would help) or memory leaks (if disabling would harm).

## Disable GC for PHP-FPM request-scoped workloads
---
Category: Configuration
---
Set `gc_probability = 0` in php.ini for PHP-FPM pools. Enable only before operations known to create circular references.
---
Reason: PHP-FPM destroys the entire heap after each request — circular references are freed without the cycle collector. GC scanning is pure CPU overhead.
---
Bad Example:
```php
// Default: gc_probability=1 scans root buffer on random requests
// Each scan costs 50-500µs with no benefit
```

Good Example:
```php
// php.ini or pool config
gc_probability = 0
gc_divisor = 1000

// Enable only when needed
gc_enable();
// ... cycle-heavy operation ...
gc_collect_cycles();
gc_disable();
```
---
Exceptions: FPM workers running very long request (>30s) that accumulate many circular references.
---
Consequences Of Violation: 1-5% CPU wasted on scanning with zero cycles collected.

## Fix circular references instead of disabling GC in persistent runtimes
---
Category: Architecture
---
In Octane, Swoole, or FrankenPHP, use WeakReference to break circular references rather than disabling the cycle collector.
---
Reason: Disabling GC in persistent runtimes allows memory to grow unbounded as circular references accumulate across requests. Fixing the root cause (cycles) is safer.
---
Bad Example:
```php
// Octane worker: disabling GC
gc_disable(); // Memory leaks from ORM entity cycles
```

Good Example:
```php
// Break cycles with WeakReference
class ParentNode {
    public WeakReference $childRef;
    public function __construct(ChildNode $child) {
        $this->childRef = WeakReference::create($child);
    }
}
```
---
Exceptions: Applications verified to have zero circular references after code audit.
---
Consequences Of Violation: Unbounded memory growth, worker OOM, service disruption.

## Call gc_collect_cycles() explicitly after batch operations
---
Category: Performance
---
After batch processing (e.g., importing 10,000 records, generating 1,000 PDFs), call `gc_collect_cycles()` to clear the root buffer.
---
Reason: Batch operations create many temporary circular references. Waiting for the probabilistic trigger lets the root buffer grow large, making the next collection expensive.
---
Bad Example:
```php
foreach ($records as $record) {
    $this->processRecord($record);
    // GC triggers randomly (1/1000 chance) — root buffer grows
}
```

Good Example:
```php
foreach ($records as $i => $record) {
    $this->processRecord($record);
    if ($i % 1000 === 0) {
        gc_collect_cycles(); // Explicit cleanup after batch unit
    }
}
```
---
Exceptions: Operations that create no circular references.
---
Consequences Of Violation: Peak root buffer size grows, causing one expensive GC sweep at the end or in the next request.
