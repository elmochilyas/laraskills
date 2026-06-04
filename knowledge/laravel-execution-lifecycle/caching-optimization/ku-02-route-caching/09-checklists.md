# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Route Caching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] Use controller strings for all routes applied
- [ ] Cache after config:cache applied
- [ ] Validate routes before caching applied
- [ ] Include in deployment applied
- [ ] Mixed Closure/Controller Routes prevented
- [ ] Route Cache in Development prevented
- [ ] Closure routes prevented
- [ ] Missing re-cache after route addition prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use controller strings for all routes applied
- [ ] Cache after config:cache applied
- [ ] Validate routes before caching applied
- [ ] Include in deployment applied
- [ ] Closure routes prevented
- [ ] Missing re-cache after route addition prevented
- [ ] Caching without config cache prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Mixed Closure/Controller Routes prevented
- [ ] Route Cache in Development prevented
- [ ] Ignoring route:list Output prevented
- [ ] Caching Without Config Cache First prevented
- [ ] Stale Cache After Provider Change prevented

---

# Testing Checklist

- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] `php artisan route:list` output matches expected routes after caching
- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:list` output matches expectations after caching
- [ ] Route registration overhead reduced from 20-40ms to 0ms
- [ ] No Closure routes exist in the codebase
- [ ] All routes cache successfully on every production deployment
- [ ] URL matching resolves correctly via compiled prefix tree

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Mixed Closure/Controller Routes prevented
- [ ] Route Cache in Development prevented
- [ ] Ignoring route:list Output prevented
- [ ] Caching Without Config Cache First prevented
- [ ] Stale Cache After Provider Change prevented

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

- [Config Caching (ku-01)](../config-caching/02-knowledge-unit.md)
- [Route Registration Order (ku-07)](../../boot-order-timing/ku-07-route-registration-order/02-knowledge-unit.md)
- [Optimize Command (ku-09)](../optimize-command/02-knowledge-unit.md)
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md)
- `RouteCacheCommand::handle()` bootstraps a fresh application to collect routes — this is why it reads all route files.
- The compiled matcher uses `Symfony\Component\Routing\Matcher\CompiledUrlMatcherDumper` which creates a prefix tree.
- `Route::redirect()`, `Route::view()`, and `Route::permanentRedirect()` are converted to internal controller classes and ARE cacheable.
- After `route:cache`, inspect `bootstrap/cache/routes.php` to see the serialized compiled matcher.

---


