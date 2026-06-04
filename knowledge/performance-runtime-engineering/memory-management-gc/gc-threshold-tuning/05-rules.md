---
## Rule Name

Start with Default GC Threshold and Monitor

## Category

Performance

## Rule

Use the default GC threshold (10,000) for at least one week of production monitoring before considering any adjustment.

## Reason

The default threshold is well-tuned for the vast majority (>95%) of PHP applications. Adjusting the threshold without monitoring data is guesswork that can increase GC CPU overhead or allow cycles to accumulate unchecked.

## Bad Example

```php
// Adjusted threshold on day one — no monitoring data to guide the change
gc_threshold(5000);  // May cause double the GC frequency for no benefit
```

## Good Example

```php
// Monitored for a week: root buffer averages 2000 entries, GC runs every 500 requests
// No adjustment needed — default threshold (10000) is fine
```

## Exceptions

Applications with known, measured GC overhead exceeding 5% of application time.

## Consequences Of Violation

Increased GC frequency with no benefit, wasted CPU, or reduced collection frequency leading to memory accumulation.

---

## Rule Name

Adjust Threshold Based on Measured Root Buffer Growth Rate

## Category

Performance

## Rule

Set the GC threshold based on the observed root buffer growth rate per request: `threshold = expected_requests_between_collections * growth_per_request`.

## Reason

The root buffer fills at a rate determined by how many potential cycle roots each request creates. Measuring this rate allows you to calculate a threshold that triggers GC at the desired interval (e.g., every 500 requests), balancing pause frequency against pause duration.

## Bad Example

```php
// Arbitrary threshold — not based on measured growth rate
gc_threshold(50000);  // May cause hour-long gaps between collections
```

## Good Example

```php
// Measured: root buffer grows by 20 entries per request
// Desired: GC every 500 requests
gc_threshold(500 * 20);  // 10000 — aligns with default
```

## Exceptions

No common exceptions. Always base threshold on measured data.

## Consequences Of Violation

GC runs too frequently (high CPU overhead) or too rarely (memory accumulation).

---

## Rule Name

Increase Threshold for Latency-Sensitive Endpoints

## Category

Performance

## Rule

Increase the GC threshold during peak traffic or for latency-sensitive endpoints to reduce the frequency of stop-the-world GC pauses.

## Reason

A higher threshold means GC runs less frequently. Each run processes more roots (longer pause) but pauses are less frequent. For latency-sensitive applications, fewer pauses mean fewer latency spikes.

## Bad Example

```php
// Same threshold during peak and off-peak
// Peak: 10000 req/s, GC runs every 30 seconds causing spikes
```

## Good Example

```php
// Increase threshold during peak — fewer, longer pauses
if (isPeakTraffic()) {
    gc_threshold(30000);  // GC runs 1/3 as often
} else {
    gc_threshold(10000);  // Default
}
```

## Exceptions

Memory-constrained environments where the memory held by deferred cycles could cause OOM.

## Consequences Of Violation

More frequent latency spikes from GC pauses, higher p99 latency during peak traffic.

---

## Rule Name

Do Not Set Threshold to Zero Unless Managing GC Manually

## Category

Reliability

## Rule

Never set `gc_threshold(0)` without a corresponding manual `gc_collect_cycles()` strategy in long-running processes.

## Reason

A zero threshold disables automatic GC. The root buffer grows unbounded without manual collection, eventually exhausting memory. Manual `gc_collect_cycles()` calls must be inserted at strategic points to compensate.

## Bad Example

```php
gc_threshold(0);  // Disabled automatic GC
// No manual collection — root buffer grows forever
```

## Good Example

```php
gc_threshold(0);  // Manual management
// Every 100 requests:
gc_collect_cycles();
```

## Exceptions

No common exceptions. Manual GC management requires disciplined collection calls.

## Consequences Of Violation

Unbounded root buffer growth, eventual worker OOM, silent memory accumulation.

---

## Rule Name

Protect Critical Sections with gc_protect, Not Threshold Changes

## Category

Architecture

## Rule

Use `gc_protect()` and `gc_unprotect()` for short critical sections instead of changing the global threshold.

## Reason

`gc_protect()` temporarily defers collection within a specific code section. Changing the global threshold has side effects on all code paths. Use threshold changes for sustained behavior changes (peak traffic) and `gc_protect()` for short latency-critical sections.

## Bad Example

```php
// Threshold change for a single critical section
$old = gc_threshold(50000);
// ... latency-critical code ...
gc_threshold($old);  // Might not be restored on exception
```

## Good Example

```php
// Protect/unprotect for short sections
gc_protect();
try {
    // ... latency-critical code ...
} finally {
    gc_unprotect();
    gc_collect_cycles();  // Collect deferred cycles
}
```

## Exceptions

No common exceptions. Use the right tool for each scope.

## Consequences Of Violation

Global threshold changes affecting other code paths, missed restoration on exception paths.
