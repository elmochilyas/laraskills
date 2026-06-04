# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Constructor Injection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All dependencies are declared as type-hinted constructor parameters
- [ ] No `app()` calls exist in business logic
- [ ] Constructor parameter count is â‰¤ 4 for most classes
- [ ] All dependencies declared as type-hinted constructor parameters
- [ ] No `app()` or `resolve()` calls exist in business logic
- [ ] Constructor parameter count is â‰¤ 4 for most classes
- [ ] Make dependencies explicit applied
- [ ] Keep constructor parameter count low applied
- [ ] Use readonly promoted properties applied
- [ ] Bind interfaces in constructor types applied
- [ ] Over-Injection (7+ Parameters) prevented
- [ ] Constructor Service Locator prevented
- [ ] Not type-hinting the interface prevented
- [ ] Mixing injection with new prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Make dependencies explicit applied
- [ ] Keep constructor parameter count low applied
- [ ] Use readonly promoted properties applied
- [ ] Bind interfaces in constructor types applied
- [ ] Avoid side effects in constructors applied
- [ ] Not type-hinting the interface prevented
- [ ] Mixing injection with new prevented
- [ ] Side effects in constructor prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Over-Injection (7+ Parameters) prevented
- [ ] Constructor Service Locator prevented
- [ ] Side Effects in Constructors prevented
- [ ] Mixing injection with new prevented
- [ ] Not Type-Hinting Interfaces prevented

---

# Testing Checklist

- [ ] All dependencies declared as type-hinted constructor parameters
- [ ] No `app()` or `resolve()` calls exist in business logic
- [ ] Constructor parameter count is â‰¤ 4 for most classes
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] All dependencies are declared as type-hinted constructor parameters
- [ ] No `app()` calls exist in business logic
- [ ] Constructor parameter count is â‰¤ 4 for most classes
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] All dependencies visible as type-hinted constructor parameters
- [ ] Class can be instantiated via container without manual wiring
- [ ] Tests can substitute dependencies via constructor arguments or instance()
- [ ] Constructor is pure (no side effects) with promoted readonly properties

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Over-Injection (7+ Parameters) prevented
- [ ] Constructor Service Locator prevented
- [ ] Side Effects in Constructors prevented
- [ ] Mixing injection with new prevented
- [ ] Not Type-Hinting Interfaces prevented

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

- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md)
- [Method Injection (ku-03)](../ku-03-method-injection/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- [Over-Injection Anti-Pattern](../../dependency-injection/over-injection-anti-pattern/02-knowledge-unit.md)
- `Container::build()` at `Illuminate\Container\Container::build()` is the core method.
- It uses `ReflectionClass::getConstructor()` and `ReflectionMethod::getParameters()`.
- Parameters with class type-hints are resolved via recursive `Container::make()`.
- Parameters without type-hints or with built-in types require explicit binding or default values.

---


