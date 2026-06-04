# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Resilience & Chaos Engineering |
| Knowledge Unit | Circuit Breaker Patterns |
| Difficulty | Advanced |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Distributed systems fundamentals, External API integration, Queue job management |
| Related KUs | Resilience testing (Laravel Resilience), Chaos engineering (Laravel Bazooka), Retry strategies |
| Source | domain-analysis.md K039 |

# Overview

Circuit breaker patterns protect Laravel applications from cascading failures when external services or dependencies become unavailable. In Laravel, circuit breakers are implemented primarily via two packages: `laravel-fuse` (for queue job circuits) and `laravel-circuit-breaker` (for general service calls). A circuit breaker monitors failures to an external dependency — after a configurable threshold of failures, it "opens" the circuit, immediately failing subsequent calls without attempting the real operation. After a timeout period, it transitions to "half-open" state, allowing a trial call to test if the service has recovered. Circuit breaker patterns are essential for resilient Laravel applications that depend on external APIs, databases, queues, or services.

# Core Concepts

- **Circuit states**: Closed (normal operation, calls pass through), Open (failures exceed threshold, calls fail fast), Half-Open (trial period, limited calls allowed to test recovery).
- **Failure threshold**: Number of consecutive failures before circuit opens. Configurable per dependency.
- **Reset timeout**: Duration after which circuit transitions from Open to Half-Open. Configurable.
- **Half-open max calls**: Number of trial calls allowed in Half-Open state. Usually 1. If successful, circuit closes. If fails, circuit re-opens.
- **Fallback mechanism**: Alternative behavior when circuit is open: cached data, default value, queued retry, or degraded response.
- **`laravel-fuse`**: Package focused on queue job circuit breaking. Wraps job dispatch with circuit state checks.
- **`laravel-circuit-breaker`**: General-purpose circuit breaker for any service call. Supports array/Redis/DB storage.

# When To Use

- External API integrations with reliability concerns
- Queue job processing dependent on external services
- Database connection resilience (circuit break + read-replica fallback)
- Microservice-to-microservice communication
- Any synchronous call to an external dependency that may fail or become slow

# When NOT To Use

- Internal application services that don't call external dependencies
- Simple retry logic (use retry mechanism instead of full circuit breaker)
- Stateless idempotent operations where retry is always safe
- Applications with no external dependencies
- When fallback behavior cannot be meaningfully implemented

# Best Practices (WHY)

- **Always provide a fallback when circuit is open**: Reason: without fallback, the application throws CircuitOpenException and the user sees a 500 error. Fallback can be cached data, default value, or informative degraded response.
- **Separate circuit breaker instances per dependency**: Reason: one failing dependency should not affect others. Each external service needs its own circuit breaker configuration.
- **Count only server errors as failures**: Reason: client errors (400 Bad Request) are not circuit failures. Only 5xx errors and timeouts should increment the failure counter.
- **Use Redis for state storage in distributed apps**: Reason: Redis atomic operations ensure consistent state across multiple application servers. Database storage adds latency.
- **Reset circuit state during deployments**: Reason: previously open circuits may remain open after the dependency has been fixed. Reset circuit state during deployment.
- **Monitor circuit states in health endpoints**: Reason: track open-circuit duration and frequency. Alert when circuits remain open for extended periods.

# Architecture Guidelines

- **Fallback granularity**: Per-operation fallback (specific cached data for specific endpoint) vs generic (return error message). Prefer per-operation fallbacks.
- **Failure threshold tuning**: Start with 3-5 consecutive failures. Lower for critical dependencies (2 failures), higher for tolerant ones (10 failures).
- **Reset timeout configuration**: 30 seconds for most services. Longer for services with slow recovery (60-120 seconds).
- **Storage selection**: Redis for high-throughput distributed apps. Database for simple single-server apps.
- **Graceful degradation**: When circuit is open, return degraded response with informative messaging rather than crashing.

# Performance Considerations

- **Circuit check overhead**: <1ms (Redis read) to 5ms (database read). Negligible compared to operation cost.
- **State update on success/failure**: 1-5ms per operation. Acceptable for most use cases.
- **Circuit open saves significant time**: Immediate failure vs waiting for timeout (5-30 seconds).
- **State storage sizing**: Minimal. Circuit state is a few bytes per dependency.
- **Concurrent state updates**: Redis handles atomically. Database may require pessimistic locking for high-concurrency scenarios.

# Security Considerations

- **State storage security**: Circuit breaker state in Redis/database may contain information about dependency health. Restrict access.
- **Fallback data exposure**: Cached fallback data may be stale. Ensure stale data doesn't violate security or compliance requirements.
- **Circuit state manipulation**: Ensure circuit state cannot be manipulated by user input. State updates should only occur through the circuit breaker logic.

# Common Mistakes

**Mistake: No fallback when circuit is open**
- Description: "The circuit breaker prevents the call; that's enough"
- Cause: Assuming open circuit + exception is acceptable
- Consequence: User sees 500 error for every request during open circuit
- Better: Always implement fallback.

**Mistake: Too-sensitive failure detection**
- Description: Any exception opens the circuit
- Cause: "Every error is a failure"
- Consequence: Valid client errors (400 Bad Request) trigger circuit opening
- Better: Only count server errors (5xx) and timeouts as failures.

**Mistake: Global circuit breaker instead of per-dependency**
- Description: Single circuit breaker for all external calls
- Cause: Simpler configuration
- Consequence: One dependency failure opens circuit for all
- Better: Separate circuit breaker per dependency.

**Mistake: Not testing circuit breaker behavior**
- Description: "It's infrastructure code; it just works"
- Cause: Assuming circuit breaker packages work correctly
- Consequence: Production failure reveals misconfigured thresholds or missing fallbacks
- Better: Write integration tests that simulate dependency failure.

# Anti-Patterns

- **Single point of circuit breaking**: One circuit breaker for all dependencies creates cascading failures.
- **Missing monitoring**: Circuit state not exposed in health check endpoints.
- **Stale configuration**: Thresholds and timeouts not adjusted as application evolves.
- **Over-engineering**: Adding circuit breakers for dependencies that are highly reliable.

# Examples

**Circuit breaker for external API**
```php
$circuitBreaker = new CircuitBreaker('payment-gateway', [
    'failure_threshold' => 3,
    'reset_timeout' => 30,
    'storage' => 'redis',
]);

try {
    $result = $circuitBreaker->call(function () use ($paymentGateway) {
        return $paymentGateway->charge(100);
    });
} catch (CircuitOpenException $e) {
    // Fallback: return cached response or default value
    $result = $this->getCachedPaymentResponse();
}
```

**Queue job circuit breaker (laravel-fuse)**
```php
// config/fuse.php
return [
    'circuits' => [
        'payment-processor' => [
            'driver' => 'redis',
            'failure_threshold' => 5,
            'reset_timeout' => 60,
            'half_open_max_calls' => 1,
        ],
    ],
];
```

**Half-open health probe pattern**
```php
class ExternalApiCircuitBreaker
{
    public function call(callable $operation, callable $fallback): mixed
    {
        $state = $this->getState();
        if ($state === 'open') {
            return $fallback();
        }
        try {
            $result = $operation();
            $this->recordSuccess();
            return $result;
        } catch (ConnectionException $e) {
            $this->recordFailure();
            return $fallback();
        }
    }
}
```

# Related Topics

- Resilience testing (Laravel Resilience)
- Chaos engineering (Laravel Bazooka)
- Retry and backoff strategies
- Bulkhead pattern implementation
- Multi-layer resilience patterns

# AI Agent Notes

- When generating circuit breaker code, always include a fallback. Never leave open-circuit behavior undefined.
- Use per-dependency circuit breaker instances, not a single global breaker.
- Generate configuration with Redis storage for distributed apps, database for single-server apps.
- Start with failure threshold of 3-5 and reset timeout of 30 seconds. Document that these should be tuned per dependency.
- Include health endpoint exposure and monitoring recommendations in generated code.

# Verification

- [ ] Circuit breaker has fallback for every dependency
- [ ] Separate circuit breaker instance per external dependency
- [ ] Failure threshold and reset timeout are configured per dependency
- [ ] Redis storage used for distributed applications
- [ ] Only server errors count as failures (not client errors)
- [ ] Circuit state is exposed in health endpoints
- [ ] Circuit breaker behavior is tested in integration tests
- [ ] Circuit state is reset during deployments
