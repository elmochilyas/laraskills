# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Architecture testing (Pest tests for architecture rules)
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Paper architecture prevented
- [ ] False security prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Encode every architectural rule as an automated Pest architecture test.** Documentation-only rules are never read. Automated tests catch violations on every CI run.
- [ ] Workflow step completed: **Run architecture tests on every PR as a pre-merge gate.** Configure CI to block merges on architecture test failures. The only way to merge a violation is to change the rule.
- [ ] Workflow step completed: **Define all architecture tests in `tests/Architecture/`.** A single directory makes rules visible to the entire team. Anyone can open the directory to understand the architectural constraints.
- [ ] Workflow step completed: **Enforce dependency direction between layers.** Controllers may call Services, Services may call Repositories. Never allow reverse dependencies. Enforce with `->not->toUse()`.
- [ ] Workflow step completed: **Enforce bounded context isolation.** Code in one context must not import from another context unless explicitly allowed by the dependency map.

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

- [ ] Failure addressed: No architecture tests.
- [ ] Failure addressed: Rules too strict.
- [ ] Failure addressed: Rules not run in CI.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Architecture tests exist for dependency direction rules
- [ ] Architecture tests exist for context isolation rules
- [ ] Architecture tests exist for naming conventions
- [ ] Tests are in `tests/Architecture/`
- [ ] Tests run in CI and block merges on failure
- [ ] Exception list (`->ignoring()`) is reviewed periodically

### Success Criteria
- [ ] Every architectural rule is encoded as a Pest architecture test in `tests/Architecture/`.
- [ ] All architecture tests run in CI and block PR merges on failure.
- [ ] Dependency direction rules prevent reverse layer dependencies.
- [ ] Context isolation rules prevent unauthorized cross-context imports.
- [ ] Naming conventions are enforced with `->toHaveSuffix()`.
- [ ] Strict rules are used with explicit `->ignoring()` exceptions reviewed quarterly.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Paper architecture
- [ ] Anti-pattern prevented: False security

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No architecture tests.
- [ ] Failure scenario handled: Rules too strict.
- [ ] Failure scenario handled: Rules not run in CI.

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
