# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Circuit Breaker Pattern (3 States, Failure Thresholds, Half-Open Probes)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
The circuit breaker pattern prevents cascading failures by detecting when an external service is degraded and failing fast instead of waiting for timeouts. It operates in three states: Closed (normal operation, failures counted), Open (rejecting requests immediately to protect resources), and Half-Open (probing for recovery). The pattern is essential for production API integrations to prevent resource exhaustion and maintain system responsiveness during upstream outages.

## Core Concepts
- **Closed State**: Normal operation; requests pass through, failures are tracked within a window
- **Open State**: Requests are rejected immediately (fail-fast); no upstream calls are made
- **Half-Open State**: After timeout, a limited number of test requests probe for recovery
- **Failure Threshold**: Percentage or count of failures in a window that triggers Open state
- **Reset Timeout**: Duration before transitioning from Open to Half-Open for recovery testing
- **Failure Counting Window**: Time window (e.g., 60 seconds) for evaluating failure rate
- **Minimum Requests**: Minimum requests required before evaluating failure rate (avoids premature tripping)

## Mental Models
- **Electrical Circuit Breaker**: Same concept—when too much current (failures) flows, the breaker "trips" and stops all flow
- **Bulkhead Door**: Close the door to stop flooding from a failed compartment
- **Fail-Fast vs Fail-Slow**: Circuit breaker chooses fail-fast (instant rejection) over fail-slow (waiting for timeout)

## Internal Mechanics
- Closed → Open: Failure rate exceeds threshold within the counting window (e.g., 50% of 10+ requests failed in 60s)
- Open → Half-Open: After reset timeout (e.g., 30s), the breaker allows a single probe request
- Half-Open → Closed: Probe succeeds; breaker resets and resumes normal operation
- Half-Open → Open: Probe fails; breaker returns to Open state and restarts timeout
- State is typically stored in a distributed cache (Redis) for multi-worker coordination
- Failure classification distinguishes service failures (5xx, timeout) from client errors (4xx) that shouldn't trip the breaker

## Patterns
- **Per-Service Circuit Breaker**: Separate breaker for each external service (Stripe, Mailgun, etc.)
- **Failure Classification**: Only count server errors (5xx, connection failures) not client errors (4xx) or rate limits (429)
- **Peak Hours Tuning**: Different thresholds during business hours vs off-peak (higher tolerance during peak hours)
- **Half-Open Probing**: Single probe request via `Cache::lock()` to prevent thundering herd during recovery testing
- **Event-Driven State Changes**: Fire events on state transitions for alerting and monitoring
- **Direct Manual Override**: Artisan commands to force Open/Closed for emergency intervention

## Architectural Decisions
- Implement circuit breakers at the integration boundary (before the HTTP call, not after)
- Use distributed cache (Redis) for state storage in multi-server deployments
- Set minimum requests (5-10) to prevent tripping on small sample sizes
- Classify 429 responses as non-failures (service is rate limiting, not down)
- Integrate circuit breaker with queue jobs as middleware (Fuse pattern) for async operations
- Always provide event listeners for state transitions to drive alerting

## Tradeoffs
- Circuit breaker adds complexity (state management, failure classification, event handling)
- Aggressive thresholds protect resources but cause more false positives (tripping on transient blips)
- Conservative thresholds reduce false positives but allow more failures before tripping
- Synchronous circuit breakers (algoyounes) differ from queue-based (Fuse); choose based on integration pattern

## Performance Considerations
- State check is a cache read (~1-5ms); Open state avoids costly HTTP calls entirely
- Failure counting adds a cache write per request (~1-5ms)
- Half-Open probes use minimal resources (single request vs many concurrent)
- Default timeout (30-60s) balances recovery speed vs resource protection
- Cache operations for state management should use Redis for sub-millisecond latency

## Production Considerations
- Monitor circuit breaker states per service in a real-time dashboard
- Set up alerts on Open/Half-Open transitions for critical services
- Log each state transition with failure rate, attempt count, and threshold
- Configure peak hours tuning for services with different reliability requirements during business hours
- Implement manual override capabilities for emergency recovery acceleration
- Test recovery behavior regularly (circuit should heal itself when service returns)

## Common Mistakes
- Counting all HTTP errors as failures (rate limits and auth errors should not trip the circuit)
- Setting threshold too low (trips on normal variability) or too high (protects nothing)
- Not implementing half-open probes (once open, the circuit stays open forever)
- Using file cache for state in multi-worker deployments (race conditions)
- Not integrating with queue jobs (synchronous-only breakers don't protect async paths)
- Resetting failure count on state change (loses context, causes oscillation)

## Failure Modes
- **State Oscillation**: Circuit repeatedly opens and closes due to borderline failure rates
- **Stale State**: Cache failure preserves stale Open state, preventing recovery
- **Thundering Herd**: Multiple workers detect Half-Open simultaneously and all probe (mitigate with `Cache::lock()`)
- **False Open**: Misconfigured threshold causes Open during normal traffic spikes
- **False Closed**: Threshold too high allows sustained failures without protection
- **Recovery Failure**: Probe succeeds but system immediately fails (bad probe, unrepresentative)

## Ecosystem Usage
- Michael Nygard's "Release It!" book (2007) first documented the pattern; Martin Fowler popularized it
- algoyounes/circuit-breaker: synchronous circuit breaker for Guzzle middleware integration
- harris21/laravel-fuse: queue job circuit breaker by Harris Raftopoulos (Laracon India 2026)
- Fuse features: 3-state, intelligent failure classification, peak hours, Cache::lock probing, status page
- Stripe and major payment processors use circuit breaker patterns internally for downstream resilience

## Related Knowledge Units
- K005: Retry Strategies (retry within circuit breaker constraints)
- K024: Fuse Circuit Breaker (queue job implementation)
- K008: Rate Limiting Algorithms (failure classification: rate limits are not failures)
- K028: Laravel Horizon Monitoring (monitoring circuit breaker state changes)
- K007: Circuit Breaker (this document)

## Research Notes
- Original pattern from Michael Nygard's "Release It!" (2007); formalized by Martin Fowler in 2014
- Fuse (harris21/laravel-fuse) introduced at Laracon India 2026 is the first dedicated Laravel queue circuit breaker
- Fuse v0.4.0 (March 2026) supports PHP 8.3+, Laravel 11+, Redis
- Industry practice: combine circuit breaker with retry—circuit breaker prevents retry when service is down
- Failure classification (excluding 429/401/403 from tripping) is a critical usability improvement from Fuse
