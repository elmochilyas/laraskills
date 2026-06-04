# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Route Middleware
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Create a route with inline middleware and verify with `route:list -v`
- [ ] Apply middleware to specific controller methods using `only`/`except`
- [ ] Compare `route:list -v` output before and after route caching
- [ ] Middleware assigned at correct level (global, group, or route)
- [ ] No duplication of group middleware on individual routes
- [ ] Inline middleware used for new code (not controller constructor)
- [ ] Prefer inline middleware over controller middleware applied
- [ ] Use `only`/`except` for resource controllers applied
- [ ] Avoid closure middleware on production routes applied
- [ ] Verify with `php artisan route:list -v` applied
- [ ] Closure Middleware on Cached Routes prevented
- [ ] Controller Middleware Over Inline prevented
- [ ] Duplicating group middleware on routes prevented
- [ ] Using closures for middleware in production prevented

---

# Architecture Checklist

- [ ] Three levels of assignment architecture followed
- [ ] Controller middleware exists for backwards compatibility architecture followed
- [ ] Middleware merging architecture followed
- [ ] Method-specific filtering architecture followed

---

# Implementation Checklist

- [ ] Prefer inline middleware over controller middleware applied
- [ ] Use `only`/`except` for resource controllers applied
- [ ] Avoid closure middleware on production routes applied
- [ ] Verify with `php artisan route:list -v` applied
- [ ] Duplicating group middleware on routes prevented
- [ ] Using closures for middleware in production prevented
- [ ] Middleware only/except typo prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Closure Middleware on Cached Routes prevented
- [ ] Controller Middleware Over Inline prevented
- [ ] Middleware Duplication prevented
- [ ] Priority Conflicts at Route Level prevented
- [ ] Not Using only/except for Resource Controllers prevented

---

# Testing Checklist

- [ ] Middleware assigned at correct level (global, group, or route)
- [ ] No duplication of group middleware on individual routes
- [ ] Inline middleware used for new code (not controller constructor)
- [ ] Closure middleware not used on production routes
- [ ] Create a route with inline middleware and verify with `route:list -v`
- [ ] Apply middleware to specific controller methods using `only`/`except`
- [ ] Compare `route:list -v` output before and after route caching
- [ ] Verify pre-middleware and post-middleware execution timing
- [ ] All routes have the correct middleware at the correct assignment level
- [ ] No middleware duplication on any route
- [ ] route:list -v output matches expectations
- [ ] Route caching works without issues

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Closure Middleware on Cached Routes prevented
- [ ] Controller Middleware Over Inline prevented
- [ ] Middleware Duplication prevented
- [ ] Priority Conflicts at Route Level prevented
- [ ] Not Using only/except for Resource Controllers prevented

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

- Pipeline Pattern Fundamentals (pipe execution model)
- Middleware Groups (group-to-route middleware inheritance)
- Kernel Architecture (route dispatching flow)
- Middleware Aliases (shorthand names for route middleware)
- Middleware Parameters (colon-delimited parameter passing)

---


