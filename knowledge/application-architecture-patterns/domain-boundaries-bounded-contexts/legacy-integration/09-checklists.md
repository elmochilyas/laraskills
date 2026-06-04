# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Integrating legacy systems at context boundaries
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Legacy model imported directly prevented
- [ ] Migration without rollback prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Always pair Strangler Fig with ACL.** Strangler replaces functionality but without ACL, legacy data structures pass through. The new system inherits legacy model problems.
- [ ] Workflow step completed: **Use feature-flag based routing for Strangler Fig migration.** Route traffic between legacy and new systems using feature flags. Each feature independently testable, verifiable, and rollback-able.
- [ ] Workflow step completed: **Implement write-through and read-through during migration.** Write data to both systems (legacy + new). Read from new system. Verify correctness without user-facing impact.
- [ ] Workflow step completed: **Never attempt a full legacy system rewrite.** Replace feature by feature incrementally. Full rewrites have high failure rates Ã¢â‚¬â€ the legacy system embodies years of bug fixes.
- [ ] Workflow step completed: **Build the ACL in the new context's boundary, not in legacy.** The new context protects its own model integrity. Placing ACL in legacy requires modifying legacy, which is often impossible.

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

- [ ] Failure addressed: No ACL.
- [ ] Failure addressed: Strangler Fig without ACL.
- [ ] Failure addressed: Full rewrite attempt.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] ACL translates between legacy and new models
- [ ] Strangler Fig replaces functionality incrementally
- [ ] No direct legacy model imports in new context
- [ ] Feature flags control migration routing
- [ ] Write-through verifies correctness during migration
- [ ] Rollback plan exists for each migration step
- [ ] Migration is monitored (error rate, consistency, latency)

### Success Criteria
- [ ] ACL exists between new context and legacy system with bidirectional translation.
- [ ] Strangler Fig migrates features incrementally using feature flags.
- [ ] No legacy class is imported outside the ACL boundary.
- [ ] Each migration step has a rollback plan with feature-flag toggle.
- [ ] Migration monitoring tracks error rate, data consistency, and latency.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Legacy model imported directly
- [ ] Anti-pattern prevented: Migration without rollback

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No ACL.
- [ ] Failure scenario handled: Strangler Fig without ACL.
- [ ] Failure scenario handled: Full rewrite attempt.

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
