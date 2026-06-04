# Standardized Knowledge: Request Timeout Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | Request Timeout Configuration |
| Difficulty | Intermediate |
| Lifecycle | Configure, Protect |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Three timeout mechanisms protect PHP-FPM from hung requests: `request_terminate_timeout` (FPM-level, kills worker — 502 error), `max_execution_time` (PHP-level, throws fatal error), and `max_input_time` (time for reading request data). The most important production setting is `request_terminate_timeout=30` — it prevents a single slow request from occupying a worker indefinitely.

## Core Concepts

- **request_terminate_timeout**: FPM master kills the worker if a request exceeds this time. No error handling — the connection dies with a 502. Set 10-30s above expected max response time.
- **max_execution_time**: PHP internal timer. Throws a fatal error when exceeded. Can be caught with `register_shutdown_function()` for graceful error handling. Default: 30s.
- **max_input_time**: Time to read POST data and file uploads. Default: 60s. For large uploads, this may need to be increased.
- **Relationship**: `max_execution_time < request_terminate_timeout` — allow PHP to handle timeout gracefully before FPM kills the worker.

## When To Use

- Every production PHP-FPM deployment — essential safety setting
- Applications with long-running requests (file processing, report generation, API calls)
- Preventing resource exhaustion from runaway processes
- Compliance requirements for maximum request duration

## When NOT To Use

- Set too aggressively (lower than legitimate request duration) causes false positives
- For CLI scripts where long execution is expected (separate configuration)
- As a substitute for fixing slow code — timeouts are safety nets, not solutions

## Best Practices (WHY)

- **Set request_terminate_timeout 10-30s above p99 latency**: Too low causes 502 errors during normal operation. Monitor timeout hits in FPM error log.
- **Maintain the timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`. Input time highest (wait for uploads), execution timeout catches runaway code, FPM timeout is the safety net.
- **Catch timeouts gracefully**: Use `register_shutdown_function()` for `max_execution_time` to return a proper error response instead of a blank 502.
- **Monitor timeout events**: Track timeout counts in your monitoring system. An increase may indicate a new performance regression.

## Architecture Guidelines

- **Timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`
- request_terminate_timeout is a SIGKILL — no shutdown handlers run. Use it as a last resort.
- max_execution_time throws a fatal error — shutdown handlers DO run. Prefer this for graceful handling.
- max_input_time runs from request start to completion of body reading.

## Performance

- request_terminate_timeout too low: false positives, 502 errors during normal operation
- max_execution_time too high: runaway code occupies workers for too long
- Request timeout events indicate a performance problem — optimize the slow code, don't just raise the timeout
- Worker stuck on a timed-out request blocks other requests in the pool

## Security

- request_terminate_timeout prevents resource exhaustion attacks (slow loris, large uploads)
- max_execution_time prevents infinite loops and runaway processes from consuming CPU
- max_input_time prevents slow upload attacks from occupying connections
- All three together provide defense in depth against denial of service

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting request_terminate_timeout too low | Overly aggressive protection | 502 errors during normal spikes | Set at 2-3x p99 latency; monitor timeout hits |
| Not setting request_terminate_timeout | Default is 0 (disabled) | Stuck workers accumulate, pool exhaustion | Always set this safety net (30-60s) |
| Reversed hierarchy (FPM timeout < PHP timeout) | Misconfiguration | FPM kills worker before PHP can handle gracefully | Ensure max_execution_time < request_terminate_timeout |
| Raising timeouts instead of fixing code | Treating symptom | Masks performance problems | Fix the slow code; timeouts are safety nets |

## Anti-Patterns

- **Setting request_terminate_timeout=0**: Disables the most important safety net. A single infinite loop can exhaust the entire FPM pool.
- **Using timeouts as performance targets**: Timeouts should be safety nets, not performance goals. If requests are timing out, optimize the code.
- **Ignoring timeout events**: Each timeout is a signal of a performance problem. Monitor and investigate.

## Examples

```ini
; php-fpm pool configuration — timeout hierarchy
request_terminate_timeout = 60s
; php.ini — PHP execution timeout
max_execution_time = 30
max_input_time = 60
```

## Related Topics

- Slow Log Configuration and Analysis
- FPM Status Page Monitoring
- CPU vs I/O Bound Worker Ratios
- PHP Error Handling

## AI Agent Notes

- Three timeout mechanisms: request_terminate_timeout (FPM), max_execution_time (PHP), max_input_time (PHP).
- Hierarchy: max_input_time > max_execution_time < request_terminate_timeout.
- request_terminate_timeout is a SIGKILL (no shutdown handlers).
- max_execution_time is a fatal error (shutdown handlers run).
- Always set request_terminate_timeout (default is 0 = disabled).

## Verification

- [ ] request_terminate_timeout set (value > 0)
- [ ] max_execution_time < request_terminate_timeout
- [ ] max_input_time configured for upload requirements
- [ ] Timeout hierarchy correct (input > execution < FPM)
- [ ] Shutdown handler registered for graceful timeout handling
- [ ] Timeout events monitored in FPM error log
- [ ] Timeout values reviewed against p99 latency
