# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** When to deviate from defaults: decision criteria
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Start with Defaults Ã¢â‚¬â€ Never Deviate Without Measured Pain followed
- [ ] Document Every Deviation with an Architecture Decision Record followed
- [ ] Apply the Six-Month Rule for New Projects followed
- [ ] Architecture Fashion-Following prevented
- [ ] Pre-Emptive Abstraction prevented

---

# Architecture Checklist

- [ ] Start with Defaults Ã¢â‚¬â€ Never Deviate Without Measured Pain followed
- [ ] Document Every Deviation with an Architecture Decision Record followed
- [ ] Apply the Six-Month Rule for New Projects followed
- [ ] Deviate One Level at a Time Ã¢â‚¬â€ No Leapfrogging followed
- [ ] Never Deviate Without Automated Enforcement followed

---

# Implementation Checklist

- [ ] Start with Defaults Ã¢â‚¬â€ Never Deviate Without Measured Pain followed
- [ ] Document Every Deviation with an Architecture Decision Record followed
- [ ] Apply the Six-Month Rule for New Projects followed
- [ ] Deviate One Level at a Time Ã¢â‚¬â€ No Leapfrogging followed
- [ ] Never Deviate Without Automated Enforcement followed
- [ ] Evaluate Deviations Against Five Questions followed
- [ ] Reject Repository Pattern for All-Model Single-DataSource Projects followed
- [ ] Reject Interface-Per-Service When Only One Implementation Exists followed
- [ ] Workflow step completed: **Identify specific, measurable friction.** Name concrete problems: "15 minutes tracing 6 files to understand checkout" or "5 merge conflicts per week in `routes/web.php`." Vague problems like "hard to find code" are not sufficient.
- [ ] Workflow step completed: **Evaluate against five questions.** Before adopting any deviation:
- [ ] Workflow step completed: **Apply the six-month rule for new projects.** Wait at least six months before making significant structural deviations. Domain boundaries, team structure, and architectural needs reveal themselves organically.
- [ ] Workflow step completed: **Deviate one level at a time.** Progress incrementally: defaults Ã¢â€ â€™ add subdirectories Ã¢â€ â€™ hybrid Ã¢â€ â€™ domain-based Ã¢â€ â€™ modules. Never skip directly to the most complex structure.
- [ ] Workflow step completed: **Ensure enforcement capability.** Before implementing any deviation, confirm you can enforce it via architecture tests or static analysis. A new structure without enforcement degrades within months.

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

- [ ] Failure addressed: Pre-emptive architecture:
- [ ] Failure addressed: Deviation without enforcement:
- [ ] Failure addressed: Following trends:
- [ ] Failure addressed: Half-migration:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All deviations from defaults are documented with ADRs
- [ ] Each deviation can be traced to a specific, measurable pain point
- [ ] Half-migration situations are identified and being resolved
- [ ] Deviations are enforced via architecture tests or static analysis
- [ ] Team can articulate why structure exists without referencing "that's how it was set up"
- [ ] The five-question evaluation was applied before each deviation

### Success Criteria
- [ ] All structural deviations are documented and justified by specific pain points.
- [ ] No deviation exists without automated enforcement.
- [ ] Team can explain the rationale for every architectural choice.
- [ ] Less invasive options were considered and rejected before adopting current structure.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Start with Defaults Ã¢â‚¬â€ Never Deviate Without Measured Pain followed
- [ ] Document Every Deviation with an Architecture Decision Record followed
- [ ] Apply the Six-Month Rule for New Projects followed
- [ ] Deviate One Level at a Time Ã¢â‚¬â€ No Leapfrogging followed
- [ ] Never Deviate Without Automated Enforcement followed
- [ ] Evaluate Deviations Against Five Questions followed
- [ ] Reject Repository Pattern for All-Model Single-DataSource Projects followed
- [ ] Reject Interface-Per-Service When Only One Implementation Exists followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Architecture Fashion-Following
- [ ] Anti-pattern prevented: Pre-Emptive Abstraction
- [ ] Anti-pattern prevented: Half-Migration
- [ ] Anti-pattern prevented: Deviation Without Enforcement

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Pre-emptive architecture:
- [ ] Failure scenario handled: Deviation without enforcement:
- [ ] Failure scenario handled: Following trends:

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
