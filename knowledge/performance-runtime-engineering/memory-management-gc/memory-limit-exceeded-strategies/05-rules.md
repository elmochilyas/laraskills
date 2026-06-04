## Defer memory-heavy operations to queue workers
---
Category: Architecture
---
Any operation whose profiled peak memory exceeds 50% of the web pool `memory_limit` must be deferred to a queue job.
---
Reason: Web workers must remain responsive and numerous. Queue workers can have higher limits and operate asynchronously.
---
Bad Example:
```php
// Web controller exporting 100k records — OOM risk
class ExportController {
    public function csv(): Response {
        return response($this->buildLargeCsv()); // 400MB peak
    }
}
```

Good Example:
```php
// Web controller dispatches the job
class ExportController {
    public function csv(): Response {
        ProcessExport::dispatch(request()->user());
        return response()->json(['status' => 'processing']);
    }
}
```
---
Exceptions: Synchronous operations essential for the user workflow (e.g., single-record processing).
---
Consequences Of Violation: OOM errors in web pool, degraded responsiveness for all users.

## Set PHP memory_limit below container memory limit
---
Category: Operations
---
Configure `memory_limit` to 75-80% of the container's cgroup memory limit in containerized deployments.
---
Reason: Container OOM (SIGKILL) terminates the entire pod without cleanup. PHP OOM terminates only the current request with a logged fatal error.
---
Bad Example:
```php
// Docker memory limit: 256MB
// PHP memory_limit: 256MB — if either hit, pod OOMs
```

Good Example:
```php
// Docker memory limit: 256MB
// PHP memory_limit: 192MB — PHP catches the error, 64MB headroom for OS
```
---
Exceptions: Single-process containers (CLI daemons) where PHP and container share the exact same footprint.
---
Consequences Of Violation: Pod crashes, all concurrent requests lost, harder to debug (no PHP error log).

## Monitor peak memory per endpoint and alert on thresholds
---
Category: Operations
---
Track `memory_get_peak_usage(true)` for every request, grouped by URL pattern. Alert when P95 exceeds 80% of `memory_limit`.
---
Reason: Endpoint-specific monitoring reveals which operations need optimization or queue offloading. Aggregate average hides individual spikes.
---
Bad Example:
```php
// Global average memory: 48MB — seems fine
// But /api/reports endpoint peaks at 200MB (hidden in average)
```

Good Example:
```php
// Per-endpoint monitoring
Log::info('Request memory', [
    'url' => request()->path(),
    'peak' => memory_get_peak_usage(true),
    'limit' => ini_get('memory_limit'),
]);
```
---
Exceptions: Applications with uniform memory usage across all endpoints.
---
Consequences Of Violation: Memory-heavy endpoints go undetected until production OOM.

## Implement graceful degradation for near-memory-limit requests
---
Category: Architecture
---
When `memory_get_usage(true)` exceeds 80% of `memory_limit`, switch to a degraded mode: serve cached responses, simplify queries, or return 503 with Retry-After.
---
Reason: A partial response that OOMs mid-stream wastes all CPU already spent. Early degradation serves a complete (simplified) response.
---
Bad Example:
```php
// Request proceeds normally, OOM at 90% complete → user gets error
```

Good Example:
```php
public function handle(Request $request): Response {
    if ($this->isNearMemoryLimit()) {
        return $this->serveCached(); // Degraded but complete
    }
    return $this->serveFresh();
}

private function isNearMemoryLimit(): bool {
    $usage = memory_get_usage(true);
    $limit = convertToBytes(ini_get('memory_limit'));
    return $usage / $limit > 0.8;
}
```
---
Exceptions: Real-time or interactive endpoints where degraded responses are not acceptable (should offload to queue instead).
---
Consequences Of Violation: Partial response + fatal error = wasted CPU, frustrated user, no cached fallback.
