# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Binding Extending
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can register an extender and explain when it executes
- [ ] Understand why extenders run before caching (prevents wrapper stacking)
- [ ] Know why extenders require pre-existing bindings
- [ ] Target binding exists before `extend()` is called
- [ ] Decorator implements the same interface as the original
- [ ] Extender uses the passed instance parameter (not `$app->make()` on same abstract)
- [ ] Prefer extenders over binding replacement applied
- [ ] Register extenders in correct order applied
- [ ] Use decorator classes, not inline closures applied
- [ ] Avoid stateful extenders applied
- [ ] Using extend() on a Binding That Doesn't Exist Yet prevented
- [ ] Modifying Original Object State Instead of Wrapping in extend() prevented
- [ ] Calling extend() before binding registered prevented
- [ ] Returning wrong type from extender prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer extenders over binding replacement applied
- [ ] Register extenders in correct order applied
- [ ] Use decorator classes, not inline closures applied
- [ ] Avoid stateful extenders applied
- [ ] Calling extend() before binding registered prevented
- [ ] Returning wrong type from extender prevented
- [ ] Modifying instance in-place instead of decorating prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using extend() on a Binding That Doesn't Exist Yet prevented
- [ ] Modifying Original Object State Instead of Wrapping in extend() prevented
- [ ] Order-Dependent Extenders (extend() Depends on Registration Order) prevented
- [ ] Using extend() for Cross-Cutting Concerns That Need Decorator Pattern prevented
- [ ] Not Using extend() When Third-Party Binding Needs Modification prevented

---

# Testing Checklist

- [ ] Target binding exists before `extend()` is called
- [ ] Decorator implements the same interface as the original
- [ ] Extender uses the passed instance parameter (not `$app->make()` on same abstract)
- [ ] Multiple extenders compose correctly (outer wraps inner)
- [ ] Can register an extender and explain when it executes
- [ ] Understand why extenders run before caching (prevents wrapper stacking)
- [ ] Know why extenders require pre-existing bindings
- [ ] Can explain the difference between `extend()` and `resolving()` callbacks
- [ ] Service is wrapped in decorator(s) without modifying original binding
- [ ] Extenders compose correctly in registration order
- [ ] No BindingResolutionException or infinite recursion at resolution time
- [ ] Extender order documented and verified

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using extend() on a Binding That Doesn't Exist Yet prevented
- [ ] Modifying Original Object State Instead of Wrapping in extend() prevented
- [ ] Order-Dependent Extenders (extend() Depends on Registration Order) prevented
- [ ] Using extend() for Cross-Cutting Concerns That Need Decorator Pattern prevented
- [ ] Not Using extend() When Third-Party Binding Needs Modification prevented

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
- Resolution Callbacks
- Binding Resolution

---


