# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Circuit breaker pattern
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No protection prevented
- [ ] Permanent open prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Wrap all synchronous cross-context calls with a circuit breaker.** Never let a downstream failure cascade to upstream callers. Without a circuit breaker, a downstream outage takes out every upstream context.
- [ ] Workflow step completed: **Implement all three circuit states.** Closed (normal operation Ã¢â‚¬â€ requests pass through). Open (fail-fast Ã¢â‚¬â€ requests rejected immediately). Half-open (recovery testing Ã¢â‚¬â€ limited requests allowed through to test recovery).
- [ ] Workflow step completed: **Always provide fallback responses.** When the circuit is open, return cached data, default values, or a degraded experience Ã¢â‚¬â€ not a hard error.
- [ ] Workflow step completed: **Monitor and alert on circuit state changes.** Log every state transition and expose circuit states via health checks. Alert operations when a circuit opens.
- [ ] Workflow step completed: **Tune thresholds per service.** Set failure threshold and timeout individually for each downstream service based on its failure characteristics. Never use a single global threshold.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: No circuit breaker.
- [ ] Failure addressed: Threshold too low.
- [ ] Failure addressed: No half-open recovery.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Circuit breakers wrap all sync cross-context calls
- [ ] Three states implemented (closed, open, half-open)
- [ ] Fallback responses provided for open circuit
- [ ] State changes are logged and monitored
- [ ] Thresholds are tuned per service

### Success Criteria
- [ ] Every synchronous call to another bounded context is wrapped in a circuit breaker.
- [ ] Circuit has closed, open, and half-open states Ã¢â‚¬â€ recovery is tested automatically.
- [ ] When the circuit is open, a fallback (cached/default/degraded) is returned, not a hard error.
- [ ] Circuit state transitions are logged and exposed via health checks.
- [ ] Each downstream service has individually tuned failure thresholds and timeouts.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No protection
- [ ] Anti-pattern prevented: Permanent open

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No circuit breaker.
- [ ] Failure scenario handled: Threshold too low.
- [ ] Failure scenario handled: No half-open recovery.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
