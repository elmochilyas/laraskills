# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** View Caching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `storage/framework/views/` exists and is writable
- [ ] Compiled view files are generated on first template access
- [ ] `php artisan view:clear` succeeds without errors
- [ ] `php artisan view:clear` runs successfully during deployment when templates change
- [ ] Compiled view files generated on first template access after cache clear
- [ ] Blade templates update correctly when source files change (timestamp invalidation)
- [ ] Let Blade handle caching automatically applied
- [ ] Use view:clear in deployment applied
- [ ] Minimize view inheritance depth applied
- [ ] Use view caching for optimization applied
- [ ] Business Logic in Blade Templates prevented
- [ ] Bypassing Blade Compilation with Raw PHP prevented
- [ ] Not clearing views on deploy prevented
- [ ] Committing compiled views prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Let Blade handle caching automatically applied
- [ ] Use view:clear in deployment applied
- [ ] Minimize view inheritance depth applied
- [ ] Use view caching for optimization applied
- [ ] Not clearing views on deploy prevented
- [ ] Committing compiled views prevented
- [ ] Extremely deep view nesting prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Business Logic in Blade Templates prevented
- [ ] Bypassing Blade Compilation with Raw PHP prevented
- [ ] View Composer Overuse prevented
- [ ] Not Clearing Views on Deploy prevented
- [ ] Extremely Deep View Nesting prevented

---

# Testing Checklist

- [ ] `php artisan view:clear` runs successfully during deployment when templates change
- [ ] Compiled view files generated on first template access after cache clear
- [ ] Blade templates update correctly when source files change (timestamp invalidation)
- [ ] No business logic (DB queries, heavy computation) exists in Blade templates
- [ ] `storage/framework/views/` exists and is writable
- [ ] Compiled view files are generated on first template access
- [ ] `php artisan view:clear` succeeds without errors
- [ ] Views update correctly when templates change (timestamp invalidation works)
- [ ] Template changes consistently reflected after every deployment
- [ ] First view access after deploy has zero compilation delay (pre-compiled)
- [ ] No business logic exists in Blade templates
- [ ] View nesting is shallow, maintainable, and performant

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Business Logic in Blade Templates prevented
- [ ] Bypassing Blade Compilation with Raw PHP prevented
- [ ] View Composer Overuse prevented
- [ ] Not Clearing Views on Deploy prevented
- [ ] Extremely Deep View Nesting prevented

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

- [Service Caching Meta (ku-05)](../services-cache/02-knowledge-unit.md)
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md)
- [OpCache Autoloader (ku-07)](../ku-07-opcache-autoloader/02-knowledge-unit.md)
- Blade engine at `Illuminate\View\Engines\CompilerEngine` checks `filemtime()` for cache validity.
- Compiled view path: `storage/framework/views/<md5_hash>.php`.
- `view:cache` (Laravel 9+) pre-compiles all registered views — useful for production warmup.
- The `optimize:clear` command includes `view:clear`.

---


