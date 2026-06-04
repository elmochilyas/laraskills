# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module boundary identification: bounded context heuristics
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Wrong boundary discovered too late prevented
- [ ] Context conflation prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Facilitate an event storming workshop with domain experts and developers.** Map business events on a timeline (e.g., "Order Placed" Ã¢â€ â€™ "Payment Received" Ã¢â€ â€™ "Invoice Generated"). Group events by business capability. Natural groupings reveal bounded contexts.
- [ ] Workflow step completed: **Identify language divergence.** Find terms that mean different things in different contexts (e.g., "Customer" in Billing vs Support). Language divergence is the clearest boundary signal. Document each term with its context-specific definition.
- [ ] Workflow step completed: **Apply change-frequency analysis.** Analyze git history: do concepts change together for the same reasons? Concepts that change independently belong in different modules. Concepts that always change together belong in the same module.
- [ ] Workflow step completed: **Start with broad boundaries (3-5 modules most teams).** Begin with broad modules and split as divergence emerges. Merging modules is significantly harder than splitting them.
- [ ] Workflow step completed: **Use business domain names, not technical layer names.** Name modules by business domain (Billing, Catalog, Inventory), not by technical layer (API, Admin, Database). Technical boundaries don't align with business ownership.

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

- [ ] Failure addressed: Technical boundaries instead of business boundaries.
- [ ] Failure addressed: Database-driven boundaries.
- [ ] Failure addressed: Too fine-grained from start.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Module boundaries are based on business domains, not technical layers
- [ ] Language divergence between modules is documented
- [ ] Event storming was conducted with domain experts
- [ ] Change-frequency analysis supports boundary decisions
- [ ] Module count is appropriate for team size (3-5 for teams of 3-5)
- [ ] Boundary rationale is documented in an ADR
- [ ] Start broad, split later principle is followed

### Success Criteria
- [ ] Module boundaries are based on business domains and language divergence.
- [ ] Each boundary has documented rationale in an ADR.
- [ ] Module count is proportional to team size.
- [ ] Event storming or equivalent discovery method was used with domain experts.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Wrong boundary discovered too late
- [ ] Anti-pattern prevented: Context conflation

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Technical boundaries instead of business boundaries.
- [ ] Failure scenario handled: Database-driven boundaries.
- [ ] Failure scenario handled: Too fine-grained from start.

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
