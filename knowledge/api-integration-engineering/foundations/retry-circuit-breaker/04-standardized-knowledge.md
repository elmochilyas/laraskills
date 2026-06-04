# ECC Standardized Knowledge — Retry Circuit Breaker

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Retry & Circuit Breaker |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K005, K007, K024 |

## Overview (Engineering Value)
Combining retry with circuit breaker creates a robust resilience pattern: retry handles transient failures (timeouts, 5xx blips) while the circuit breaker prevents retry from hammering an already-down service. The circuit breaker stops retry attempts when the failure rate exceeds a threshold (Open state), then periodically probes for recovery (Half-Open state). This combination prevents wasted resources, cascading failures, and retry storms. In Laravel, `Http::retry()` handles retry and packages like Fuse (for queues) or algoyounes/circuit-breaker (for sync) handle circuit breaking.

## Core Concepts
- **Transient vs Persistent Failures**: Retry for transient (timeout, 503), circuit break for persistent
- **Retry with Backoff**: Exponential backoff + jitter between retry attempts
- **Circuit Breaker States**: Closed (normal) → Open (fail-fast) → Half-Open (probe)
- **Failure Threshold**: Percentage of failures in a window triggering Open state
- **Retry Budget**: Maximum retry attempts before circuit breaker should trip

## When To Use
- All external API calls with retry configured
- API calls to services with variable reliability
- Queue jobs making external API calls (use Fuse)
- Any integration where cascading failure prevention is needed

## When NOT To Use
- Internal services with guaranteed reliability and fast responses
- Non-critical calls where fail-fast is preferred over retry

## Best Practices
- Set retry to respect circuit breaker state (retry only when circuit is closed)
- Classify failures: 5xx + network errors trip breaker; 4xx (except 429) don't
- Configure min requests (5-10) before evaluating failure rate to prevent false trips
- Use Redis-backed state for multi-worker coordination

## Architecture Guidelines
- Use `Http::retry()` for synchronous retry; queue job retry for async
- Implement circuit breaker at the integration boundary (before the HTTP call)
- Store circuit state in distributed cache (Redis) for multi-server deployments
- Register event listeners on state transitions for alerting

## Performance Considerations
- Open state: request rejected in ~1ms vs waiting for timeout (30s+)
- State check: single cache read (~1-5ms)
- Half-Open probing: single request per timeout period

## Common Mistakes
- Retrying when circuit is open (wastes resources on guaranteed failure)
- Counting 429 as circuit breaker failures (rate limits != service outage)
- Not implementing half-open probes (circuit stays open forever)
- Using file cache for state in multi-worker deployments

## Related Topics
- **Prerequisites**: HTTP client basics, retry strategies
- **Closely Related**: Timeout handling (ku-03), fallback strategies (ku-04)
- **Advanced**: Fuse queue circuit breaker, custom failure classification
- **Cross-Domain**: Resilience engineering, chaos engineering

## Verification
- [ ] Retry stops when circuit breaker opens
- [ ] Circuit breaker classifies 5xx as failures, 4xx as non-failures
- [ ] Half-open probes test recovery automatically
- [ ] State persisted in distributed cache for multi-worker
- [ ] Event listeners fire on state transitions
