# Standardized Knowledge: Slow Log Configuration and Analysis

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Slow Log Configuration and Analysis |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`request_slowlog_timeout` enables PHP-FPM to log a stack trace of any request exceeding a threshold. This is the most direct way to identify slow code paths in production without installing a profiler. Set it to the p75 latency — requests slower than this trigger a backtrace showing exactly which function is taking too long.

## Core Concepts

- **Configuration**: `request_slowlog_timeout=5` (seconds). `slowlog=/var/log/php-slow.log`. Must have a pool-specific log path.
- **Output**: Timestamp, PID, request URI, and full PHP stack trace showing function/method/line at the timeout point.
- **Sampling principle**: At p75, 25% of requests trigger slow log entries. Focus analysis on the most-frequent slow frames. A function appearing in 80% of slow logs is the root cause.
- **Request duration**: Slow log shows where the request was WHEN the timeout fired, not the entire request profile. For detailed profiling, use Xdebug or Blackfire.

## When To Use

- Initial performance investigation without installing profiling tools
- Continuous monitoring for performance regressions
- Identifying slow database queries or external API calls
- Diagnosing intermittent slowdowns

## When NOT To Use

- As a replacement for full profiling (Xdebug/Blackfire) — slow log shows one point in time, not the full profile
- When the threshold is set too low (overwhelming the log file)
- In development environments (Xdebug profiling is more useful)
- When considering adding it permanently — enable, diagnose, then adjust threshold

## Best Practices (WHY)

- **Start at p90 and lower gradually**: Setting threshold too low (e.g., p50) generates too many entries, overwhelming the log. Start at p90, analyze, then lower to p75.
- **Analyze frequency, not just individual entries**: A function appearing in 80% of slow log entries is the root cause. Count unique stack frames.
- **Triage workflow**: 1) Count unique stack frames in slow log, 2) Identify most frequent functions, 3) Profile those functions with Xdebug to get full callgraph, 4) Optimize or cache.
- **Pair with profiling**: Slow log identifies the slow function; profiling explains why it's slow.

## Architecture Guidelines

- **Slow log triage**: 1) Count unique stack frames, 2) Identify most frequent functions, 3) Profile with Xdebug, 4) Optimize.
- **request_slowlog_timeout** fires a timer signal (SIGPROF) that captures the current stack trace via `zend_execute_data->prev_execute_data` chain.
- The slow log is a sampling profiler built into FPM — no additional extension needed.

## Performance

- Slow log adds ~0.5ms per request when enabled
- At p75 threshold, ~25% of requests trigger a stack trace dump (disk I/O)
- Enable during investigation windows, not permanently in high-traffic environments
- Monitor slow log file size and rotation

## Security

- Slow logs contain stack traces revealing internal code paths — restrict log access
- URIs in slow logs may contain sensitive data (query parameters, POST data)
- Rotate slow logs regularly and limit retention
- Never expose slow logs on public endpoints

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting request_slowlog_timeout too low | Aggressive monitoring | 50%+ of requests trigger slow log; log overwhelmed | Start at p90, lower gradually |
| Not setting pool-specific slow log path | Using default | All pools write to same file; analysis impossible | Configure per-pool slowlog paths |
| Ignoring call frequency | Focusing on single entries | Missing the most impactful function | Count frame frequency across all entries |
| Using slow log as permanent monitoring | Convenience | Unnecessary overhead and log volume | Enable during investigations; disable normally |

## Anti-Patterns

- **Using slow log as a permanent profiler**: The slow log adds overhead and log volume. Enable during investigation windows, not permanently.
- **Analyzing individual entries without frequency**: A single slow entry may be an outlier. Always analyze across all entries to find consistent patterns.
- **Ignoring the slow log entirely**: The slow log is a free, built-in diagnostic tool. Use it before reaching for external profilers.

## Examples

```ini
; php-fpm pool configuration
request_slowlog_timeout = 5
slowlog = /var/log/php-fpm/slow-$pool.log
```

```bash
# Analyze slow log — find most frequent functions
grep -oP '(?<=#0  ).*' /var/log/php-fpm/slow.log | sort | uniq -c | sort -rn | head -10

# Count unique stack frames
awk '/^#0/{frame=$0; count[frame]++} END{for(f in count) print count[f], f}' /var/log/php-fpm/slow.log | sort -rn | head -20
```

## Related Topics

- Request Timeout Configuration
- FPM Status Page Monitoring
- Callgraph Analysis Techniques
- Xdebug Profiling Setup
- Blackfire Installation

## AI Agent Notes

- request_slowlog_timeout is a free, built-in sampling profiler in PHP-FPM.
- Start at p90 threshold; lower gradually to avoid overwhelming the log.
- Analyze by grouping unique stack frames by frequency.
- Pair slow log with Xdebug profiling for full callgraph analysis.
- Enable during investigations; disable normally to avoid overhead.

## Verification

- [ ] request_slowlog_timeout configured with appropriate threshold
- [ ] Pool-specific slowlog path configured
- [ ] Frequency analysis performed on slow log entries
- [ ] Most frequent slow functions identified and investigated
- [ ] Slow log file rotation configured
- [ ] Log access restricted to authorized personnel
- [ ] Profiling performed on identified slow functions
