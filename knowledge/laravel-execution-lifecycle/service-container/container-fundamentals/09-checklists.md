# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Container Fundamentals
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain the resolution chain (instances â†’ bindings â†’ auto-resolution)
- [ ] Understand Container vs Application relationship (inheritance)
- [ ] Know the 4 primary binding types and their lifecycle semantics
- [ ] Bindings registered in `register()`, not `boot()`
- [ ] Resolution callbacks and extenders registered in `boot()`
- [ ] Alias registered in same provider as target binding
- [ ] Always register bindings in service providers applied
- [ ] Use `$app->bound('key')` before resolving in conditional paths applied
- [ ] Prefer explicit bindings over auto-resolution for production hot paths applied
- [ ] Avoid array push syntax in service providers applied
- [ ] Service Locator in Business Logic prevented
- [ ] Using Container as Key-Value Store prevented
- [ ] Using container as key-value store prevented
- [ ] Calling $app->make() inside controllers prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always register bindings in service providers applied
- [ ] Use `$app->bound('key')` before resolving in conditional paths applied
- [ ] Prefer explicit bindings over auto-resolution for production hot paths applied
- [ ] Avoid array push syntax in service providers applied
- [ ] Using container as key-value store prevented
- [ ] Calling $app->make() inside controllers prevented
- [ ] Assuming $app['db'] returns new connection each time prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Service Locator in Business Logic prevented
- [ ] Using Container as Key-Value Store prevented
- [ ] Binding Concrete-to-Concrete prevented
- [ ] Array Push Syntax for Service Registration prevented
- [ ] Calling make() Inside Controllers Instead of Constructor Injection prevented

---

# Testing Checklist

- [ ] Bindings registered in `register()`, not `boot()`
- [ ] Resolution callbacks and extenders registered in `boot()`
- [ ] Alias registered in same provider as target binding
- [ ] Bindings tagged after they are registered
- [ ] Can explain the resolution chain (instances â†’ bindings â†’ auto-resolution)
- [ ] Understand Container vs Application relationship (inheritance)
- [ ] Know the 4 primary binding types and their lifecycle semantics
- [ ] Can debug `BindingResolutionException` using the resolution chain
- [ ] All service bindings registered in appropriate service providers
- [ ] No service locator pattern in business code
- [ ] Container configuration works under both FPM and Octane
- [ ] Root cause identified in the resolution chain

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Service Locator in Business Logic prevented
- [ ] Using Container as Key-Value Store prevented
- [ ] Binding Concrete-to-Concrete prevented
- [ ] Array Push Syntax for Service Registration prevented
- [ ] Calling make() Inside Controllers Instead of Constructor Injection prevented

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

- *(None â€” this is the foundation topic)*
- Binding Types
- Binding Resolution
- Container Aliases

---


