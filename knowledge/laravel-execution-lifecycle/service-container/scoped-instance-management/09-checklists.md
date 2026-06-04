# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Scoped Instance Management
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain the difference between `singleton()` and `scoped()` in FPM vs Octane
- [ ] Understand the separate `$scopedInstances` array and `flushScoped()` mechanics
- [ ] Know how to audit a codebase for incorrect singleton usage
- [ ] All request-state services converted from `singleton()` to `scoped()`
- [ ] Process-scoped services confirmed stateless and immutable
- [ ] No singleton holds a direct reference to a scoped dependency
- [ ] Audit all `singleton()` bindings before Octane deployment applied
- [ ] Ensure `flushScoped()` is called at scope boundaries applied
- [ ] Never cache scoped instances in singletons applied
- [ ] Use selective flush for mid-request scope changes applied
- [ ] Using singleton() for Per-Request State Under Octane prevented
- [ ] Using scoped() for Stateless Services prevented
- [ ] Using singleton() for request-scoped state prevented
- [ ] Assuming scoped() and singleton() interchangeable in FPM prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Audit all `singleton()` bindings before Octane deployment applied
- [ ] Ensure `flushScoped()` is called at scope boundaries applied
- [ ] Never cache scoped instances in singletons applied
- [ ] Use selective flush for mid-request scope changes applied
- [ ] Using singleton() for request-scoped state prevented
- [ ] Assuming scoped() and singleton() interchangeable in FPM prevented
- [ ] Not calling flushScoped() in queue workers prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using singleton() for Per-Request State Under Octane prevented
- [ ] Using scoped() for Stateless Services prevented
- [ ] Holding onto Scoped Instances Outside Their Scope prevented
- [ ] Not Booting Octane-Scoped Service Correctly prevented
- [ ] Scoped Service Leaking to Parent Process prevented

---

# Testing Checklist

- [ ] All request-state services converted from `singleton()` to `scoped()`
- [ ] Process-scoped services confirmed stateless and immutable
- [ ] No singleton holds a direct reference to a scoped dependency
- [ ] Octane configured to flush scoped instances per request
- [ ] Can explain the difference between `singleton()` and `scoped()` in FPM vs Octane
- [ ] Understand the separate `$scopedInstances` array and `flushScoped()` mechanics
- [ ] Know how to audit a codebase for incorrect singleton usage
- [ ] Can implement selective flush for mid-request scope changes
- [ ] Zero singleton() bindings holding mutable request-state
- [ ] All converted bindings work correctly under Octane
- [ ] Concurrent request test confirms data isolation
- [ ] No performance regression from conversion

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using singleton() for Per-Request State Under Octane prevented
- [ ] Using scoped() for Stateless Services prevented
- [ ] Holding onto Scoped Instances Outside Their Scope prevented
- [ ] Not Booting Octane-Scoped Service Correctly prevented
- [ ] Scoped Service Leaking to Parent Process prevented

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
- Binding Types
- Binding Resolution
- Container Aliases

---


