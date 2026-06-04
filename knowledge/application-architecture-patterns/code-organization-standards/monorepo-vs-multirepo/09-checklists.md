# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Monorepo vs. multi-repo organizational tradeoffs
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Default to Monorepo for Laravel Projects Under 50 Engineers followed
- [ ] Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes followed
- [ ] Enforce Module Boundaries Even Within a Monorepo followed
- [ ] Microservices Driving Premature Multi-Repo prevented
- [ ] Monorepo Without Module Boundaries prevented

---

# Architecture Checklist

- [ ] Default to Monorepo for Laravel Projects Under 50 Engineers followed
- [ ] Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes followed
- [ ] Enforce Module Boundaries Even Within a Monorepo followed
- [ ] Never Split Into Multi-Repo Without a Shared Contracts Package followed
- [ ] Keep Multi-Repo Dependency Graph Documented and Visible followed

---

# Implementation Checklist

- [ ] Default to Monorepo for Laravel Projects Under 50 Engineers followed
- [ ] Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes followed
- [ ] Enforce Module Boundaries Even Within a Monorepo followed
- [ ] Never Split Into Multi-Repo Without a Shared Contracts Package followed
- [ ] Keep Multi-Repo Dependency Graph Documented and Visible followed
- [ ] Prefer Modular Monolith Over Microservices for Laravel Projects followed
- [ ] Use Semantic Versioning for Shared Packages in Multi-Repo followed
- [ ] Use Hybrid Approach Ã¢â‚¬â€ Monorepo for Related Modules, Multi-Repo for External Services followed
- [ ] Workflow step completed: **Default to monorepo with modular structure.** For teams under 50 engineers, start with a single repository containing well-defined modules. Monorepos enable atomic cross-module refactoring, shared CI, and simpler dependency management.
- [ ] Workflow step completed: **Use path-based CI filtering to keep CI under 10 minutes.** Configure CI to run only tests relevant to changed paths. A change to `modules/billing/` should only run billing tests. Use GitHub Actions path filters or equivalent.
- [ ] Workflow step completed: **Enforce module boundaries even within a monorepo.** Treat modules with the same boundary discipline as separate repos Ã¢â‚¬â€ no direct cross-module model access, use contracts or events. Monorepo without boundaries becomes an unmanageable monolith.
- [ ] Workflow step completed: **If splitting to multi-repo, create a shared contracts package first.** Before splitting, version and publish a shared contracts package that all repos depend on. Without shared interfaces, code duplicates and drifts across repos.
- [ ] Workflow step completed: **Document the cross-repo dependency graph.** Maintain a dependency map showing which repos depend on which, including version constraints. Coordinate upgrades require understanding the full graph.

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

- [ ] Failure addressed: Microservices driving multi-repo prematurely:
- [ ] Failure addressed: Monorepo without module boundaries:
- [ ] Failure addressed: Multi-repo without shared contracts:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Module boundaries are enforced even within monorepo
- [ ] CI uses path-based filtering for selective execution
- [ ] Multi-repo setup includes shared contracts package
- [ ] Cross-repo dependency graph is documented
- [ ] Team can articulate why their repo structure exists
- [ ] Shared packages use strict semantic versioning
- [ ] Module boundaries prevent cross-module direct access

### Success Criteria
- [ ] Repository structure matches team and deployment needs.
- [ ] Monorepo CI stays under 10 minutes with path-based filtering.
- [ ] Module boundaries are enforced regardless of repo structure.
- [ ] Multi-repo setup has versioned shared contracts and documented dependency graph.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Default to Monorepo for Laravel Projects Under 50 Engineers followed
- [ ] Use Path-Based CI Filtering in Monorepos to Keep CI Under 10 Minutes followed
- [ ] Enforce Module Boundaries Even Within a Monorepo followed
- [ ] Never Split Into Multi-Repo Without a Shared Contracts Package followed
- [ ] Keep Multi-Repo Dependency Graph Documented and Visible followed
- [ ] Prefer Modular Monolith Over Microservices for Laravel Projects followed
- [ ] Use Semantic Versioning for Shared Packages in Multi-Repo followed
- [ ] Use Hybrid Approach Ã¢â‚¬â€ Monorepo for Related Modules, Multi-Repo for External Services followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Microservices Driving Premature Multi-Repo
- [ ] Anti-pattern prevented: Monorepo Without Module Boundaries
- [ ] Anti-pattern prevented: Multi-Repo Without Shared Contracts

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Microservices driving multi-repo prematurely:
- [ ] Failure scenario handled: Monorepo without module boundaries:
- [ ] Failure scenario handled: Multi-repo without shared contracts:

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
