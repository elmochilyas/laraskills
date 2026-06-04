# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Binding Types
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain the 4 binding types and their lifecycle behavior
- [ ] Understand why `scoped()` exists separately from `singleton()`
- [ ] Know when to use each binding type for correctness vs performance
- [ ] Stateless services use `singleton()` or `bind()` depending on construction cost
- [ ] Request-state services use `scoped()` not `singleton()`
- [ ] `instance()` only used in tests or boot-time setup, not production provider registration
- [ ] Default to `bind()` for stateless services applied
- [ ] Use `scoped()` for any service holding per-request state applied
- [ ] Audit all `singleton()` bindings before Octane deployment applied
- [ ] Use `instance()` only in tests or boot-time applied
- [ ] Singleton with Mutable Internal State prevented
- [ ] Using singleton() for Request-Scoped State (Octane Data Leak) prevented
- [ ] Using singleton() for request-scoped state prevented
- [ ] Using bind() for expensive services prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Default to `bind()` for stateless services applied
- [ ] Use `scoped()` for any service holding per-request state applied
- [ ] Audit all `singleton()` bindings before Octane deployment applied
- [ ] Use `instance()` only in tests or boot-time applied
- [ ] Using singleton() for request-scoped state prevented
- [ ] Using bind() for expensive services prevented
- [ ] Calling instance() in register() with incomplete object prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Singleton with Mutable Internal State prevented
- [ ] Using singleton() for Request-Scoped State (Octane Data Leak) prevented
- [ ] Using instance() for Production Binding Registration prevented
- [ ] Mixing Binding Types in a Singleton's Dependency Graph prevented
- [ ] Using bind() Where singleton() Was Intended prevented

---

# Testing Checklist

- [ ] Stateless services use `singleton()` or `bind()` depending on construction cost
- [ ] Request-state services use `scoped()` not `singleton()`
- [ ] `instance()` only used in tests or boot-time setup, not production provider registration
- [ ] Transitive dependencies of singleton/scoped bindings are also shared, or use factory pattern
- [ ] Can explain the 4 binding types and their lifecycle behavior
- [ ] Understand why `scoped()` exists separately from `singleton()`
- [ ] Know when to use each binding type for correctness vs performance
- [ ] Can explain why `instance()` bypasses extenders and resolving callbacks
- [ ] Every binding uses the correct type for its lifecycle requirements
- [ ] No data leaks under Octane from incorrect singleton usage
- [ ] Performance profile matches expectations (shared vs per-resolution)
- [ ] Zero singleton() bindings holding mutable request-scoped state

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Singleton with Mutable Internal State prevented
- [ ] Using singleton() for Request-Scoped State (Octane Data Leak) prevented
- [ ] Using instance() for Production Binding Registration prevented
- [ ] Mixing Binding Types in a Singleton's Dependency Graph prevented
- [ ] Using bind() Where singleton() Was Intended prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- Container Fundamentals
- Binding Resolution
- Scoped Instance Management
- Binding Extending

---


