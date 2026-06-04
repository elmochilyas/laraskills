# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service vs. Action vs. Use Case: decision criteria
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Architecture paralysis prevented
- [ ] Pattern soup prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to Service + Action for most Laravel applications.** Services orchestrate workflows and manage transactions. Actions execute single leaf-node operations. This is the "sweet spot" for most teams. Document this choice in the project README.
- [ ] Workflow step completed: **Adopt Use Cases only when framework coupling pain exceeds abstraction cost.** Use Cases add interfaces, DTOs, and bindings. Justified when: multiple delivery mechanisms, team > 10 developers, or Clean Architecture is a stated requirement.
- [ ] Workflow step completed: **Document the team's chosen pattern explicitly.** Write an ADR or README section specifying what goes in Services, what goes in Actions, and what goes in Use Cases. Consistency is more important than the specific pattern choice.
- [ ] Workflow step completed: **Use a decision tree for placement.** Complex with multiple sub-steps Ã¢â€ â€™ Service (or Use Case if framework independence needed). Simple single operation Ã¢â€ â€™ Action. Single simple operation Ã¢â€ â€™ repository method or model method.
- [ ] Workflow step completed: **Avoid architecture paralysis.** Pick a pattern, ship code, refactor later if needed. The difference between patterns is ~50ÃŽÂ¼s per resolution Ã¢â‚¬â€ database time dominates.

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

- [ ] Failure addressed: Actions when service suffices.
- [ ] Failure addressed: Mixing patterns without rules.
- [ ] Failure addressed: Architecture paralysis.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Team's architectural pattern choice is documented
- [ ] Service + Action is default (sweet spot) unless Clean Architecture is required
- [ ] Use Cases only where framework independence is needed
- [ ] No pattern soup (inconsistent usage across features)
- [ ] Decision tree is documented for what goes where
- [ ] No architecture paralysis (patterns debated for weeks without shipping)

### Success Criteria
- [ ] Team's pattern choice is documented with clear rules for where logic goes.
- [ ] No pattern soup Ã¢â‚¬â€ all features use the same dominant pattern consistently.
- [ ] Use Cases are used only where framework independence is needed, not for simple CRUD.
- [ ] Architecture decisions are pragmatic (ship first, refactor later) not paralyzed.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Architecture paralysis
- [ ] Anti-pattern prevented: Pattern soup

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Actions when service suffices.
- [ ] Failure scenario handled: Mixing patterns without rules.
- [ ] Failure scenario handled: Architecture paralysis.

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
