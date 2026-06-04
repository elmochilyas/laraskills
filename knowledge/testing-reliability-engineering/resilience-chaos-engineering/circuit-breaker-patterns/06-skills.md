# Skill: Implement Circuit Breaker Patterns in Laravel

## Purpose
Implement circuit breaker patterns in Laravel services to prevent cascading failures when external dependencies (APIs, databases, services) become unresponsive, using tools like Laravel's built-in cache-based circuit breaker or dedicated packages.

## When To Use
- When your application depends on external APIs that may become unavailable
- When a service degradation should not cascade to your entire application
- When you need to fail fast instead of waiting for timeouts on unresponsive services
- When implementing resilience patterns in microservice architectures
- When you want to gracefully degrade functionality instead of returning errors

## When NOT To Use
- For local in-process dependencies that are always available (file system, local cache)
- When the circuit breaker complexity exceeds the reliability requirements
- For services with strict availability requirements and no acceptable degraded mode
- When the dependency is already wrapped in a client with retry logic (avoid double wrapping)

## Prerequisites
- Understanding of circuit breaker states: Closed, Open, Half-Open
- Laravel cache driver (for storing circuit state)
- Service class or client that makes external requests
- Defined fallback behavior for when the circuit is open

## Inputs
- External service endpoints or client implementations
- Failure threshold (number of failures before opening)
- Timeout duration for half-open recovery attempt
- Fallback response or behavior when circuit is open
- Cache store configuration for circuit state persistence

## Workflow
1. Identify external dependencies that need circuit breaker protection
2. Choose storage for circuit state (Laravel cache with Redis recommended)
3. Implement a circuit breaker wrapper around the service client
4. Configure failure threshold (e.g., 5 consecutive failures → open circuit)
5. Configure recovery timeout (e.g., 30 seconds before half-open)
6. On success: reset failure count (closed state)
7. On failure: increment failure count; if threshold exceeded, open circuit
8. When circuit is open: fail fast with fallback response
9. After timeout: transition to half-open, allow one trial request
10. Implement fallback logic (cached response, degraded functionality, default value)

## Validation Checklist
- [ ] Circuit breaker states (Closed, Open, Half-Open) are correctly implemented
- [ ] Failure threshold is configured based on service reliability requirements
- [ ] Recovery timeout is configured (not too short, not too long)
- [ ] Fallback behavior is implemented for open circuit state
- [ ] Circuit breaker state is persisted across requests (cache or database)
- [ ] Logging is added for circuit state transitions
- [ ] Tests verify each state transition and fallback behavior
- [ ] Circuit breaker can be manually reset if needed

## Common Failures
- Circuit breaker state not persisted — resets on every request, never opens
- Recovery timeout too short — immediately reopens on next failure
- No logging — hard to debug circuit breaker behavior
- Fallback not implemented — open circuit still returns errors
- Using file cache for state — doesn't work across multiple servers
- Threshold too sensitive — brief hiccups cause extended outages

## Decision Points
- State storage: cache vs database — cache for speed (Redis recommended), database for persistence
- Failure type: consecutive vs sliding window — consecutive for simple, sliding window for burst protection
- Fallback: cached response vs degraded vs error — cached for stale data, degraded for partial functionality

## Performance Considerations
- Cache-based circuit breaker adds ~1-5ms per check (cache get)
- State transitions (cache writes) are rare events
- Open circuit is fast — fails immediately without calling the external service
- Monitor circuit breaker metrics as part of application monitoring

## Security Considerations
- Circuit breaker should not bypass authentication or authorization
- Fallback responses should not leak information about the external service
- Manual circuit breaker reset endpoint must be authenticated and access-controlled
- Log circuit state transitions for security audit
- Ensure circuit breaker doesn't mask security-related service failures

## Related Rules
- [Rule: Implement Fallback Behavior for Open Circuit](./05-rules.md)
- [Rule: Use Redis for Circuit Breaker State](./05-rules.md)
- [Rule: Log State Transitions](./05-rules.md)

## Related Skills
- Laravel Resilience Patterns
- Chaos Engineering Concepts
- Fault Injection Testing

## Success Criteria
- [ ] Circuit breaker is implemented with all three states
- [ ] Fallback behavior is defined and tested
- [ ] State transitions are logged for debugging
- [ ] Circuit breaker is tested with unit tests for each state
- [ ] Recovery timeout is appropriate for the service's reliability characteristics
