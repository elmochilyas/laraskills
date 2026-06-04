# Skill: Implement Laravel Resilience Patterns

## Purpose
Implement Laravel-specific resilience patterns — retries with exponential backoff, fallbacks, timeouts, rate limiting, and graceful degradation — to build applications that survive partial failures and maintain availability.

## When To Use
- When the Laravel application depends on external services (APIs, databases, caches)
- When you need to handle transient failures gracefully
- When implementing specifications that require high availability
- When rate limiting external service usage to avoid throttling
- When building microservices or service-oriented architectures
- When the application should degrade gracefully rather than fail completely

## When NOT To Use
- For internal-only applications with no external dependencies
- When the dependency is a local in-process service (always available)
- When complexity of resilience patterns outweighs reliability needs
- When the external service is more reliable than your application's handling of it
- For read-only services where stale cached data is acceptable (just cache aggressively)

## Prerequisites
- Understanding of resilience patterns: retry, backoff, circuit breaker, timeout, fallback
- Laravel's queue system for async retries
- Cache driver (Redis preferred) for storing circuit breaker state
- Monitoring and logging configured for tracking resilience metrics

## Inputs
- External service client implementations
- Resilience requirements (acceptable downtime, recovery time)
- Rate limits of external services
- Cache configuration for fallback data
- Error handling and logging requirements

## Workflow
1. Identify external dependencies and categorize by criticality (critical, important, optional)
2. For each dependency, implement the appropriate resilience pattern:
   - **Retry with backoff**: Use Laravel's `retry()` helper or queue retry for transient failures
   - **Circuit breaker**: Implement for services with high failure rates (see Circuit Breaker skill)
   - **Timeout**: Configure HTTP client timeouts, database query timeouts
   - **Fallback**: Provide cached data or default values when service is unavailable
   - **Rate limiting**: Use Laravel's rate limiter for outbound requests
3. Wrap service calls in try-catch blocks with appropriate fallback logic
4. Use `Http::timeout()`, `Http::retry()`, and `Http::throw()` for HTTP calls
5. For queue jobs, configure `backoff`, `retryUntil`, and `maxExceptions` properties
6. Add monitoring for resilience events (retries, circuit opens, fallbacks triggered)
7. Test each resilience pattern with fault injection

## Validation Checklist
- [ ] External HTTP calls use `Http::timeout()` with appropriate values
- [ ] Retry logic uses exponential backoff (not immediate retries)
- [ ] Circuit breaker protects services with high failure impact
- [ ] Fallback values are defined for critical external dependencies
- [ ] Queue jobs have `backoff` and `retryUntil` configured
- [ ] Rate limiting is configured for outbound API requests
- [ ] Resilience events are logged for monitoring
- [ ] Each pattern is tested with fault injection
- [ ] Graceful degradation paths are implemented (not just error pages)

## Common Failures
- Retry without backoff — immediate retries overwhelm the failing service
- Timeout too long — user waits minutes for failure response
- Fallback not implemented — circuit breaker opens but still returns errors
- Rate limiting not configured — external service throttles the application
- Retries for non-transient failures — wasting resources on permanent errors
- Not testing resilience patterns — they don't work when actually needed

## Decision Points
- Retry vs circuit breaker — retry for transient failures, circuit breaker for sustained failures
- Fallback vs error — fallback for degraded functionality, error when fallback is worse than failure
- Queue retry vs inline retry — queue for async operations, inline for short synchronous operations

## Performance Considerations
- Retries add latency — configure max retries and backoff appropriately
- Circuit breaker adds cache lookup overhead (~1-5ms)
- Fallback data from cache is fast (<5ms)
- Rate limiting adds overhead — use sliding window for accuracy, fixed window for performance
- Monitor resilience pattern metrics for performance impact

## Security Considerations
- Fallback data should not contain stale authorization decisions
- Retry logic should not retry destructive operations (charge, delete) without idempotency keys
- Rate limiting should not affect authentication or security-critical endpoints
- Circuit breaker open state should not bypass authorization checks
- Log resilience events for security audit

## Related Rules
- [Rule: Implement Exponential Backoff for Retries](./05-rules.md)
- [Rule: Always Configure Timeouts for External Calls](./05-rules.md)
- [Rule: Provide Fallback for Critical Dependencies](./05-rules.md)

## Related Skills
- Circuit Breaker Patterns
- Fault Injection Testing
- Queue Job Resilience

## Success Criteria
- [ ] All external service calls have appropriate timeouts configured
- [ ] Retry logic with backoff is implemented for transient failures
- [ ] Circuit breakers protect services with high failure impact
- [ ] Fallback values are defined and tested
- [ ] Queue jobs have proper retry and failure handling
- [ ] Resilience patterns are validated with fault injection tests
