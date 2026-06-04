# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module isolation enforcement: linting and CI rules
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Enforcement paralysis prevented
- [ ] Stale baseline prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Enforce contract-only cross-module imports.** Create PHPStan custom rules or Pest architecture tests that modules may only import from other modules' Contracts/ namespace. Block imports from Services/, Models/, or other internal directories.
- [ ] Workflow step completed: **Enforce database table ownership with PHPStan rules.** Register table prefixes per module. Create rules that detect SQL queries, Eloquent queries, or migration files referencing tables owned by other modules.
- [ ] Workflow step completed: **Automatically detect and block circular dependencies.** Build a CI step that reads all `module.json` files, builds the dependency graph, runs topological sort, and fails if cycles exist.
- [ ] Workflow step completed: **Make enforcement a required CI check.** The enforcement step must block PR merges. If it's allowed to fail, it will always fail and be ignored.
- [ ] Workflow step completed: **Baseline existing violations when introducing enforcement.** Create a baseline of current violations. Only block NEW violations. Require the baseline to shrink over time (track trend).

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

- [ ] Failure addressed: No enforcement.
- [ ] Failure addressed: Only testing one direction.
- [ ] Failure addressed: Over-relying on directory structure.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] PHPStan rules enforce contract-only cross-module imports
- [ ] PHPStan rules detect and flag cross-module database access
- [ ] CI block circular dependencies via dependency graph validation
- [ ] Enforcement is a required (not optional) CI step
- [ ] Existing violations are baselined with shrinking trend
- [ ] Whitelisted exceptions have justifications and expiration dates
- [ ] No cross-module imports from Services/, Models/, or other internal namespaces exist (outside whitelist)

### Success Criteria
- [ ] Cross-module imports are restricted to Contracts/ namespace and enforced by static analysis.
- [ ] Cross-module database queries are detected and blocked.
- [ ] CI validates dependency graph acyclicity on every PR.
- [ ] Existing violations are baselined with a shrinking trend line.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Enforcement paralysis
- [ ] Anti-pattern prevented: Stale baseline

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No enforcement.
- [ ] Failure scenario handled: Only testing one direction.
- [ ] Failure scenario handled: Over-relying on directory structure.

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
