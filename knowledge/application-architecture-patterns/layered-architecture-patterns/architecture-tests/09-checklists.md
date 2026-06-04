# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Architecture tests to enforce layer boundaries
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] False sense of security prevented
- [ ] Architecture test abandonment prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Define layer groups in the test file.** Use Pest's `arch()->expect()` or create helper functions that resolve namespaces from paths. Example: `arch('Domain')->expect('App\Domain')->toOnlyUse('App\Domain')`.
- [ ] Workflow step completed: **Test Domain layer isolation.** `arch('Domain')->expect('App\Domain')->not->toUse('Illuminate')`. Domain must not use any Laravel classes, facades, or helpers.
- [ ] Workflow step completed: **Test Application layer dependencies.** `arch('Application')->expect('App\Application')->toOnlyUse(['App\Domain', 'App\Application'])`. Application may use only Domain and itself.
- [ ] Workflow step completed: **Test Presentation layer doesn't use Infrastructure.** `arch('Presentation')->expect('App\Http')->not->toUse('App\Infrastructure')`. Presentation must go through Application.
- [ ] Workflow step completed: **Test Infrastructure layer doesn't use Presentation.** `arch('Infrastructure')->expect('App\Infrastructure')->not->toUse('App\Http')`.

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

- [ ] Failure addressed: Tests passing despite violations.
- [ ] Failure addressed: Overly permissive tests.
- [ ] Failure addressed: False positives from vendor.
- [ ] Failure addressed: Missing test updates after restructuring.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Domain layer test: no imports from Illuminate
- [ ] Application layer test: imports only Domain + itself
- [ ] Presentation layer test: does not import Infrastructure
- [ ] Infrastructure layer test: does not import Presentation
- [ ] No Facades in Domain or Application tests
- [ ] Legacy whitelist entries have expiration dates
- [ ] Architecture tests run in CI pipeline
- [ ] Architecture tests are fast (< 1 second total)

### Success Criteria
- [ ] Architecture tests exist for every layer pair and pass in CI.
- [ ] Deliberately introducing a layer violation causes a test failure.
- [ ] Tests run in <1 second total.
- [ ] No architecture violations exist except explicitly whitelisted legacy code with expiration dates.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: False sense of security
- [ ] Anti-pattern prevented: Architecture test abandonment

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Tests passing despite violations.
- [ ] Failure scenario handled: Overly permissive tests.
- [ ] Failure scenario handled: False positives from vendor.

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
