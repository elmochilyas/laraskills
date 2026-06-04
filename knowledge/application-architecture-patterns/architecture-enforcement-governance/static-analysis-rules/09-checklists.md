# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Static analysis rules for architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] PHPStan for everything prevented
- [ ] Redundant enforcement prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to Pest architecture tests over custom PHPStan rules.** Pest tests are simpler, more readable, and sufficient for most import/namespace rules. Use PHPStan only for what Pest cannot express.
- [ ] Workflow step completed: **Never duplicate rules across Pest and PHPStan.** Choose one enforcement mechanism per rule. Duplicate rules must be kept in sync Ã¢â‚¬â€ if one is missed, inconsistency creates confusion.
- [ ] Workflow step completed: **Use static analysis for type-level architecture constraints.** PHPStan custom rules verify method return types, parameter types, interface implementation, and forbidden method calls.
- [ ] Workflow step completed: **Integrate custom PHPStan rules into CI.** Run custom architecture rules as part of the static analysis step. Never rely on local-only execution.
- [ ] Workflow step completed: **Use `spaze/phpstan-disallowed-calls` for forbidden classes and methods.** A declarative configuration eliminates custom PHPStan rules for simple disallowed-call scenarios.

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

- [ ] Failure addressed: Redundant rules.
- [ ] Failure addressed: Rules too specific.
- [ ] Failure addressed: No CI integration.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Custom PHPStan rules exist for constraints Pest cannot express
- [ ] No duplication between PHPStan rules and Pest architecture tests
- [ ] Custom rules run in CI
- [ ] Larastan is configured for framework-specific checks
- [ ] Disallowed calls list is maintained
- [ ] Rules check patterns, not specific class names

### Success Criteria
- [ ] Every architectural constraint uses exactly one enforcement mechanism Ã¢â‚¬â€ never duplicated.
- [ ] Pest architecture tests cover all structural/import rules.
- [ ] Custom PHPStan rules exist only for type-level constraints Pest cannot express.
- [ ] `spaze/phpstan-disallowed-calls` handles all simple disallowed-call scenarios.
- [ ] Larastan is configured for Eloquent/framework-specific checks.
- [ ] All custom rules run in CI and check architectural patterns, not specific class names.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: PHPStan for everything
- [ ] Anti-pattern prevented: Redundant enforcement

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Redundant rules.
- [ ] Failure scenario handled: Rules too specific.
- [ ] Failure scenario handled: No CI integration.

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
