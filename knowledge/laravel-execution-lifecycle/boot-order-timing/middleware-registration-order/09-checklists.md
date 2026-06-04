# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Middleware Registration Order
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Global middleware list is minimal and necessary for all routes
- [ ] Group middleware order respects dependency direction
- [ ] Route-specific middleware is not accidentally registered globally
- [ ] Global middleware list is minimal and truly necessary for all routes
- [ ] Group middleware order respects dependency direction (modifiers before readers)
- [ ] `SubstituteBindings` runs before custom middleware that uses route model binding
- [ ] Least-privilege middleware placement applied
- [ ] Order by dependency applied
- [ ] Use middleware aliases applied
- [ ] Leverage middleware groups applied
- [ ] Arbitrary Reordering of Global Middleware prevented
- [ ] Registering Middleware in Wrong Group prevented
- [ ] Wrong group assignment prevented
- [ ] Reverse priority prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Least-privilege middleware placement applied
- [ ] Order by dependency applied
- [ ] Use middleware aliases applied
- [ ] Leverage middleware groups applied
- [ ] Wrong group assignment prevented
- [ ] Reverse priority prevented
- [ ] Over-globalization prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Arbitrary Reordering of Global Middleware prevented
- [ ] Registering Middleware in Wrong Group prevented
- [ ] Global Middleware for Route-Specific Concerns prevented
- [ ] Ignoring Middleware Priority When Mixing Sources prevented
- [ ] Fat Controllers â€” middleware logic that should be global pushed into controllers instead. prevented

---

# Testing Checklist

- [ ] Global middleware list is minimal and truly necessary for all routes
- [ ] Group middleware order respects dependency direction (modifiers before readers)
- [ ] `SubstituteBindings` runs before custom middleware that uses route model binding
- [ ] CORS middleware runs before auth middleware (for OPTIONS preflight handling)
- [ ] Global middleware list is minimal and necessary for all routes
- [ ] Group middleware order respects dependency direction
- [ ] Route-specific middleware is not accidentally registered globally
- [ ] `SubstituteBindings` runs before any middleware that uses route model binding
- [ ] Global middleware list contains only 3-5 truly global entries
- [ ] All middleware respects dependency direction (modifiers before readers)
- [ ] CORS preflight requests succeed without authentication
- [ ] Custom middleware accessing route models always receives resolved model instances

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Arbitrary Reordering of Global Middleware prevented
- [ ] Registering Middleware in Wrong Group prevented
- [ ] Global Middleware for Route-Specific Concerns prevented
- [ ] Ignoring Middleware Priority When Mixing Sources prevented
- [ ] Fat Controllers â€” middleware logic that should be global pushed into controllers instead. prevented

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

- [Pipeline Pattern Fundamentals](../../middleware-pipeline/pipeline-pattern-fundamentals/02-knowledge-unit.md)
- [Middleware Configuration in Bootstrap](../../middleware-pipeline/middleware-configuration-in-bootstrap/02-knowledge-unit.md)
- [Middleware Priority](../../middleware-pipeline/middleware-priority/02-knowledge-unit.md)

---


