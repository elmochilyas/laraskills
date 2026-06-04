# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Team-scale organizational strategies (10+ engineers)
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping followed
- [ ] Ensure No Two Teams Ever Modify the Same File for Different Reasons followed
- [ ] Use Per-Domain Service Providers for Independent Registration followed
- [ ] Flat Namespace With Multi-Team prevented
- [ ] No Shared Kernel Owner prevented

---

# Architecture Checklist

- [ ] Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping followed
- [ ] Ensure No Two Teams Ever Modify the Same File for Different Reasons followed
- [ ] Use Per-Domain Service Providers for Independent Registration followed
- [ ] Use API-First Internal Communication with Versioned Contracts followed
- [ ] Establish a Stable Shared Kernel with Explicit Ownership followed

---

# Implementation Checklist

- [ ] Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping followed
- [ ] Ensure No Two Teams Ever Modify the Same File for Different Reasons followed
- [ ] Use Per-Domain Service Providers for Independent Registration followed
- [ ] Use API-First Internal Communication with Versioned Contracts followed
- [ ] Establish a Stable Shared Kernel with Explicit Ownership followed
- [ ] Track Merge Conflict Budget Ã¢â‚¬â€ Investigate at 5+ Conflicts/Month followed
- [ ] Define Infrastructure Standards with Team-Specific Flexibility followed
- [ ] Maintain a Team-to-Namespace Mapping Document followed
- [ ] Workflow step completed: **Give each team its own namespace root.** Configure separate PSR-4 mappings per team/domain in `composer.json`. Replace shared `App\` with `Billing\`, `Catalog\`, `Identity\` roots mapped to separate directories.
- [ ] Workflow step completed: **Implement per-domain service providers.** Each domain registers its own routes, events, commands, and bindings through a dedicated provider. Eliminate the single `AppServiceProvider` bottleneck.
- [ ] Workflow step completed: **Use API-first internal communication.** Define cross-domain communication through versioned service contracts (interfaces). Never allow direct database access across team boundaries. Use events for fire-and-forget notification.
- [ ] Workflow step completed: **Establish a stable shared kernel with explicit ownership.** Assign a specific team to own the shared kernel namespace. Shared code without an owner becomes unmaintained. Track PRs and maintain tests.
- [ ] Workflow step completed: **Track merge conflict budgets.** Monitor monthly merge conflicts across team boundaries. At 5+ conflicts/month, investigate structural reorganization Ã¢â‚¬â€ split route files, separate models, or reassign namespace ownership.

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

- [ ] Failure addressed: Cross-team shared models:
- [ ] Failure addressed: No shared kernel owner:
- [ ] Failure addressed: Siloed infrastructure decisions:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each team has its own namespace root with PSR-4 mapping
- [ ] Merge conflicts are tracked and below 5/month threshold
- [ ] Cross-domain communication uses contracts, not direct model access
- [ ] Shared kernel has explicit ownership
- [ ] Architecture tests enforce team namespace boundaries
- [ ] Team-to-namespace mapping document is maintained
- [ ] Infrastructure standards are documented with team flexibility

### Success Criteria
- [ ] Each team works independently without file ownership conflicts.
- [ ] Merge conflicts are below 5/month.
- [ ] Cross-domain communication uses contracts, not direct model access.
- [ ] Shared kernel is maintained with clear ownership.
- [ ] New engineers can identify domain ownership from documentation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping followed
- [ ] Ensure No Two Teams Ever Modify the Same File for Different Reasons followed
- [ ] Use Per-Domain Service Providers for Independent Registration followed
- [ ] Use API-First Internal Communication with Versioned Contracts followed
- [ ] Establish a Stable Shared Kernel with Explicit Ownership followed
- [ ] Track Merge Conflict Budget Ã¢â‚¬â€ Investigate at 5+ Conflicts/Month followed
- [ ] Define Infrastructure Standards with Team-Specific Flexibility followed
- [ ] Maintain a Team-to-Namespace Mapping Document followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Flat Namespace With Multi-Team
- [ ] Anti-pattern prevented: No Shared Kernel Owner
- [ ] Anti-pattern prevented: Over-Partitioning

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Cross-team shared models:
- [ ] Failure scenario handled: No shared kernel owner:
- [ ] Failure scenario handled: Siloed infrastructure decisions:

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
