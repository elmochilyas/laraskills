# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Aliases
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Register a custom middleware alias in `bootstrap/app.php`
- [ ] Use the alias in a route definition â€” verify it resolves correctly
- [ ] Test parameterized alias: `'throttle:10,1'` â€” verify parameters reach middleware
- [ ] Alias name is lowercase, hyphenated if multi-word
- [ ] Alias does not collide with framework defaults
- [ ] Alias maps directly to FQCN, not to another alias
- [ ] Register custom aliases for all application middleware applied
- [ ] Use consistent naming conventions applied
- [ ] Document alias collision risks applied
- [ ] Test alias resolution after route caching applied
- [ ] Using Class Short Name Instead of Alias prevented
- [ ] Forgetting to Register Alias prevented
- [ ] Using class short name instead of alias prevented
- [ ] Forgetting to register alias prevented

---

# Architecture Checklist

- [ ] Decouples routes from class locations architecture followed
- [ ] Colon-based parameter syntax architecture followed
- [ ] Resolution happens during route middleware gathering architecture followed
- [ ] Registered in Kernel or bootstrap/app.php architecture followed

---

# Implementation Checklist

- [ ] Register custom aliases for all application middleware applied
- [ ] Use consistent naming conventions applied
- [ ] Document alias collision risks applied
- [ ] Test alias resolution after route caching applied
- [ ] Using class short name instead of alias prevented
- [ ] Forgetting to register alias prevented
- [ ] Overriding framework alias unintentionally prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using Class Short Name Instead of Alias prevented
- [ ] Forgetting to Register Alias prevented
- [ ] Alias Collision Between Packages prevented
- [ ] Not Re-Caching After Alias Changes prevented
- [ ] Over-Abstraction of Aliases prevented

---

# Testing Checklist

- [ ] Alias name is lowercase, hyphenated if multi-word
- [ ] Alias does not collide with framework defaults
- [ ] Alias maps directly to FQCN, not to another alias
- [ ] Route using the alias resolves correctly (verify with `route:list -v`)
- [ ] Register a custom middleware alias in `bootstrap/app.php`
- [ ] Use the alias in a route definition â€” verify it resolves correctly
- [ ] Test parameterized alias: `'throttle:10,1'` â€” verify parameters reach middleware
- [ ] Run `php artisan route:cache` and verify cached routes use resolved class names
- [ ] All custom middleware used in route files has a registered alias
- [ ] Route definitions use short, readable alias strings instead of FQCNs
- [ ] No alias collisions exist
- [ ] Route caching works correctly with all aliases

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using Class Short Name Instead of Alias prevented
- [ ] Forgetting to Register Alias prevented
- [ ] Alias Collision Between Packages prevented
- [ ] Not Re-Caching After Alias Changes prevented
- [ ] Over-Abstraction of Aliases prevented

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

- Pipeline Pattern Fundamentals (pipe resolution mechanics)
- Route Middleware (alias usage in route definitions)
- Service Container (class resolution from aliases)
- Middleware Parameters (colon-delimited parameter passing with aliases)
- Route Middleware (alias resolution in route middleware gathering)

---


