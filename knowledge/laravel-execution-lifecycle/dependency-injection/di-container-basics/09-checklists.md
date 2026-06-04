# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Di Container Basics
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All interface bindings are registered in service providers
- [ ] No `app()` calls in business logic (controllers, services, models)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] All interface bindings are registered in service provider `register()` methods
- [ ] No `app()` calls exist in business logic (services, repositories, action classes)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] Bind interfaces, not concretions applied
- [ ] Register bindings in service providers applied
- [ ] Prefer singleton for stateless services applied
- [ ] Use contextual binding applied
- [ ] Service Locator in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] Binding in route files prevented
- [ ] Forgetting to bind interfaces prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Bind interfaces, not concretions applied
- [ ] Register bindings in service providers applied
- [ ] Prefer singleton for stateless services applied
- [ ] Use contextual binding applied
- [ ] Binding in route files prevented
- [ ] Forgetting to bind interfaces prevented
- [ ] Singleton with mutable state prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Service Locator in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] Over-Binding Concrete Classes prevented
- [ ] Modifying Bindings at Runtime prevented
- [ ] Singleton with Mutable State prevented

---

# Testing Checklist

- [ ] All interface bindings are registered in service provider `register()` methods
- [ ] No `app()` calls exist in business logic (services, repositories, action classes)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] No binding registration outside of service providers
- [ ] All interface bindings are registered in service providers
- [ ] No `app()` calls in business logic (controllers, services, models)
- [ ] Singletons are stateless (no per-request data stored in properties)
- [ ] No binding registration outside of service providers
- [ ] All service bindings are centralized in service provider register() methods
- [ ] Stateless services use singleton() for memory efficiency
- [ ] Business logic classes have zero app() calls in method bodies
- [ ] No class injects Container as a dependency for pulling services

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Service Locator in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] Over-Binding Concrete Classes prevented
- [ ] Modifying Bindings at Runtime prevented
- [ ] Singleton with Mutable State prevented

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

- (Foundational â€” no prior Laravel KU knowledge needed)
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md)
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md)
- The Container class is at `src/Illuminate/Container/Container.php`.
- Key properties: `$bindings`, `$instances`, `$aliases`, `$contextual`, `$resolved`.
- `Container::getInstance()` returns the global container instance.
- The `build()` method is the core of auto-resolution â€” uses ReflectionClass.

---


