# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Team-to-context mapping: Conway's Law in practice
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Context shared across teams prevented
- [ ] Orphaned context prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Assign exactly one owning team per bounded context.** No context is shared across multiple teams. Shared contexts require cross-team coordination for every change.
- [ ] Workflow step completed: **Use CODEOWNERS to enforce context ownership at the code level.** Specify which team owns which directory. PRs touching a context require that team's approval.
- [ ] Workflow step completed: **Require cross-team contract review for interface changes.** Changes to a context's public contracts (interfaces, events, DTOs) must be reviewed by all consuming teams.
- [ ] Workflow step completed: **Limit one team to owning no more than 2-3 contexts.** A small team owning 5+ contexts cannot maintain them all. Contexts degrade from neglect.
- [ ] Workflow step completed: **Match the number of contexts roughly to the number of teams.** Fewer contexts than teams means some teams lack clear ownership. More contexts than teams means some teams own too many.

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

- [ ] Failure addressed: Misaligned team/context boundaries.
- [ ] Failure addressed: Context without an owner.
- [ ] Failure addressed: Team owns too many contexts.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each context has exactly one owning team
- [ ] No context is shared across teams
- [ ] No context is orphaned (no owner)
- [ ] No team owns more than 3 contexts
- [ ] Team-to-context mapping is documented
- [ ] CODEOWNERS enforces context ownership
- [ ] Cross-team contract review is required for interface changes
- [ ] Security accountability is defined per owning team

### Success Criteria
- [ ] Every bounded context is assigned to exactly one team with documented ownership.
- [ ] CODEOWNERS file enforces team ownership at the code level.
- [ ] Team-to-context mapping matrix is documented in the repository.
- [ ] No context is orphaned or shared across multiple teams.
- [ ] Each team owns at most 3 contexts and is accountable for security within those contexts.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Context shared across teams
- [ ] Anti-pattern prevented: Orphaned context

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Misaligned team/context boundaries.
- [ ] Failure scenario handled: Context without an owner.
- [ ] Failure scenario handled: Team owns too many contexts.

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
