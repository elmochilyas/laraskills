# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Package Fit / Non-Fit Analysis
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] All seven dimensions scored with numerical values
- [ ] Lock-in risk weighted higher in final recommendation

---

# Architecture Checklist

- [ ] Analysis documented in project ADR directory or docs/decisions/
- [ ] Three-tier recommendation applied (Strong fit / Conditional fit / High-risk fit)
- [ ] Conditional fit includes written conditions that can be re-checked later
- [ ] Analysis stored in version-controlled documentation (not just chat history)

---

# Implementation Checklist

- [ ] Workflow step completed: Ecosystem alignment scored (PHP version, Laravel version, database requirements, conflicting packages)
- [ ] Workflow step completed: Assumption fit scored with explicit mismatch listing
- [ ] Workflow step completed: Escape hatch availability scored with concrete migration path
- [ ] Workflow step completed: Team familiarity scored with actual experience count
- [ ] Workflow step completed: Long-term commitment risk scored with maintainer and bus factor data
- [ ] Workflow step completed: Package maintenance health scored with last release date and issue stats
- [ ] Workflow step completed: Testing complexity scored with specific testing strategies named
- [ ] Workflow step completed: Recommendation tier matches actual score (not inflated)

---

# Performance Checklist

- [ ] Analysis cost budgeted (4-8 hours per package decision, one-time)
- [ ] Decision debt calculated — cost of removing package later vs. analysis cost now
- [ ] Spike time budgeted (1-2 days) before full adoption

---

# Security Checklist

- [ ] Maintenance health treated as security signal (unmaintained = unpatched vulnerabilities)
- [ ] Dependency chain audit run (`composer audit` on package's dependency tree)
- [ ] Credential handling evaluated (API keys in .env vs. hardcoded)

---

# Reliability Checklist

- [ ] Failure addressed: Stars-only evaluation:
- [ ] Failure addressed: Untested assumption mismatch:
- [ ] Failure addressed: Ignored lock-in risk:
- [ ] Failure addressed: Unknown team ramp-up cost:
- [ ] Failure addressed: Stale fit analysis after major version upgrade:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All seven dimensions scored (not left blank)
- [ ] Assumption mismatches are explicitly listed
- [ ] Maintenance health includes last release date (not just "well maintained")
- [ ] Escape hatch path is concrete (not "find another package")
- [ ] Testing complexity names specific strategies (fakes, mocks, real API)
- [ ] Recommendation tier matches the actual score (not inflated)
- [ ] Conditional fit includes written conditions that can be re-checked later
- [ ] Analysis stored in project documentation (not just in chat history)
- [ ] Spike completed for packages with architectural impact
- [ ] Package's dependencies audited for known vulnerabilities

### Success Criteria
- [ ] All seven dimensions scored for every architectural package decision
- [ ] Zero packages adopted with <3/10 maintenance health score
- [ ] Zero packages adopted where assumption mismatches exceed 2
- [ ] Lock-in severity documented for every package with database/schema ownership

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Download-count fetishism (choosing by popularity)
- [ ] Anti-pattern prevented: Zero-sum package thinking (package vs. no package false dichotomy)
- [ ] Anti-pattern prevented: Analysis paralysis (more time analyzing than building)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Package abandoned by maintainer:
- [ ] Failure scenario handled: Assumption broken by business requirement change:
- [ ] Failure scenario handled: Major version upgrade changes fit profile:

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
