# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Binding Resolution
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can trace the full resolution chain: alias â†’ instances â†’ bindings â†’ auto-resolution â†’ exception
- [ ] Understand difference between `make()`, `makeWith()`, and `build()`
- [ ] Know why instances cache is checked before bindings
- [ ] `make()` used â€” never `build()` in application code
- [ ] `makeWith()` always called with named associative arrays, never positional
- [ ] Services resolved via constructor injection, not `app()->make()` inside methods
- [ ] Prefer `make()` over direct instantiation applied
- [ ] Avoid `build()` in application code applied
- [ ] Use `makeWith()` sparingly applied
- [ ] Log resolution failures applied
- [ ] Using build() in Application Code prevented
- [ ] Calling make() Inside Business Logic (Service Locator) prevented
- [ ] Using build() in controller for fresh instance prevented
- [ ] Passing positional params to makeWith() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer `make()` over direct instantiation applied
- [ ] Avoid `build()` in application code applied
- [ ] Use `makeWith()` sparingly applied
- [ ] Log resolution failures applied
- [ ] Pre-resolve during boot applied
- [ ] Using build() in controller for fresh instance prevented
- [ ] Passing positional params to makeWith() prevented
- [ ] Calling make() inside business logic prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using build() in Application Code prevented
- [ ] Calling make() Inside Business Logic (Service Locator) prevented
- [ ] Passing Positional Arrays to makeWith() prevented
- [ ] Not Catching BindingResolutionException at Kernel Level prevented
- [ ] Expecting New Instance After singleton() prevented

---

# Testing Checklist

- [ ] `make()` used â€” never `build()` in application code
- [ ] `makeWith()` always called with named associative arrays, never positional
- [ ] Services resolved via constructor injection, not `app()->make()` inside methods
- [ ] Hot-path services optionally pre-resolved during boot
- [ ] Can trace the full resolution chain: alias â†’ instances â†’ bindings â†’ auto-resolution â†’ exception
- [ ] Understand difference between `make()`, `makeWith()`, and `build()`
- [ ] Know why instances cache is checked before bindings
- [ ] Can debug `BindingResolutionException` using build stack trace
- [ ] All services resolved via make() in factories and makeWith() for parameterized cases
- [ ] No build() calls in application code
- [ ] Services receive extenders, resolution callbacks, and correct caching
- [ ] Resolution returns expected implementation every time

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using build() in Application Code prevented
- [ ] Calling make() Inside Business Logic (Service Locator) prevented
- [ ] Passing Positional Arrays to makeWith() prevented
- [ ] Not Catching BindingResolutionException at Kernel Level prevented
- [ ] Expecting New Instance After singleton() prevented

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
- Auto-Resolution via Reflection
- Contextual Binding

---


