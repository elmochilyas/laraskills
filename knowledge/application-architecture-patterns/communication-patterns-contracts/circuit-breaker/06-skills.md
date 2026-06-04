# Skill: Implement Circuit Breaker for Synchronous Cross-Context Calls

## Purpose
Wrap all synchronous cross-context calls with a circuit breaker (closed/open/half-open states). Provide fallback responses when the circuit is open. Monitor and alert on state changes. Tune failure thresholds per downstream service.

## When To Use
- Synchronous cross-context calls where the downstream service could be unavailable
- Protecting the system from cascading failures

## When NOT To Use
- Asynchronous message passing (queue provides resilience)
- Local in-method calls (no network boundary)
- Calls within the same process where timeout is sufficient

## Prerequisites
- Sync vs queued events understanding (CPC-03)
- Cross-context queries identified (DBC-07)

## Inputs
- Downstream service endpoints
- Failure tolerance requirements per service

## Workflow
1. **Wrap all synchronous cross-context calls with a circuit breaker.** Never let a downstream failure cascade to upstream callers. Without a circuit breaker, a downstream outage takes out every upstream context.

2. **Implement all three circuit states.** Closed (normal operation — requests pass through). Open (fail-fast — requests rejected immediately). Half-open (recovery testing — limited requests allowed through to test recovery).

3. **Always provide fallback responses.** When the circuit is open, return cached data, default values, or a degraded experience — not a hard error.

4. **Monitor and alert on circuit state changes.** Log every state transition and expose circuit states via health checks. Alert operations when a circuit opens.

5. **Tune thresholds per service.** Set failure threshold and timeout individually for each downstream service based on its failure characteristics. Never use a single global threshold.

## Validation Checklist
- [ ] Circuit breakers wrap all sync cross-context calls
- [ ] Three states implemented (closed, open, half-open)
- [ ] Fallback responses provided for open circuit
- [ ] State changes are logged and monitored
- [ ] Thresholds are tuned per service

## Common Failures
- **No circuit breaker.** Cross-context calls fail — every request waits for full timeout, cascading failures.
- **Threshold too low.** Transient failure spike trips circuit unnecessarily.
- **No half-open recovery.** Circuit opens but never tests for recovery — effectively permanent outage.

## Decision Points
- **Circuit breaker vs queue?** Sync cross-context calls: circuit breaker. Async: queue provides resilience.
- **Fallback with cached data vs error?** Prefer degraded but functional over hard error.

## Performance Considerations
- Circuit breakers add negligible overhead when healthy (state check per call).
- When open, saves timeouts (seconds per call).
- Half-open: limited test calls to check recovery.

## Security Considerations
- Circuit breaker does not bypass security. Fallback responses should still respect authorization.

## Related Rules
- Rule: Wrap all synchronous cross-context calls with a circuit breaker (CPC-06/05-rules.md)
- Rule: Implement all three circuit states (CPC-06/05-rules.md)
- Rule: Always provide fallback responses (CPC-06/05-rules.md)
- Rule: Monitor and alert on circuit state changes (CPC-06/05-rules.md)
- Rule: Tune thresholds per service (CPC-06/05-rules.md)

## Related Skills
- Choose Sync vs Queued Events (CPC-03/06-skills.md)
- Implement Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Implement Message Bus (CPC-05/06-skills.md)
- Enforce Timeout and Retry Strategies (AEG-04/06-skills.md)

## Success Criteria
- Every synchronous call to another bounded context is wrapped in a circuit breaker.
- Circuit has closed, open, and half-open states — recovery is tested automatically.
- When the circuit is open, a fallback (cached/default/degraded) is returned, not a hard error.
- Circuit state transitions are logged and exposed via health checks.
- Each downstream service has individually tuned failure thresholds and timeouts.
