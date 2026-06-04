# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Onboarding documentation for architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Sink-or-swim onboarding prevented
- [ ] Outdated onboarding prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Keep the onboarding doc at 5-10 pages.** Structure it as a guided tour, not a reference manual. A new developer should be able to read it in one sitting.
- [ ] Workflow step completed: **Include a bounded context map as the first section.** Show each context, its responsibilities, and its allowed dependencies. The context map answers: "What are the parts and how do they relate?"
- [ ] Workflow step completed: **Use example-first documentation for each pattern.** Demonstrate every pattern with a before/after code example. Developers learn by seeing real code transformations.
- [ ] Workflow step completed: **Provide a step-by-step onboarding checklist.** Sequential steps mapping to documents to read or tasks to perform. Prevents the developer from missing critical information.
- [ ] Workflow step completed: **Gate onboarding completion on passing architecture tests.** Require the developer to write code that passes all architecture tests. Objective proof of architectural understanding.

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

- [ ] Failure addressed: No onboarding doc.
- [ ] Failure addressed: Outdated onboarding doc.
- [ ] Failure addressed: Onboarding doc as fire hose.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Onboarding doc exists in the repository
- [ ] Doc includes bounded context map
- [ ] Doc includes dependency direction rules
- [ ] Doc includes pattern reference with examples
- [ ] Doc is 5-10 pages (guided tour, not reference manual)
- [ ] Doc is updated when architecture changes
- [ ] Onboarding process is gated by passing architecture tests
- [ ] Doc includes security patterns

### Success Criteria
- [ ] A 5-10 page onboarding doc exists in the repository Ã¢â‚¬â€ readable in one sitting.
- [ ] The doc starts with a bounded context map showing all contexts and their dependency relationships.
- [ ] Each architectural pattern is demonstrated with before/after code examples.
- [ ] A step-by-step onboarding checklist guides the developer through the learning process.
- [ ] Onboarding completion requires the developer to submit code that passes all architecture tests.
- [ ] The doc is updated whenever the architecture changes (new contexts, changed rules, new patterns).
- [ ] Security patterns and enforcement points are explicitly documented.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Sink-or-swim onboarding
- [ ] Anti-pattern prevented: Outdated onboarding

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No onboarding doc.
- [ ] Failure scenario handled: Outdated onboarding doc.
- [ ] Failure scenario handled: Onboarding doc as fire hose.

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
