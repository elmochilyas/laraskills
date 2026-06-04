# Rules: Circuit Breaker + Rate Limiting for External Analytics API Calls

## Rule CB-01: Dedicated Circuit Breaker Per External Service
Each external dependency in the analytics pipeline MUST have its own circuit breaker instance. A shared circuit breaker causes cascading failures where one degraded service blocks all enrichment.

## Rule CB-02: Log All State Transitions
Every circuit breaker state transition MUST be logged with service name, previous state, new state, failure count, and timestamp. Without logging, circuit breaker activity is invisible and silent data quality issues go undiagnosed.

## Rule CB-03: Implement Degraded Fallbacks
Every circuit-protected enrichment call MUST have a degraded fallback strategy. Returning null without flagging the event for reprocessing constitutes data loss. Use sentinel values and reprocessing flags.

## Rule CB-04: Rate Limit Per Tenant
In multi-tenant systems, rate limiting MUST be applied per tenant identity, not globally. Global rate limits allow one tenant to exhaust the shared budget, causing denial of service to all other tenants.

## Rule CB-05: Exponential Backoff on Circuit Open
When a circuit transitions to Open, the retry timeout MUST increase exponentially with each subsequent Open transition. Fixed timeouts cause thundering herd recovery failures when multiple services recover simultaneously.

## Rule CB-06: Half-Open Probe Isolation
The half-open state MUST send exactly one probe request. Multiple concurrent probes defeat the purpose of the half-open state and can overwhelm a recovering service.

## Rule CB-07: Configurable Thresholds
Failure thresholds and time windows MUST be configurable via environment or configuration provider, not hardcoded. Production and development environments require different sensitivity levels.

## Rule CB-08: Queue Jobs Must Release, Not Fail
When a circuit breaker opens during queue job execution, the job MUST be released back to the queue with a delay, not immediately failed. Immediate failure causes job loss and data gaps.

## Rule CB-09: Rate Limiter Selection by Traffic Pattern
Analytics pipelines with bursty traffic MUST use token bucket rate limiters. Fixed window limiters cause boundary bursts and uneven throughput. Use sliding window for smooth, predictable traffic.

## Rule CB-10: Monitor Amplification Factor
Track the ratio of attempted to successful external calls. A rising amplification factor indicates circuit breaker flapping — repeatedly opening and closing — which requires threshold recalibration.
