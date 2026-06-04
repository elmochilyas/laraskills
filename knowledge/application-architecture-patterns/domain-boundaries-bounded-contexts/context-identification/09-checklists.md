# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Bounded context identification: language, teams, data
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Database-driven boundaries: prevented
- [ ] Team-structure-only boundaries: prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use language divergence as the primary signal.** If two parts of the business use "Order" differently, they should be separate contexts. Gather business nouns, list meanings per usage, group by meaning (not word).
- [ ] Workflow step completed: **Start coarse, split later.** Default to broader contexts (3-5 for most applications). It's easier and safer to split a large context than to merge two that shouldn't have been separated.
- [ ] Workflow step completed: **Validate context boundaries with business stakeholders.** Ask domain terminology questions: "Does 'Customer' mean the same thing here?" before coding.
- [ ] Workflow step completed: **Use facilitated workshops.** Conduct Event Storming, Domain Storytelling, or Data Ownership Matrix workshops with both technical and business participants.
- [ ] Workflow step completed: **Distinguish between owned and referenced models in each context.** Classify each concept as owned (context creates/updates/deletes) or referenced (context reads by ID from another context).

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

- [ ] Failure addressed: Database-driven boundaries.
- [ ] Failure addressed: Too many contexts.
- [ ] Failure addressed: No validation with stakeholders.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Context boundaries identified using language, teams, data signals
- [ ] Boundaries validated with business stakeholders
- [ ] Not driven by database structure
- [ ] Coarse boundaries (can split later if needed)
- [ ] Context map documents relationships
- [ ] Owned vs referenced models classified per context
- [ ] Each context mapped to dedicated namespace in codebase

### Success Criteria
- [ ] Bounded contexts are identified using business language divergence as the primary signal.
- [ ] Context boundaries are validated with business stakeholders before implementation.
- [ ] Each context maps to a dedicated namespace in the codebase.
- [ ] Owned vs referenced models are explicitly classified per context.
- [ ] Boundaries are coarse (fewer than 5 for typical applications) with documented rationale.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Database-driven boundaries:
- [ ] Anti-pattern prevented: Team-structure-only boundaries:
- [ ] Anti-pattern prevented: Too many contexts:

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Database-driven boundaries.
- [ ] Failure scenario handled: Too many contexts.
- [ ] Failure scenario handled: No validation with stakeholders.

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
