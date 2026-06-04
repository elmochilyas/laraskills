# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Method Injection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Controller action parameters are ordered: container-resolved first, route params last
- [ ] Shared dependencies are in constructors, not repeated across methods
- [ ] All injected method parameters have explicit type-hints
- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for payload, method injection for services
- [ ] Prefer constructor injection for shared dependencies applied
- [ ] Use method injection for controller-specific services applied
- [ ] Order parameters: resolved first, runtime second applied
- [ ] Be explicit about injected types applied
- [ ] Method Injection for Shared Dependencies prevented
- [ ] Wrong Parameter Order prevented
- [ ] Using method injection for shared dependencies prevented
- [ ] Wrong parameter ordering prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer constructor injection for shared dependencies applied
- [ ] Use method injection for controller-specific services applied
- [ ] Order parameters: resolved first, runtime second applied
- [ ] Be explicit about injected types applied
- [ ] Using method injection for shared dependencies prevented
- [ ] Wrong parameter ordering prevented
- [ ] Not type-hinting injected parameters prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Method Injection for Shared Dependencies prevented
- [ ] Wrong Parameter Order prevented
- [ ] Method Injection in Middleware prevented
- [ ] Missing Type-Hints in Injected Methods prevented
- [ ] Method Injection for Every Dependency prevented

---

# Testing Checklist

- [ ] Method injection is used for action-specific, not shared, dependencies
- [ ] No method injection in middleware `handle()` methods
- [ ] Queued listeners use constructor injection for payload, method injection for services
- [ ] Controller actions have container-resolved params before route binding params
- [ ] Controller action parameters are ordered: container-resolved first, route params last
- [ ] Shared dependencies are in constructors, not repeated across methods
- [ ] All injected method parameters have explicit type-hints
- [ ] Event listener methods use method injection for the event and additional services
- [ ] Shared dependencies use constructor injection; single-use deps use method injection
- [ ] Controller actions have container-resolved params before route bindings
- [ ] Listeners inject services in handle() with clean constructor
- [ ] Middleware uses constructor injection with fixed handle($request, $next) signature

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Method Injection for Shared Dependencies prevented
- [ ] Wrong Parameter Order prevented
- [ ] Method Injection in Middleware prevented
- [ ] Missing Type-Hints in Injected Methods prevented
- [ ] Method Injection for Every Dependency prevented

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

- **Constructor Injection** â€” the companion pattern for class-level dependency provision
- **Auto-Resolution Strategy** â€” underpins the resolution logic within `BoundMethod`
- **Container::call() Mechanics** â€” understanding how the container dispatches callables with resolved parameters
- **Testing with the Container** â€” how to test callables that rely on method injection
- **Service Locator Anti-Pattern** â€” how method injection offers a cleaner alternative to inline container pulls
- **Injection Guidelines by Class Type** â€” when method injection is preferred per class type (controllers, listeners, commands)

---


