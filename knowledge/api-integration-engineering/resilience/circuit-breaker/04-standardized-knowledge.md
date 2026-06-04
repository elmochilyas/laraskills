# ECC Standardized Knowledge — Circuit Breaker

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-reliability-patterns |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Circuit Breaker |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K007, K024 |

## Overview (Engineering Value)
The circuit breaker pattern prevents cascading failures by detecting when an external service is degraded and failing fast instead of waiting for timeouts. It operates in three states: Closed (normal operation, failures counted within a window), Open (rejecting requests immediately to protect resources), and Half-Open (probing for recovery with limited test requests). For Laravel, synchronous circuit breakers (algoyounes/circuit-breaker) work with Guzzle middleware, while queue circuit breakers (harris21/laravel-fuse) protect queue jobs. This pattern is essential for production API integrations to prevent resource exhaustion during upstream outages.

## Core Concepts
- **Closed State**: Normal operation; requests pass through, failures tracked within a counting window
- **Open State**: Requests rejected immediately (fail-fast); no upstream calls made
- **Half-Open State**: After timeout, limited probe requests test for recovery
- **Failure Threshold**: Percentage or count of failures in a window triggering Open state
- **Reset Timeout**: Duration before transitioning from Open to Half-Open
- **Minimum Requests**: Minimum requests required before evaluating failure rate (prevents premature tripping)
- **Failure Classification**: Which errors count as failures (5xx, timeouts, connection errors; not 4xx, 429)

## When To Use
- External API calls with variable reliability
- Queue jobs making external API calls (use Fuse for queue-based circuit breaker)
- Any integration where cascading failure prevention is needed
- Services with SLAs that don't guarantee 100% uptime

## When NOT To Use
- Internal services with guaranteed reliability and fast failover
- Read-only calls to stable internal microservices
- Non-critical integrations where fail-fast is unnecessary

## Best Practices
- Classify failures carefully: 5xx and connection errors trip the breaker; 4xx (except 409/429) don't
- Set minimum requests (5-10) before evaluating failure rate to avoid false trips on small samples
- Use distributed cache (Redis) for state storage in multi-server deployments
- Implement half-open probes with `Cache::lock()` to prevent thundering herd on recovery
- Register event listeners on state transitions for alerting and dashboards

## Architecture Guidelines
- Implement at the integration boundary (before the HTTP call, not after)
- Per-service circuit breakers with independent thresholds and timeouts
- Fuse for queue jobs; `algoyounes/circuit-breaker` for synchronous calls
- Combine with retry: retry handles transient blips when circuit is closed; circuit breaker stops retry when service is down
- Monitoring dashboard showing state per service with transition history

## Performance Considerations
- State check: single cache read (~1-5ms)
- Open state: request rejected in ~1ms vs waiting for timeout (30s+)
- Half-Open probing: single request per timeout period, negligible overhead
- Cache operations for state management should use Redis for sub-millisecond latency

## Security Considerations
- Circuit breaker state should not be manipulated via unauthenticated endpoints
- Manual override (force Open/Closed) should require admin authentication
- Half-Open probes should not execute sensitive operations (use lightweight health check)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Counting 429 as failures | Not classifying errors | Breaker trips on rate limits, not actual outages | Exclude 429/401/403 from failure count |
| Too low min_requests | Configuration oversight | Single failure = 100% rate = false trip | Set min_requests to 5-10 |
| No half-open probing | Missing implementation | Circuit stays open forever | Always implement automatic probe |
| File cache for state | Convenience | Race conditions in multi-worker | Use Redis for distributed state |
| No state transition events | Missing monitoring | Silent failures during outage | Fire events on all state changes |

## Anti-Patterns
- **Global Circuit Breaker**: Single breaker for all services (one failing service blocks all others)
- **No Half-Open**: Circuit opens and stays open until manual reset (operator burden)
- **Synchronous-Only**: Protecting sync calls but not queue jobs (async still hammers failing service)
- **Retry Without Breaker**: Infinite retry during outage (wasteful, cascading failures)

## Examples (concise, architectural)
```php
// Fuse middleware for queue jobs (harris21/laravel-fuse)
class ProcessStripeWebhook implements ShouldQueue
{
    public $tries = 0; // Unlimited releases; Fuse controls retry

    public function middleware(): array
    {
        return [new CircuitBreakerMiddleware('stripe')];
    }

    public function handle(): void
    {
        // If circuit is open, Fuse releases job with delay
        // If circuit is half-open, Fuse allows probe
        // If circuit is closed, normal execution
    }
}
```

## Related Topics
- **Prerequisites**: HTTP client basics, retry strategies
- **Closely Related**: Bulkhead pattern (ku-02), timeout handling (ku-03), fallback strategies (ku-04)
- **Advanced**: Fuse queue circuit breaker, custom failure classification
- **Cross-Domain**: Resilience engineering, chaos engineering, site reliability

## Verification
- [ ] Three states (Closed/Open/Half-Open) correctly implemented
- [ ] Failure classification excludes 429/401/403
- [ ] Minimum requests configured before threshold evaluation
- [ ] Redis-backed state for multi-worker deployments
- [ ] Half-open probes test recovery automatically
- [ ] Event listeners on state transitions for alerting
