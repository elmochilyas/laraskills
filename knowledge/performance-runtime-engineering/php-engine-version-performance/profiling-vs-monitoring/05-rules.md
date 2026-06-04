## Never use Xdebug profiling in production
---
Category: Performance
---
Never enable Xdebug's profiling mode in production environments. Use sampling profilers (Blackfire, Tideways, SPX) instead.
---
Reason: Xdebug adds 50-200% overhead in profiling mode, causing performance collapse. Sampling profilers add <5% overhead and are safe for production use.
---
Bad Example:
```ini
; Production php.ini — NEVER do this
xdebug.mode=profile
```

Good Example:
```ini
; Use sampling profiler for production
; Blackfire: 2-5% overhead
; Tideways: 1-3% overhead
; SPX: <5% overhead
```
---
Exceptions: Development and staging environments where performance impact is acceptable.
---
Consequences Of Violation: 50-200% performance degradation, potential production outage during profiling sessions.

## Profile first, then monitor — never guess at bottlenecks
---
Category: Performance
---
Always use profiling to identify root causes before deploying monitoring for long-term tracking. Never optimize without profiling data.
---
Reason: Intuition about performance bottlenecks is wrong more often than right. Profiling provides exact inclusive/exclusive time and call counts. Monitoring catches regressions but cannot identify root causes.
---
Bad Example:
```php
// Optimizing without profiling — guessing at bottleneck
// "I think the query is slow, let me add an index"
$users = DB::table('users')->where('status', 'active')->get();
// Profile may show the query is 5% of time, not the bottleneck
```

Good Example:
```bash
# Profile first
blackfire curl http://app/endpoint
# Then optimize based on data
# Then deploy monitoring to ensure it stays fixed
```
---
Exceptions: Known bottlenecks from prior investigations where the root cause is already documented.
---
Consequences Of Violation: Wasted optimization effort on non-bottlenecks, unresolved real performance issues.

## Always pair monitoring alerts with profiling capability
---
Category: Reliability
---
Whenever a monitoring alert triggers on latency or error rate degradation, have a profiling workflow ready to capture the root cause.
---
Reason: Monitoring tells you something is wrong. Profiling tells you why. Without profiling capability, alerts are half-useful — you know there's a problem but cannot diagnose it without scrambling.
---
Bad Example:
```bash
# Alert fires: p95 latency spike to 5s
# No profiling tool configured
# Team scrambles to reproduce in staging
```

Good Example:
```bash
# Alert fires: p95 latency spike
# Blackfire trigger initiates automatic profile
# Team reviews flame graph to find root cause
```
---
Exceptions: Very small applications where manual debugging is feasible.
---
Consequences Of Violation: Extended mean-time-to-resolution (MTTR), repeated incidents without root cause understanding.

## Restrict profiling data access to authorized personnel
---
Category: Security
---
Treat profiling data (flame graphs, call stacks, function names) as sensitive information and restrict access accordingly.
---
Reason: Profiling reveals internal code paths, function names, and execution details that aid attackers in understanding application internals. Raw profiling files should never be exposed on public endpoints.
---
Bad Example:
```php
// Exposing raw profiling data publicly
Route::get('/profile-data', fn() => file_get_contents('/tmp/profile.xhgui'));
```

Good Example:
```php
// Profiling data accessible only to authorized internal tools
Route::get('/profile-data', fn() => file_get_contents('/tmp/profile.xhgui'))
    ->middleware(['auth', 'can:view-profiles']);
```
---
Exceptions: Aggregated, anonymized profiling metrics (e.g., "average wall time per endpoint") can be safely exposed.
---
Consequences Of Violation: Information disclosure, aiding attacker reconnaissance of application internals.
