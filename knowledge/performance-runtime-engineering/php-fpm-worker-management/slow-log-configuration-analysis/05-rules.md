## Set request_slowlog_timeout at p90, then lower gradually
---
Category: Monitoring
---
Start slow log threshold at the p90 latency. Lower to p75 after initial triage. Never start at a threshold that generates excessive entries.
---
Reason: A threshold set too low (e.g., p50) causes 50% of requests to trigger slow log entries, overwhelming the log file and making analysis impossible. Starting at p90 captures the worst offenders without noise.
---
Bad Example:
```ini
; Threshold too low — log overwhelmed
request_slowlog_timeout = 1 ; 50% of requests trigger this
```

Good Example:
```ini
; Start at p90, then lower
request_slowlog_timeout = 5 ; Only 10% of requests trigger
```
---
Exceptions: Very low-traffic environments where log volume is not a concern.
---
Consequences Of Violation: Log file overwhelmed, meaningful analysis impossible, disk space exhaustion.

## Analyze slow log by frame frequency, not individual entries
---
Category: Maintainability
---
Count unique stack frame frequency across all slow log entries. A function appearing in 80% of entries is the root cause.
---
Reason: A single slow entry may be an outlier (network spike, cache miss). The function that appears in most entries is the consistent problem. Frequency analysis filters noise and reveals the optimization target.
---
Bad Example:
```bash
# Analyzing individual entries in isolation
# Misses the pattern across 1000 entries
```

Good Example:
```bash
# Frequency analysis — find the consistent culprit
grep -oP '(?<=#0  ).*' /var/log/php-fpm/slow.log | sort | uniq -c | sort -rn | head -10
```
---
Exceptions: Low-traffic applications with few slow log entries.
---
Consequences Of Violation: Optimization effort focused on outliers rather than the consistent bottleneck.

## Never use slow log as a permanent profiler in high-traffic environments
---
Category: Performance
---
Enable slow log during investigation windows. Disable it for normal operation. Use sampling profilers for continuous monitoring.
---
Reason: Slow log adds ~0.5ms per request and generates log I/O for each triggered entry. In high-traffic environments, permanent enablement adds measurable overhead and log management burden.
---
Bad Example:
```ini
; Permanently enabled in high-traffic production
request_slowlog_timeout = 5 ; Adds overhead 24/7
```

Good Example:
```ini
; Enable during investigation only
; request_slowlog_timeout = 5 ; Commented out normally
; Use Blackfire/Tideways for continuous profiling
```
---
Exceptions: Low-traffic environments (<10 req/s) where overhead is negligible.
---
Consequences Of Violation: Unnecessary request overhead, log volume management burden.
