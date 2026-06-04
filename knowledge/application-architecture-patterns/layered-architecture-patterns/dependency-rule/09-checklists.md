# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** The Dependency Rule: inward-pointing dependencies
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Facade usage in Domain layer: prevented
- [ ] Extending framework classes in Domain: prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Document the explicit dependency map.** Create a text/comment map showing each layer and what it can depend on: Presentation Ã¢â€ â€™ Application Ã¢â€ â€™ Domain, Infrastructure Ã¢â€ â€™ Application + Domain, Application Ã¢â€ â€™ Domain only, Domain Ã¢â€ â€™ nothing external.
- [ ] Workflow step completed: **Configure PSR-4 autoloading per layer.** Add multiple PSR-4 roots in `composer.json` (e.g., `"App\\Presentation\\"`, `"App\\Application\\"`, `"App\\Domain\\"`). Run `composer dump-autoload`.
- [ ] Workflow step completed: **Scan and catalog existing violations.** Use Pest `arch()` or grep to find current violations Ã¢â‚¬â€ Domain importing `DB::`, Application importing `Request`. Create a baseline list.
- [ ] Workflow step completed: **Write architecture test for each dependency direction.** For each layer pair, write an architecture test that the outer layer may import the inner, but inner may NEVER import outer. Include tests for:
- [ ] Workflow step completed: **Set up CI enforcement.** Add architecture tests to the CI test suite. Fail the build on any violation.

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

- [ ] Failure addressed: Circular dependency:
- [ ] Failure addressed: Testing too late.
- [ ] Failure addressed: Ignoring facade calls.
- [ ] Failure addressed: Whitelist creep.
- [ ] Failure addressed: Partial enforcement.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Dependency map is documented and team-accessible
- [ ] Architecture tests exist for each layer pair
- [ ] CI fails if any architecture test fails
- [ ] All current violations are cataloged and have remediation plans
- [ ] New code is reviewed for arch() test compliance
- [ ] No circular dependencies exist between layers

### Success Criteria
- [ ] Architecture tests exist for every layer pair and pass in CI.
- [ ] No inner layer imports from any outer layer.
- [ ] All current violations are documented with remediation plans.
- [ ] Dependency direction is verifiable by automated test, not manual review.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Facade usage in Domain layer:
- [ ] Anti-pattern prevented: Extending framework classes in Domain:
- [ ] Anti-pattern prevented: Using framework helpers in Application:
- [ ] Anti-pattern prevented: Transitive dependency violation:

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Circular dependency:
- [ ] Failure scenario handled: Testing too late.
- [ ] Failure scenario handled: Ignoring facade calls.

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
