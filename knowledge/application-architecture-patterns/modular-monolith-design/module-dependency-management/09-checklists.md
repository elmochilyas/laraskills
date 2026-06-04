# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module dependency management and versioning
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed monolith within one codebase prevented
- [ ] Dependency graph not maintained prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create `module.json` for each module.** Declare name, version, dependencies (module name and version constraint), and priority. List every module this module directly depends on.
- [ ] Workflow step completed: **Enforce acyclic dependency graph.** Run dependency validation in CI. Use topological sorting to detect cycles. Block any PR introducing a circular dependency.
- [ ] Workflow step completed: **Keep dependencies per module under 5.** Monitor dependency count as a health metric. A module with 5+ dependencies is a candidate for splitting or redesign.
- [ ] Workflow step completed: **Use events to break dependency cycles.** When Module A needs Module B but a direct dependency would create a cycle, use events. Events invert dependency direction Ã¢â‚¬â€ publisher has no import dependency on subscriber.
- [ ] Workflow step completed: **Follow the Stable Dependencies Principle.** Module dependencies should always point toward more stable modules. The shared kernel is the most stable; leaf modules are the least stable.

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

- [ ] Failure addressed: Undeclared dependencies.
- [ ] Failure addressed: Circular dependencies via events.
- [ ] Failure addressed: Too many dependencies tolerated.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Every module has a `module.json` with declared dependencies
- [ ] Dependency graph is acyclic (validated in CI)
- [ ] No module has 5+ dependencies
- [ ] Dependency validation runs in CI (blocks PRs)
- [ ] Dependency visualization is generated and reviewed regularly
- [ ] Dependencies follow Stable Dependencies Principle
- [ ] Events used where dependency cycles would otherwise exist

### Success Criteria
- [ ] Each module has a `module.json` with accurate dependency declarations.
- [ ] The dependency graph is acyclic and validated in CI.
- [ ] No module exceeds 5 direct dependencies.
- [ ] Dependency visualization is generated and reviewed regularly.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed monolith within one codebase
- [ ] Anti-pattern prevented: Dependency graph not maintained

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Undeclared dependencies.
- [ ] Failure scenario handled: Circular dependencies via events.
- [ ] Failure scenario handled: Too many dependencies tolerated.

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
