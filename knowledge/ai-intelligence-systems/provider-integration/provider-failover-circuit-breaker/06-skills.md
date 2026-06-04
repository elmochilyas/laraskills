# Skill: Implement Provider Failover and Circuit Breaker

## Purpose
Ensure AI availability by automatically switching between providers when the primary is degraded, with circuit breaker patterns to fail fast and allow recovery.

## When To Use
- Production systems making HTTP calls to LLM providers
- Multi-provider systems where fallback is an option
- Applications with uptime requirements (>99% availability)
- Systems that process user requests synchronously

## When NOT To Use
- Batch/async processing where failed requests can be retried manually
- Development environments where immediate failure is preferred for debugging

## Prerequisites
- Multiple provider drivers configured in `config/ai.php`
- Provider API keys for all providers in the failover chain
- Understanding of failover chains and circuit breaker patterns

## Inputs
- Ordered list of providers with models
- Feature parity requirements across providers
- Failure thresholds for circuit breaker

## Workflow
1. Configure a failover chain in `config/ai.php` with at least 2 providers
2. Verify feature parity across all providers in the chain (tool calling, structured output, streaming)
3. Implement or use a circuit breaker that opens after N consecutive failures
4. Classify every error as retryable or non-retryable
5. Use exponential backoff with jitter for retry delays
6. Implement retry as a decorator wrapping the provider adapter, not inside it
7. Log and alert on every failover activation
8. Monitor failover rate per provider over time
9. Test failover paths in staging by simulating provider failures

## Validation Checklist
- [ ] Failover chain configured with at least 2 providers
- [ ] Feature parity verified across all failover providers
- [ ] Retryable vs non-retryable errors classified
- [ ] Exponential backoff with jitter implemented
- [ ] Circuit breaker wraps provider calls with configurable thresholds
- [ ] Retry logic implemented as decorator, not inside adapter
- [ ] Failover activations logged and alerted
- [ ] Failover paths tested in staging

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| All traffic to single provider | No failover chain | Configure min 2 providers in chain |
| Failover breaks features | Feature mismatch | Verify capability parity across providers |
| Retries on doomed requests | No error classification | Classify retryable vs non-retryable |
| Thundering herd on retry | Fixed-interval retries | Use exponential backoff with jitter |
| Retry logic duplicated | Inside adapter | Extract to RetryDecorator |
| Failover never tested | Staging gap | Simulate provider failures in staging |

## Decision Points
- **Failover order:** Primary (capable) → fallback (cheaper) → last resort (any)
- **Circuit breaker threshold:** N failures in M minutes
- **Cooldown period:** 30 seconds for transient issues, 5 minutes for outages
- **Retry count:** 3 for user-facing, 5+ for background jobs

## Performance/Security Considerations
- Circuit breaker prevents cascading failures by failing fast on degraded providers
- Monitor failover rate to detect provider degradation early
- Retry decorator keeps adapter focused on provider-specific logic
- Log failover events with provider name and error detail for audit

## Related Rules
- provider-failover-circuit-breaker/05-rules.md (all rules)

## Related Skills
- Generate Text with Multiple AI Providers
- Handle Provider Errors and Retries
- Configure Provider Timeouts and Retry Strategies

## Success Criteria
- Failover activates automatically when primary provider fails
- Circuit breaker opens after configurable threshold, fails fast during cooldown
- All failover paths are tested in staging
- Failover activations are logged and alerted
- Retry logic uses exponential backoff with jitter, not fixed intervals
