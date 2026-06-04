# ECC Standardized Knowledge — Fuse/Circuit Breaker Pattern

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-22 |
| Knowledge Unit | Fuse/Circuit Breaker Pattern |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009, K011 |

## Overview (Engineering Value)
The circuit breaker pattern prevents cascading failures by stopping requests to an unhealthy upstream service when failures exceed a threshold. Once the circuit is open, requests fail fast instead of waiting for timeout, giving the downstream service time to recover. After a cooldown period, the circuit transitions to half-open to test recovery.

## Core Concepts
- **Circuit States**: Closed (normal), Open (failing fast), Half-Open (testing recovery)
- **Failure Threshold**: Consecutive failure count before opening circuit (e.g., 5 failures)
- **Cooldown Period**: Time before transitioning from open to half-open (e.g., 30s)
- **Success Threshold**: Consecutive successes in half-open to close circuit
- **Fail-Fast**: Open circuit immediately throws or returns fallback
- **Sliding Window**: Failure count within a time window, not lifetime

## When To Use
- Outgoing HTTP calls to unreliable or degraded upstream services
- Protecting application resources from cascading failures
- Services with variable load patterns

## When NOT To Use
- Idempotent read operations (cache provides better strategy)
- Webhook delivery (use retry with backoff instead)
- Internal services with strong SLAs
- When fallback is worse than degraded response

## Best Practices
- Use sliding window failure counting (last N requests or time window)
- Log every state transition for monitoring
- Expose circuit state metrics for alerting
- Implement half-open with probe requests (single test request)
- Reset failure count on half-open success
- Set conservative thresholds initially, tune based on monitoring

## Architecture Guidelines
- Circuit breaker per upstream service endpoint group
- State stored in shared cache (Redis) for multi-server deployments
- Circuit breaker middleware in handler stack
- Fallback response on open circuit (cached data, default, error)
- Alerting on circuit transitions for incident response

## Performance Considerations
- State check adds ~1ms (cache lookup)
- Fail-fast is near-instantaneous vs waiting for timeout
- Half-open probes add one extra request per cooldown period
- Cache-based state avoids shared mutable state issues

## Common Mistakes
- Using request count without time window (corner case accumulation)
- Too-short cooldown period (flapping between open/closed)
- Not resetting failure count on success (permanently open circuit)
- Circuit breaker per request instead of per service
- Lack of monitoring on circuit transitions

## Related Topics
- **Prerequisites**: Retry strategies, timeout handling
- **Closely Related**: Bulkhead pattern, fallback strategies
- **Advanced**: Resilience4j circuit breaker patterns, Hystrix
- **Cross-Domain**: Distributed systems, reliability engineering

## Verification
- [ ] Sliding window failure counting implemented
- [ ] Half-open probe requests test recovery
- [ ] Fallback response for open circuit state
- [ ] Circuit transitions logged and monitored
- [ ] Shared cache for distributed state
- [ ] Thresholds tuned based on observed metrics
