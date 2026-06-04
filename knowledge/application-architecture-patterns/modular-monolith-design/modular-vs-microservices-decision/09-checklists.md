# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Modular monolith vs. microservices decision framework
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed monolith prevented
- [ ] Premature microservices prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to modular monolith for teams under 30 engineers.** The modular monolith is a valid end-state architecture, not a temporary state. It provides domain isolation without distribution costs.
- [ ] Workflow step completed: **Assess organizational structure using Conway's Law.** If your team structure is one team that communicates frequently, use one deployment (modular monolith). If you have multiple independent teams, consider multiple deployments.
- [ ] Workflow step completed: **Assess the cost of distribution before adopting microservices.** Calculate expected cost: 3-5x operational complexity, 2-3x latency, 2x CI infrastructure, 3x monitoring surface area. Ensure business benefit exceeds this cost.
- [ ] Workflow step completed: **Track module-level resource usage before considering extraction.** Monitor CPU, memory, query volume per module. Only consider extraction when a module's resource profile diverges significantly from the rest.
- [ ] Workflow step completed: **Avoid the distributed monolith anti-pattern.** Never create microservices that share a database or have synchronous call chains creating deployment coupling. Each service must own its data.

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

- [ ] Failure addressed: Microservices for "future-proofing."
- [ ] Failure addressed: Microservices for "scalability."
- [ ] Failure addressed: Modular monolith as temporary state.
- [ ] Failure addressed: Distributed monolith.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Team size informs the architecture decision (<30 = modular monolith, >50 = consider microservices)
- [ ] Conway's Law was considered (organizational structure matches software structure)
- [ ] Cost of distribution was assessed before microservices decision
- [ ] Module resource usage is monitored (for extraction decisions)
- [ ] Distributed monolith anti-pattern is avoided
- [ ] Modular monolith is treated as a valid end-state, not temporary
- [ ] Architecture decision is documented in an ADR with specific rationale

### Success Criteria
- [ ] Architecture decision (modular monolith or microservices) is documented in an ADR with specific, measurable rationale.
- [ ] Team size and organizational structure inform the decision.
- [ ] Cost of distribution was assessed before choosing microservices.
- [ ] The modular monolith is treated as a valid end-state architecture.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed monolith
- [ ] Anti-pattern prevented: Premature microservices

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Microservices for "future-proofing."
- [ ] Failure scenario handled: Microservices for "scalability."
- [ ] Failure scenario handled: Modular monolith as temporary state.

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
