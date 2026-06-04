# Skill: Configure Request Timeouts for FPM Pools

## Purpose

Set `request_terminate_timeout` and `request_slowlog_timeout` to prevent runaway requests from consuming workers indefinitely.

## When To Use

- Initial PHP-FPM configuration
- Workers are consumed by slow or stuck requests
- Diagnosing 504 gateway timeout errors
- Setting up slow request detection

## When NOT To Use

- For Octane workers (timeout is configured differently)
- When all requests complete within normal timeframes (<30s)
- Without first profiling normal request duration distribution

## Prerequisites

- Profiling data showing P95 and P99 request durations
- Understanding of the application's longest legitimate request
- Slow log configured for diagnosis

## Inputs

- Normal request duration distribution (P50, P95, P99, max)
- Longest legitimate request duration (known endpoint)
- Expected timeout-based error rate (504 responses)

## Workflow (numbered steps)

1. Profile request durations: determine P50, P95, P99, and absolute max for normal operation
2. Set `request_terminate_timeout` to 2-3x the longest legitimate request duration
3. For most web applications: 30-60 seconds is appropriate
4. For API endpoints with long-running operations: 120-300 seconds (or split into background jobs)
5. Set `request_slowlog_timeout` to the P95 value — requests exceeding this are logged for investigation
6. Ensure `slowlog = /path/to/slow.log` is configured to capture slow request traces
7. Monitor 504 errors after configuration — if increasing, timeouts may be too aggressive
8. Review slow log regularly to identify endpoints that need optimization
9. Adjust timeouts if the application has legitimate reasons for long-running requests
10. Document the timeout configuration and rationale

## Validation Checklist

- [ ] Request duration distribution profiled
- [ ] request_terminate_timeout set to 2-3x legitimate max
- [ ] request_slowlog_timeout set to P95 value
- [ ] Slow log path configured
- [ ] 504 errors monitored (should be 0 for normal operation)
- [ ] Slow log reviewed regularly
- [ ] Configuration documented

## Common Failures

- **Setting timeout too low (5-10s)**: Legitimate slow requests are terminated — users see 504 errors
- **Setting timeout too high (300s+)**: Runaway requests consume workers for minutes — degrades pool capacity
- **Not configuring slow log**: Cannot diagnose why requests are timing out without slow log data
- **Not reviewing slow log**: Slow log is only useful if reviewed and acted upon

## Decision Points

- Web page request: 30s default (most framework pages complete in 1-5s)
- API endpoint: 30-60s (depends on data processing requirements)
- File upload endpoint: 60-120s (upload time varies with file size)
- Long-running report: 120-300s (or better: move to queue worker)
- Admin endpoint: 60-120s (admin operations may process large datasets)

## Performance Considerations

- Terminated requests consume partial resources — the timeout saves the remaining potential waste
- Slow log overhead: minimal (<0.1%) — traces are collected only when threshold is exceeded
- request_terminate_timeout sends SIGKILL — no graceful shutdown, resources may not be cleaned up
- SIGKILL from timeout: worker is killed and replaced — the PHP cleanup (destructors, shutdown functions) does not run
- Too many timeouts (>1% of requests): indicates systemic issue — investigate and fix, don't just increase timeout

## Security Considerations

- request_terminate_timeout prevents resource exhaustion from slow attacks
- SIGKILL skips shutdown functions — this may leave locks, transactions, or files in inconsistent states
- Slow log may reveal request parameters and paths — protect slow log files from public access
- Timeout-based DoS: attacker sends slow requests to consume all workers — timeout mitigates this

## Related Rules (from 05-rules.md)

- Set request_terminate_timeout to 2-3x Legitimate Max Duration
- Always Configure request_slowlog_timeout for Diagnosis
- Review Slow Log Weekly

## Related Skills

- Slow Log Configuration and Analysis
- FPM Status Page Monitoring
- Request Duration Profiling

## Success Criteria

- request_terminate_timeout configured for application needs
- Slow log enabled with appropriate threshold
- 504 errors from timeout = 0 for normal operation
- Slow log reviewed and actionable items addressed
- Configuration documented with rationale
