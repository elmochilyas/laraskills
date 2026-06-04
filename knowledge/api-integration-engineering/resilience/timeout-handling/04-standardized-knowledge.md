# ECC Standardized Knowledge — Timeout Handling

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-reliability-patterns |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Timeout Handling |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K002 |

## Overview (Engineering Value)
Timeout handling prevents a single slow API call from blocking resources indefinitely, protecting application responsiveness and preventing cascading failures. Timeouts are configured at multiple levels: connect timeout (TCP handshake), request timeout (waiting for response), and total operation timeout (including retries). In Laravel, `Http::timeout()` sets request timeout, `Http::connectTimeout()` sets connection timeout, and queue job `$timeout` limits job execution time. Proper timeout configuration balances avoiding premature failure against bounding resource usage.

## Core Concepts
- **Connect Timeout**: Time to establish TCP connection (default 10s)
- **Request Timeout**: Time to receive full response headers (default 30s)
- **Total Timeout**: Maximum time for the complete operation including retries
- **Queue Job Timeout**: Maximum execution time for a queue job
- **Timeout Exception**: `ConnectException` or `RequestException` from Guzzle on timeout
- **Fail-Fast on Timeout**: Quick failure is better than hanging resources

## When To Use
- All external API calls (always configure timeouts)
- Queue jobs making API calls (configure job timeout)
- Database queries during webhook processing

## When NOT To Use
- Streaming responses where prolonged connections are expected
- Internal services with guaranteed fast response times (still configure generous timeout)

## Best Practices
- Always set both connect and request timeouts; never rely on defaults alone
- Configure connect timeout lower (2-5s) than request timeout (15-30s)
- Set queue job timeout to exceed max expected API call time but not queue worker timeout
- Combine timeout with retry: different timeout per retry attempt (shorter later attempts)
- Log timeout exceptions with service name and endpoint for monitoring

## Architecture Guidelines
- Timeout configuration in service class or connector, not per-call
- Separate timeouts per service based on SLA (fast: 5s, slow: 60s)
- Queue job timeout = max(expected API call time) × max retries + buffer
- Circuit breaker timeout: total pool timeout for bounded concurrent execution
- Monitor timeout rates as a leading indicator of integration health

## Performance Considerations
- Shorter timeouts free resources faster but increase failure rate for slow services
- Longer timeouts reduce false failures but risk cascading resource exhaustion
- Connection timeout at 2s handles transient network issues without blocking workers
- Queue job timeout must account for retry delay between attempts

## Common Mistakes
- No timeout configured (defaults to 0 = infinite, worker hangs forever)
- Same timeout for connect and request (should be different: connect 5s, request 30s)
- Queue job timeout shorter than API call + retry delays (job forced-failed before retry completes)
- Timeout without retry (single timeout failure = permanent failure for transient blips)

## Related Topics
- **Prerequisites**: HTTP fundamentals, queue job configuration
- **Closely Related**: Retry strategies, circuit breaker (ku-01), fallback strategies (ku-04)
- **Advanced**: Deadline propagation, timeout per retry attempt
- **Cross-Domain**: Network reliability, SRE practices

## Verification
- [ ] Connect timeout configured (2-5s)
- [ ] Request timeout configured (15-30s)
- [ ] Queue job timeout exceeds expected API call time
- [ ] Timeout exceptions logged with context
- [ ] Timeout + retry combination handles transient failures
