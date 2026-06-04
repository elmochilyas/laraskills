## Always set request_terminate_timeout to a finite value above zero in production
---
Category: Reliability
---
Configure request_terminate_timeout in every production PHP-FPM pool with a value 10-30 seconds above the p99 response latency, never leaving it at the default of 0.
---
Reason: With request_terminate_timeout=0 (default), a single infinite loop or hung request occupies a worker indefinitely. Over time, hung workers accumulate and exhaust the pool, causing cascading 502 errors. A finite timeout is the last line of defense against runaway requests — it ensures a stuck worker is eventually freed.
---
Bad Example:
```ini
; Default — dangerous
; request_terminate_timeout not set (0 = disabled)
; A single infinite loop can exhaust the pool
```

Good Example:
```ini
; Safety net configured
request_terminate_timeout = 60s ; 2-3x p99 latency — catches runaways without false positives
```
---
Exceptions: Short-running queue worker pools where the timeout interferes with legitimate long jobs; use a separate pool configuration for those.
---
Consequences Of Violation: Hung workers accumulate, pool exhaustion, cascading 502 errors, application-wide outage from a single stuck request.

## Maintain the timeout hierarchy: max_execution_time must be less than request_terminate_timeout
---
Category: Configuration
---
Set max_execution_time (PHP) strictly lower than request_terminate_timeout (FPM) so PHP handles the timeout gracefully before FPM kills the worker.
---
Reason: max_execution_time throws a PHP fatal error, which triggers shutdown handlers registered via register_shutdown_function() — allowing a graceful error response. request_terminate_timeout sends SIGKILL, which terminates the process immediately without running any shutdown handlers. The hierarchy ensures the graceful mechanism fires first, with the forceful kill as a backup.
---
Bad Example:
```ini
; Reversed hierarchy — FPM kills before PHP can handle gracefully
max_execution_time = 30
request_terminate_timeout = 25 ; FPM kills first — no shutdown handler runs
```

Good Example:
```ini
; Correct hierarchy
max_execution_time = 30
request_terminate_timeout = 35 ; PHP handles timeout first; FPM is backup
```
---
Exceptions: None. This hierarchy is a universal safety best practice.
---
Consequences Of Violation: SIGKILL terminates workers without running shutdown handlers, producing blank 502 errors instead of graceful error pages, potential data loss from interrupted transactions.

## Register a shutdown handler for graceful max_execution_time timeout handling
---
Category: Reliability
---
Use register_shutdown_function() to return a proper error response when max_execution_time is exceeded, rather than allowing a blank page or connection reset.
---
Reason: When max_execution_time fires, PHP throws a fatal Error and stops execution. Without a shutdown handler, the response is empty or truncated. A shutdown handler can catch this condition and return a meaningful error response (JSON error, HTTP 503, or diagnostic page) that the client can handle gracefully instead of timing out on a blank response.
---
Bad Example:
```php
<?php
// No shutdown handler — blank response on timeout
// Client sees connection reset or empty body
```

Good Example:
```php
<?php
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && $error['type'] === E_ERROR) {
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Request timed out']);
    }
});
```
---
Exceptions: API-only applications where the framework handles timeout errors globally may rely on framework-level shutdown handling.
---
Consequences Of Violation: Clients receive blank or truncated responses on timeout, causing confusing failures, retries, and degraded user experience.

## Monitor timeout events as performance signals, not just configuration errors
---
Category: Monitoring
---
Track request_terminate_timeout and max_execution_time events in monitoring and alert on increases over the baseline rate.
---
Reason: Each timeout event represents a request that took longer than expected — usually a performance regression, a slow database query, or an external API call that hung. If timeouts are treated as "inevitable" and ignored, they silently mask growing performance problems. An increase in timeout rate is often the earliest indicator of a degradation.
---
Bad Example:
```bash
# Timeouts ignored — not tracked
# "Timeouts happen sometimes" — performance regression goes undetected for weeks
```

Good Example:
```bash
# Timeout events tracked and alerted
timeout_count = count("/var/log/php-fpm/*.log", "maximum execution time")
if timeout_count > baseline * 1.5:
    alert("Timeout rate increasing — investigate performance regression")
```
---
Exceptions: One-time timeout spikes from known events (deployments, cache clears) may be temporarily exempted with a deployment annotation.
---
Consequences Of Violation: Silent performance degradation, undetected slow queries, regression goes unnoticed until user-facing latency triggers a separate incident.

## Never raise timeouts as a substitute for fixing slow code
---
Category: Maintainability
---
Treat timeout hits as an investigation trigger, not a configuration knob — fix the root cause of slow requests rather than raising the timeout value.
---
Reason: Raising timeouts masks the underlying performance problem and delays investigation. A request that takes 60 seconds today will take 60 seconds tomorrow — the timeout just hides the symptom. Every timeout event represents a wasted worker slot that could have served 10-100 normal requests in the same time window.
---
Bad Example:
```ini
; Raising timeout to hide slow code — wrong approach
request_terminate_timeout = 300s ; Doubled from 150s — slow code still slow
```

Good Example:
```ini
; Investigate and fix the root cause
request_terminate_timeout = 60s ; Keep reasonable; profile to find the bottleneck
```
```bash
# Profile the slow request
# Found: N+1 query in report endpoint — added eager loading
# Request time dropped from 45s to 2s — problem solved, not hidden
```
---
Exceptions: When a known long-running operation (report generation, data export) is intentionally slow, increase timeout only for that specific route or pool.
---
Consequences Of Violation: Performance problems hidden indefinitely, wasted worker capacity, pool saturation from slow requests, degraded experience for all users.
