# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Facade Architecture
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test setUp() clears facade resolved instances
- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test `setUp()` clears facade resolved instances
- [ ] Use facades in controllers, not services applied
- [ ] Inject dependencies in business logic applied
- [ ] Clear facade state between tests applied
- [ ] Use shouldReceive() over swap() applied
- [ ] Facades in Business Logic prevented
- [ ] Not Clearing Facade State Between Tests prevented
- [ ] Facade in domain service prevented
- [ ] Not clearing facade state between tests prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use facades in controllers, not services applied
- [ ] Inject dependencies in business logic applied
- [ ] Clear facade state between tests applied
- [ ] Use shouldReceive() over swap() applied
- [ ] Facade in domain service prevented
- [ ] Not clearing facade state between tests prevented
- [ ] Calling getFacadeRoot() prematurely prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Facades in Business Logic prevented
- [ ] Not Clearing Facade State Between Tests prevented
- [ ] Facade Overuse in a Single Class prevented
- [ ] Real-Time Facades for Production Code prevented
- [ ] Mocking Over swap/instance prevented

---

# Testing Checklist

- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test `setUp()` clears facade resolved instances
- [ ] Octane deployment handles facade root clearing per request
- [ ] Facades are used only in controllers, views, and route files (not business logic)
- [ ] Domain services and repositories use constructor injection, not facades
- [ ] Test setUp() clears facade resolved instances
- [ ] Octane deployment handles facade root clearing per request
- [ ] Facades appear only in presentation-layer code (controllers, views, routes)
- [ ] Business logic classes use constructor injection exclusively
- [ ] All facade tests use shouldReceive() or Facade::fake() with proper cleanup
- [ ] Octane deployments have facade root clearing configured

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Facades in Business Logic prevented
- [ ] Not Clearing Facade State Between Tests prevented
- [ ] Facade Overuse in a Single Class prevented
- [ ] Real-Time Facades for Production Code prevented
- [ ] Mocking Over swap/instance prevented

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

- **Service Container** â€” how facades resolve their underlying instances from the container
- **Interface Binding Resolution** â€” facades often resolve through interface bindings
- **PHP __callStatic() Magic** â€” the language-level mechanism enabling static proxies
- **Constructor Injection** â€” the injection alternative to facade usage
- **Testing with the Container** â€” facade faking and instance swapping
- **Service Locator Anti-Pattern** â€” facades as intentional, testable service locators

---


