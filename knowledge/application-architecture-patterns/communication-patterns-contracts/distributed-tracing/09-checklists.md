# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Distributed tracing across contexts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Broken chain prevented
- [ ] No trace at all prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Assign a correlation ID at every entry point.** Every external entry point (HTTP request, queue message, CLI command) gets a correlation ID. Use middleware for HTTP, job middleware for queues.
- [ ] Workflow step completed: **Propagate correlation ID on every boundary crossing.** Every context boundary, message bus call, or queue push must propagate the correlation ID. Breaking the propagation chain loses the trace.
- [ ] Workflow step completed: **Automate propagation Ã¢â‚¬â€ never rely on manual passing.** Use automatic mechanisms like job middleware, event subscribers, or bus middleware. Manual propagation depends on developer discipline and leads to gaps.
- [ ] Workflow step completed: **Use structured logging with correlation ID.** Include the correlation ID in every log entry via `Log::withContext()`. Never use string interpolation Ã¢â‚¬â€ structured logging enables filtering and aggregation.
- [ ] Workflow step completed: **Include causation ID for building causal chains.** Include both correlation ID (original operation) and causation ID (immediate parent event). Causation ID builds the causal chain showing which event triggered which.

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

- [ ] Failure addressed: No propagation.
- [ ] Failure addressed: Manual propagation everywhere.
- [ ] Failure addressed: No structured logging.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Correlation ID assigned at all entry points
- [ ] Correlation ID propagated through events/jobs/boundaries
- [ ] Propagation is automated (middleware/subscribers, not manual)
- [ ] Structured logging includes correlation ID
- [ ] Causation ID included for causal chain building
- [ ] Sampling applied for high-traffic systems

### Success Criteria
- [ ] Every entry point (HTTP, queue, CLI) automatically generates or receives a correlation ID.
- [ ] Correlation ID propagates across all event, job, and HTTP boundaries without manual developer intervention.
- [ ] All log entries include a structured `correlation_id` field via `Log::withContext()`.
- [ ] Event envelopes include both correlation ID (trace) and causation ID (causal chain).
- [ ] High-traffic systems use sampling to control trace storage costs.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Broken chain
- [ ] Anti-pattern prevented: No trace at all

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No propagation.
- [ ] Failure scenario handled: Manual propagation everywhere.
- [ ] Failure scenario handled: No structured logging.

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
