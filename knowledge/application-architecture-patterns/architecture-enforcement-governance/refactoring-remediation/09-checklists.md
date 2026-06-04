# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Refactoring and remediation workflows
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Fix-it-later prevented
- [ ] Big-bang rewrite prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Classify violations by severity before scheduling remediation.** Critical: broken context isolation, circular dependencies, security. High: unauthorized imports, missing core contracts. Medium: incorrect layer usage. Low: naming conventions.
- [ ] Workflow step completed: **Fix critical violations immediately.** Critical violations block CI or cause production issues. Allocate time from the current sprint. Don't let them accumulate.
- [ ] Workflow step completed: **Group low-severity violations into backlog for cleanup sprints.** Collect into a backlog. Address in dedicated cleanup sprints every 4-6 weeks. Context switching for each low-severity fix is wasteful.
- [ ] Workflow step completed: **Use strangler pattern for large-scale refactoring.** Build the new structure alongside the old, redirect traffic, then remove the old structure. Never big-bang rewrites.
- [ ] Workflow step completed: **Apply the boy scout rule Ã¢â‚¬â€ leave code cleaner than you found it.** Fix small violations in the code you touch as part of regular work. A 2-minute fix now is cheaper than a 2-hour task later.

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

- [ ] Failure addressed: Ignoring violations.
- [ ] Failure addressed: Big-bang refactoring.
- [ ] Failure addressed: No verification.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Violations are classified by severity
- [ ] Critical violations are fixed immediately
- [ ] Low-severity violations are tracked in backlog
- [ ] Large refactoring uses strangler approach
- [ ] Boy scout rule is practiced (fix violations in code you touch)
- [ ] Remediation is verified by architecture tests in CI
- [ ] Security review included for security-related violations

### Success Criteria
- [ ] Every violation is classified by severity (Critical/High/Medium/Low) before remediation.
- [ ] Critical violations are fixed immediately in the current sprint Ã¢â‚¬â€ no deferral.
- [ ] Low-severity violations are grouped into cleanup sprints every 4-6 weeks.
- [ ] Large refactoring uses the strangler pattern Ã¢â‚¬â€ incremental, reversible, low-risk.
- [ ] The boy scout rule is applied in every PR Ã¢â‚¬â€ small violations fixed as encountered.
- [ ] Every remediation is verified by passing architecture tests in CI.
- [ ] Security-related violations include a security review as part of remediation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Fix-it-later
- [ ] Anti-pattern prevented: Big-bang rewrite

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Ignoring violations.
- [ ] Failure scenario handled: Big-bang refactoring.
- [ ] Failure scenario handled: No verification.

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
