# Skill: Inject Faults in Laravel Tests

## Purpose
Use fault injection techniques in Laravel tests to verify that the application handles service failures gracefully — timeouts, exceptions, connection errors — by overriding service bindings and mocking failure conditions.

## When To Use
- When testing that the application handles external API failures
- When testing database connection failures and connection pool exhaustion
- When testing queue job failures and retry logic
- When testing cache service unavailability
- When verifying that circuit breakers, retries, and fallbacks work correctly
- When testing graceful degradation paths

## When NOT To Use
- For testing behavior under normal conditions (use regular feature tests)
- When fault injection would make the test non-deterministic
- When the service failure scenario is better tested with integration tests
- When mocking the fault hides real failure behavior (e.g., catching a different exception type)

## Prerequisites
- Understanding of the service being fault-tested (what failures are possible)
- Knowledge of Laravel's service container and binding overrides
- Knowledge of the resilience patterns in place (retries, circuit breakers, fallbacks)
- Test environment that can simulate the fault conditions

## Inputs
- Service to fault (HTTP client, database, cache, queue, filesystem)
- Fault type to inject (timeout, exception, connection error, latency)
- Expected system response to the fault (fallback, retry, error message, degraded mode)
- Service container binding to override for fault injection

## Workflow
1. Identify the service and fault scenario to test
2. For HTTP faults: use `Http::fake()` with error responses (500, timeout, connection error)
3. For database faults: configure a failing database connection in the test's database config
4. For cache faults: temporarily swap the cache driver with a failing one using container binding
5. For queue faults: dispatch a job and simulate failure in the `failed()` method
6. For service binding faults: bind a mock that throws exceptions for specific scenarios
7. Execute the action that should trigger the fault
8. Assert the application responds correctly: fallback value returned, error logged, user sees friendly message
9. Verify that the failure doesn't cascade to unrelated functionality
10. Test recovery when the fault is resolved

## Validation Checklist
- [ ] Each external service dependency has fault injection tests
- [ ] HTTP client faults test: timeout, 500, 429, connection refused
- [ ] Database faults test: connection failure, query timeout
- [ ] Cache faults test: store failure, retrieve failure
- [ ] Queue faults test: job failure, max attempts exceeded
- [ ] Resilience patterns (retries, fallbacks, circuit breakers) are verified
- [ ] Fault injection doesn't leave the system in an inconsistent state
- [ ] User-facing error messages are tested for each fault scenario

## Common Failures
- Not testing fault recovery — only testing the failure path
- Injected exceptions don't match real service exceptions — false confidence
- Fault injection bypasses resilience patterns — testing without the protection
- Not verifying that fallback values are returned correctly
- Testing too few fault types — only testing timeout, not 500 or connection refused
- Fault injection that affects other tests — service container state leaks

## Decision Points
- Exception vs timeout — exception for immediate failure, timeout for slow degradation
- Service container mock vs `Http::fake()` — container mock for service-level, Http::fake for HTTP-specific
- Feature test vs unit test — feature for full-stack fault handling, unit for isolated business logic

## Performance Considerations
- Fault injection tests are typically fast (<100ms)
- Simulated timeouts use short timeouts (<1s) to keep tests fast
- Cache and database fault simulations add minimal overhead
- Avoid testing very long timeouts in test suites (use microseconds)

## Security Considerations
- Fault injection should not bypass authentication or authorization
- Ensure error messages in fault scenarios don't leak sensitive information
- Test that security-critical operations (refunds, deletions) are rolled back on failure
- Verify that audit logs capture fault conditions correctly
- Test that rate limiting and throttling work under fault conditions

## Related Rules
- [Rule: Test Every External Service Fault Scenario](./05-rules.md)
- [Rule: Verify Fallback Behavior in Fault Tests](./05-rules.md)
- [Rule: Test Fault Recovery, Not Just Failure](./05-rules.md)

## Related Skills
- Chaos Engineering Experiments
- Circuit Breaker Patterns
- HTTP Client Faking

## Success Criteria
- [ ] Each external service dependency has fault injection tests
- [ ] Timeout, 500, and connection failure scenarios are tested
- [ ] Resilience patterns are verified with injected faults
- [ ] Fallback behavior is tested and returns expected values
- [ ] Fault tests are deterministic and pass consistently
