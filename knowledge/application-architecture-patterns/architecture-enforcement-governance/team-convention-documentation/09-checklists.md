# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Team convention documentation
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Tribal knowledge prevented
- [ ] Paper tiger prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Maintain a single convention doc per project at `docs/conventions.md`.** A single document is easy to find and maintain. All conventions Ã¢â‚¬â€ code style, architecture, testing Ã¢â‚¬â€ in one file with clear section headers.
- [ ] Workflow step completed: **Link each convention section to architecture tests.** For every enforceable convention, include a link to the corresponding architecure test. A convention without a test is aspirational at best.
- [ ] Workflow step completed: **Update conventions via pull request with team review.** Convention changes are team agreements. A PR ensures the change is reviewed, discussed, and deliberately approved.
- [ ] Workflow step completed: **Review conventions quarterly.** Schedule a quarterly review to remove outdated entries, add new patterns, and update sections that no longer match the codebase.
- [ ] Workflow step completed: **Reference conventions in code review comments.** When leaving a review comment about a convention, link to the specific section of `docs/conventions.md`. Educates the developer and reinforces the standard.

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

- [ ] Failure addressed: No convention doc.
- [ ] Failure addressed: Convention doc too long.
- [ ] Failure addressed: Outdated conventions.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] `docs/conventions.md` exists and is referenced
- [ ] Convention sections map to architecture tests
- [ ] Conventions are updated via PR
- [ ] Quarterly review is scheduled
- [ ] Code review comments link to convention sections
- [ ] Security practices are documented
- [ ] One convention per section, concise

### Success Criteria
- [ ] A single `docs/conventions.md` exists and is the authoritative reference for all team conventions.
- [ ] Every enforceable convention section links to a corresponding architecture test.
- [ ] Convention changes go through PR review Ã¢â‚¬â€ no direct edits to main branch.
- [ ] Quarterly reviews keep the document current with the codebase.
- [ ] Code review comments reference specific convention sections with links.
- [ ] Security practices are explicitly documented in the conventions.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Tribal knowledge
- [ ] Anti-pattern prevented: Paper tiger

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No convention doc.
- [ ] Failure scenario handled: Convention doc too long.
- [ ] Failure scenario handled: Outdated conventions.

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
