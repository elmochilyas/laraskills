# Skill: Implement Circuit Breaker Pattern for API Calls

## Purpose
Implement the circuit breaker pattern to detect upstream API failures and prevent cascading failures, with three states: Closed (normal), Open (failing), Half-Open (testing recovery).

## When To Use
- External API calls prone to intermittent failures
- Preventing resource exhaustion during upstream outages
- Fast-failing when upstream is unavailable
- Protecting downstream services from overload during recovery

## When NOT To Use
- Internal/local service calls (not needed)
- Failures that are always transient and fast to resolve
- When retry-only suffices (no cascading failure risk)

## Prerequisites
- Circuit breaker library (custom or package)
- External API calls with failure detection

## Workflow
1. Define failure threshold (e.g., 5 consecutive failures)
2. Define success threshold (e.g., 3 consecutive successes in half-open)
3. Define open timeout (e.g., 30 seconds before half-open)
4. Track failure count per circuit (API endpoint or service)
5. Open circuit when threshold exceeded → fast-fail all requests
6. After timeout, transition to half-open (allow probe requests)
7. Close circuit on successful probe requests
8. Log all circuit state transitions for monitoring

## Validation Checklist
- [ ] Failure threshold configured
- [ ] Open timeout configured
- [ ] Circuit transitions logged (Closed → Open → Half-Open → Closed)
- [ ] Open state fast-fails all requests
- [ ] Half-open state limits probe requests
- [ ] Probe success closes circuit
- [ ] State transitions monitored and alerted
