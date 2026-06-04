# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Service Locator Anti Pattern
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] Declare all dependencies in the constructor applied
- [ ] Never call app() in business logic applied
- [ ] Use facades sparingly and consciously applied
- [ ] Refactor app() calls as you find them applied
- [ ] app() in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] app() in service class prevented
- [ ] Passing app() result to method prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Declare all dependencies in the constructor applied
- [ ] Never call app() in business logic applied
- [ ] Use facades sparingly and consciously applied
- [ ] Refactor app() calls as you find them applied
- [ ] app() in service class prevented
- [ ] Passing app() result to method prevented
- [ ] Controller pulls services inline prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] app() in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] resolve() in Domain Classes prevented
- [ ] Mixed Injection: Constructor + app() prevented
- [ ] Facades Replacing Constructor Injection prevented

---

# Testing Checklist

- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] No class accepts `Container $container` as a constructor dependency
- [ ] No `app()` or `resolve()` calls exist in business logic classes
- [ ] All dependencies are declared in constructor signatures
- [ ] Facade usage is limited to controllers, views, and route files
- [ ] No class accepts `Container $container` as a constructor dependency
- [ ] Zero app() or resolve() calls in business logic classes
- [ ] All dependencies visible as type-hinted constructor parameters
- [ ] No class injects Container $container as a dependency
- [ ] Facades appear only in controllers, views, and route files

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] app() in Business Logic prevented
- [ ] Container as Dependency prevented
- [ ] resolve() in Domain Classes prevented
- [ ] Mixed Injection: Constructor + app() prevented
- [ ] Facades Replacing Constructor Injection prevented

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

- **Constructor Injection** â€” the preferred alternative to service locator
- **Method Injection** â€” context-specific alternative to service locator for individual methods
- **Facade Architecture** â€” facades as intentional, testable service locators
- **Testing with the Container** â€” how test isolation is affected by service locator usage
- **Over-Injection Anti-Pattern** â€” distinguishing service locator abuse from genuine over-injection
- **Injection Guidelines by Class Type** â€” rules for which classes should inject and which should not

---


