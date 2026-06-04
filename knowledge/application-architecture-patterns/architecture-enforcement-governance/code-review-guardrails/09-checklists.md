# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Code review guardrails for architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No human review prevented
- [ ] Checklist fatigue prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Automate every enforceable rule before relying on code review.** If a rule can be automated (test, static analysis), automate it. Reserve code review for non-automatable concerns Ã¢â‚¬â€ design quality, abstraction level, consistency.
- [ ] Workflow step completed: **Apply architecture-first review order.** Evaluate architectural impact before reading implementation details. If the architecture is wrong, reject the PR early. Architecture-first: 2 min title/description, 3 min file-structure diff, 5 min architectural impact, then implementation.
- [ ] Workflow step completed: **Use architecture checklists per change type in PR templates.** Include targeted checklist sections in PR templates for new module, cross-context change, refactoring, and bug fix. Different change types need different checks.
- [ ] Workflow step completed: **Document architecture decisions from code review as ADRs.** When a review results in an architectural decision, document the outcome as an ADR. Prevents recurring debates about the same decision.
- [ ] Workflow step completed: **Define an escalation path for uncertain architectural violations.** When a reviewer identifies a potential violation but is uncertain, there is a documented path: tag PR, add senior reviewer, escalate to architecture lead if needed.

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

- [ ] Failure addressed: No architecture checklist.
- [ ] Failure addressed: Architecture review after implementation.
- [ ] Failure addressed: Relying solely on automated enforcement.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Architecture checklist exists per change type
- [ ] Reviewers apply architecture-first approach
- [ ] Escalation path defined for uncertain violations
- [ ] Architecture decisions from review documented as ADRs
- [ ] PR templates include architecture checklist sections
- [ ] Checklist includes security architecture items
- [ ] Checklist limited to 5-10 high-impact items

### Success Criteria
- [ ] All automatable architectural rules are enforced by tests Ã¢â‚¬â€ code review handles only non-automatable concerns.
- [ ] Reviewers always evaluate architectural impact before reading implementation details.
- [ ] PR templates have targeted architecture checklists for each change type (new module, cross-context, refactoring).
- [ ] Architectural decisions from reviews are captured as ADRs within the same PR.
- [ ] Reviewers have a documented escalation path for uncertain violations.
- [ ] Security items are included in the architecture review checklist.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No human review
- [ ] Anti-pattern prevented: Checklist fatigue

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No architecture checklist.
- [ ] Failure scenario handled: Architecture review after implementation.
- [ ] Failure scenario handled: Relying solely on automated enforcement.

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
