# Skill: Configure and Analyze FPM Slow Log

## Purpose

Enable the PHP-FPM slow log, set appropriate thresholds, and analyze slow request traces to identify performance bottlenecks.

## When To Use

- Debugging slow requests in production
- Setting up performance monitoring for a new application
- Identifying specific functions or queries causing slowdowns
- Periodic performance audits

## When NOT To Use

- When all requests are within acceptable timeframes
- Without first setting request_slowlog_timeout
- When the slow log would capture too many entries (threshold too low)

## Prerequisites

- PHP-FPM configured and running
- request_slowlog_timeout configured
- Slow log file path configured
- Log rotation configured (to prevent disk filling)

## Inputs

- Current request duration distribution (P50, P95, P99)
- Slow log file path
- request_slowlog_timeout value

## Workflow (numbered steps)

1. Set `slowlog = /var/log/php/fpm-slow.log` in the pool configuration
2. Set `request_slowlog_timeout = P95_duration` — captures the slowest 5% of requests
3. For initial setup: set to 5s (typical) and adjust based on observed log volume
4. Restart PHP-FPM to apply
5. Monitor log volume: if > 100 entries/minute, increase threshold (it is too low)
6. If < 1 entry/hour, decrease threshold (may be missing slow requests)
7. Analyze slow log entries: look for repeated patterns — same endpoint, same function, same database query
8. Trace the backtrace in each entry: the last entry in the backtrace is typically where time is spent
9. Correlate slow log entries with application profiling for deeper analysis
10. Fix the identified bottlenecks and verify improvement in slow log entries
11. Document the slow log configuration and recurring patterns

## Validation Checklist

- [ ] slowlog path configured
- [ ] request_slowlog_timeout set to appropriate value
- [ ] Log rotation configured (logrotate or similar)
- [ ] Slow log volume reviewed (5-50 entries/minute is normal)
- [ ] Recurring patterns identified from slow log entries
- [ ] Bottlenecks fixed based on slow log analysis
- [ ] Slow log reviewed weekly for new patterns
- [ ] Configuration documented

## Common Failures

- **Setting threshold too low**: Thousands of entries per minute — overwhelming noise, no signal
- **Setting threshold too high**: No entries — misses all slow requests
- **Not rotating slow logs**: Log file grows indefinitely — fills disk
- **Not acting on slow log findings**: The log is diagnostic — entries must be reviewed and addressed
- **Forgetting the full backtrace**: The slow log captures a PHP backtrace at the timeout — this pinpoints the exact location

## Decision Points

- Standard web app: start at 5s, adjust +/- based on log volume
- API (fast endpoints): start at 1s, adjust based on volume
- Admin/reporting (slow by nature): start at 10-30s
- If log volume > 100 entries/min: increase threshold by 50%
- If log volume < 1 entry/hour: decrease threshold by 50%
- If same endpoint appears frequently: profile that endpoint specifically

## Performance Considerations

- Slow log collection: <0.1% overhead — only occurs when threshold is exceeded
- Slow log writing: file I/O — negligible for typical volumes
- Log parsing: use `grep`, `awk`, or log analysis tools to find patterns
- Each slow entry includes: timestamp, pool, script path, request URI, and PHP backtrace
- Backtrace depth: configurable via `request_slowlog_trace_depth` (default 50)

## Security Considerations

- Slow log contains request URIs and file paths — sensitive data may be exposed
- Protect slow log files with appropriate permissions (640, owned by www-data)
- Log rotation prevents disk filling from DoS-generated slow entries
- Slow log entries may reveal application structure — restrict access

## Related Rules (from 05-rules.md)

- Always Configure request_slowlog_timeout for Diagnosis
- Review Slow Log Weekly
- Protect Slow Log Files from Public Access

## Related Skills

- Request Timeout Configuration
- FPM Status Page Monitoring
- Profiling and Callgraph Analysis

## Success Criteria

- Slow log configured with appropriate threshold
- Log rotation in place
- Recurring patterns identified and addressed
- Slow log volume within actionable range (5-50 entries/min)
- Configuration documented
