# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Over Injection Anti Pattern
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No class has more than 5 constructor parameters (exceptions justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] No class has more than 5 constructor parameters (exceptions documented and justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] Target 3-4 constructor parameters maximum applied
- [ ] Refactor by concern, not convenience applied
- [ ] Consider command/query separation applied
- [ ] Don't hide over-injection with app() applied
- [ ] Using app() to reduce parameter count prevented
- [ ] Ignoring over-injection smell prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Target 3-4 constructor parameters maximum applied
- [ ] Refactor by concern, not convenience applied
- [ ] Consider command/query separation applied
- [ ] Don't hide over-injection with app() applied
- [ ] Using app() to reduce parameter count prevented
- [ ] Ignoring over-injection smell prevented
- [ ] Bundling unrelated dependencies prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist


---

# Testing Checklist

- [ ] No class has more than 5 constructor parameters (exceptions documented and justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] CI pipeline flags constructors with excessive parameters (5+)
- [ ] No class has more than 5 constructor parameters (exceptions justified)
- [ ] Related dependencies are grouped into higher-level services where appropriate
- [ ] No class uses `Container $container` or `app()` to hide over-injection
- [ ] CI pipeline flags constructors with excessive parameters
- [ ] No class has more than 4 constructor parameters (or 5 with documented justification)
- [ ] Related dependencies are grouped into cohesive, named abstractions
- [ ] No app() or Container $container is used to circumvent injection
- [ ] Grouped abstractions serve a clear, single purpose (no "misc" objects)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No anti-patterns detected

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

- **Constructor Injection** â€” the mechanism that enables over-injection (and whose discipline prevents it)
- **Method Injection** â€” the pattern to use for action-specific dependencies
- **SOLID Principles** â€” especially Single Responsibility Principle violated by over-injection
- **Service Locator Anti-Pattern** â€” the false solution to over-injection (hiding deps instead of reducing them)
- **Facade Architecture** â€” facade overuse as a hidden form of over-injection
- **Injection Guidelines by Class Type** â€” guidance on appropriate dependency counts per class type

---


