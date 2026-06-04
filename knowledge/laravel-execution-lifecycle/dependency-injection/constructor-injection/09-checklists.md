# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Constructor Injection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interfaces are used in type-hints, not concrete classes (where applicable)
- [ ] No `app()` or `resolve()` calls in class bodies (constructor or methods)
- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interface type-hints are preferred over concrete classes where swapping is needed
- [ ] No `app()` or `resolve()` calls exist in class bodies
- [ ] Type-hint interfaces, not concretions applied
- [ ] Keep constructors pure applied
- [ ] Use one dependency per parameter applied
- [ ] Prefer constructor injection over app() applied
- [ ] Over-Injection (Too Many Parameters) prevented
- [ ] Impure Constructors with I/O prevented
- [ ] Not type-hinting interfaces prevented
- [ ] Mixing injection with manual new prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Type-hint interfaces, not concretions applied
- [ ] Keep constructors pure applied
- [ ] Use one dependency per parameter applied
- [ ] Prefer constructor injection over app() applied
- [ ] Not type-hinting interfaces prevented
- [ ] Mixing injection with manual new prevented
- [ ] Circular dependencies prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Over-Injection (Too Many Parameters) prevented
- [ ] Impure Constructors with I/O prevented
- [ ] Not Using Interface Type-Hints prevented
- [ ] Mixing Constructor Injection with app() prevented
- [ ] Missing Optional Defaults prevented

---

# Testing Checklist

- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interface type-hints are preferred over concrete classes where swapping is needed
- [ ] No `app()` or `resolve()` calls exist in class bodies
- [ ] Constructors have no side effects (I/O, DB queries, API calls)
- [ ] All constructor parameters have type-hints (no untyped parameters)
- [ ] Interfaces are used in type-hints, not concrete classes (where applicable)
- [ ] No `app()` or `resolve()` calls in class bodies (constructor or methods)
- [ ] Constructors have no side effects (I/O, DB, API calls)
- [ ] All dependencies are visible as type-hinted constructor parameters
- [ ] Class can be instantiated via container without manual wiring
- [ ] Tests can substitute dependencies via $this->app->instance() or constructor arguments
- [ ] Constructor is pure (no side effects) and uses promoted readonly properties

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Over-Injection (Too Many Parameters) prevented
- [ ] Impure Constructors with I/O prevented
- [ ] Not Using Interface Type-Hints prevented
- [ ] Mixing Constructor Injection with app() prevented
- [ ] Missing Optional Defaults prevented

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

- **Auto-Resolution Strategy** â€” the underlying mechanism powering automatic constructor resolution
- **Service Container Basics** â€” how the container manages bindings, singletons, and resolution
- **PHP Reflection API** â€” ReflectionClass, ReflectionParameter used by the container's `build()` method
- **Method Injection** â€” alternative injection path for controller actions and event handlers
- **Interface Binding Resolution** â€” how interfaces in constructor type-hints are mapped to concretes
- **Testing with the Container** â€” how to test classes that receive dependencies via constructor

---


