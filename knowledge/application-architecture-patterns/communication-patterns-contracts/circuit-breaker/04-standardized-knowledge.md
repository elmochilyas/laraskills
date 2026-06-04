# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Circuit breaker pattern
Knowledge Unit ID: CPC-06
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

A circuit breaker prevents cascading failures when a downstream service is unavailable. It monitors for failures. When failures cross a threshold, the circuit "opens" and subsequent calls fail immediately without attempting the actual request. After a timeout, the circuit enters "half-open" state to test if the downstream service has recovered. If the test call succeeds, the circuit closes. If it fails, the circuit reopens. In a modular monolith, circuit breakers protect cross-context synchronous calls.

---

# Core Concepts

- **Closed state:** Normal operation. Requests pass through to the downstream service. Failures are counted.
- **Open state:** Requests are rejected immediately (fail fast). No calls to the downstream service are attempted. A timer runs.
- **Half-open state:** After the timer expires, a limited number of test requests are allowed through. If they succeed, the circuit closes. If they fail, the circuit reopens.
- **Fail-fast:** When the circuit is open, fail the request immediately rather than waiting for a timeout. The upstream service knows the downstream is unavailable.

---

# When To Use

- Synchronous cross-context calls where the downstream service could be unavailable.
- Protecting the system from cascading failures.

---

# When NOT To Use

- Asynchronous message passing (already resilient via queues).
- Local in-method calls (no network boundary).
- Calls within the same process where timeout is sufficient.

---

# Best Practices

- **Use circuit breakers for sync cross-context calls.** WHY: If Context A calls Context B synchronously and B goes down, every request to A waits for a timeout. The system degrades catastrophically. The circuit breaker fails fast.
- **Provide fallback responses.** WHY: When the circuit is open, return a cached or default response instead of failing. The user gets degraded but functional service.
- **Monitor circuit state changes.** WHY: Log circuit state changes and expose via health check for alerting. The operations team needs to know when a circuit opens.
- **Tune threshold per service.** WHY: A transient spike in failures trips the circuit if threshold is too low. Set threshold based on each service's failure characteristics.

---

# Architecture Guidelines

- Circuit breaker wraps calls to downstream services.
- Three states: closed (normal), open (fail fast), half-open (testing).
- Fallback: cached or default response when circuit is open.
- State monitoring: log and alert on state changes.

---

# Performance Considerations

- Circuit breakers add negligible overhead when healthy (state check per call).
- When open, saves timeouts (seconds per call).
- Half-open: limited test calls to check recovery.

---

# Security Considerations

- Circuit breaker does not bypass security. Fallback responses should still respect authorization.

---

# Common Mistakes

1. **No circuit breaker:** All cross-context calls fail when one context goes down. Cause: oversight. Consequence: every request waits for full timeout; system degrades catastrophically. Better: implement circuit breakers for all sync cross-context calls.

2. **Threshold too low:** A transient spike in failures trips the circuit. Cause: not tuning thresholds. Consequence: normal operation disrupted unnecessarily. Better: set threshold based on observed failure patterns.

3. **No half-open recovery:** The circuit opens but never tests for recovery. Cause: implementation bug. Consequence: the service is effectively down permanently. Better: implement half-open state with timed recovery tests.

---

# Anti-Patterns

- **No protection**: No circuit breaker for any cross-context sync call. Fragile system.
- **Permanent open**: Circuit opens but never recovers. Manual intervention required.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-03 Sync vs queued events | CPC-07 Bridge/adapter pattern | AEG-05 Circuit breaker testing |
| DBC-07 Cross-context queries | CPC-05 Message bus | AEG-04 Timeout and retry strategies |

---

# AI Agent Notes

- Implement circuit breakers for all sync cross-context calls.
- Provide fallback responses when circuit is open.
- Monitor circuit state for operations visibility.
- Tune threshold and timeout per service characteristics.

---

# Verification

- [ ] Circuit breakers wrap all sync cross-context calls
- [ ] Three states implemented (closed, open, half-open)
- [ ] Fallback responses provided for open circuit
- [ ] State changes are logged and monitored
- [ ] Thresholds are tuned per service
