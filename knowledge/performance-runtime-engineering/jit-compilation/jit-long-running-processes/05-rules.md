## Pre-warm JIT in all long-running workers
---
Category: Performance
---
Always execute representative requests after Octane, Swoole, or FrankenPHP worker start to trigger JIT compilation before accepting production traffic.
---
Reason: Without pre-warming, the first 100+ requests on each worker run un-optimized in the Zend VM interpreter. Pre-warming reduces cold-start latency by 90% (from ~100 requests to ~10).
---
Bad Example:
```php
// No warmup — first 100 requests per worker are slow
Octane::start();
```

Good Example:
```php
// Pre-warm JIT immediately after start
$warmupUrls = ['/', '/api/health', '/api/products'];
foreach ($warmupUrls as $url) {
    Http::get($url); // Triggers JIT compilation
}
```
---
Exceptions: PHP-FPM deployments where workers recycle frequently via low pm.max_requests.
---
Consequences Of Violation: Cold-start latency spikes, inconsistent p95/p99 response times after deployment.

## Use Tracing JIT for processes running 24+ hours
---
Category: Performance
---
Prefer Tracing JIT (1254 or 1255) over Function JIT (1205) for long-running processes that operate continuously.
---
Reason: Tracing JIT fragments 40-50% less than Function JIT. In 24h+ processes, fragmentation reduces effective buffer capacity by 15-30%, triggering eviction and recompilation. Tracing JIT produces more uniform code segments.
---
Bad Example:
```ini
; Function JIT for 24/7 Octane worker
opcache.jit=1205 ; 30% effective capacity loss over 24h
```

Good Example:
```ini
; Tracing JIT for long-running process
opcache.jit=1254 ; 40-50% less fragmentation than 1205
```
---
Exceptions: Functions that are demonstrably faster with Function JIT and buffer fragmentation is monitored and managed.
---
Consequences Of Violation: Gradual performance degradation over 24h+ as fragmentation forces eviction of compiled code.

## Schedule periodic worker recycling to manage JIT fragmentation
---
Category: Reliability
---
Set max_requests to 5000-10000 for long-running workers to periodically recycle and reset the JIT buffer.
---
Reason: Even with Tracing JIT, fragmentation accumulates over thousands of requests. Periodic recycling (every 5000-10000 requests) prevents fragmentation from degrading performance while preserving most JIT benefit.
---
Bad Example:
```php
// No recycling — fragmentation grows indefinitely
// Octane worker runs for 50000+ requests
```

Good Example:
```php
// Balanced recycling interval
'max_requests' => 5000, // Resets JIT buffer before fragmentation hurts
```
---
Exceptions: Processes where any restart causes unacceptable disruption.
---
Consequences Of Violation: Gradual performance degradation from fragmentation, eventual eviction of hot code.
