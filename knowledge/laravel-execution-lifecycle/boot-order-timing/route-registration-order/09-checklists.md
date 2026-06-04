# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Route Registration Order
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Specific routes are defined before wildcard routes
- [ ] All route handlers use controller classes (not closures) if route caching is used
- [ ] Fallback routes are registered last (after all other routes)
- [ ] Specific routes are defined before wildcard routes
- [ ] `Route::fallback()` is the last route definition
- [ ] All route handlers use controller classes (not closures) when route caching is used
- [ ] Specific routes before wildcard routes applied
- [ ] Cache routes in production applied
- [ ] Group related routes applied
- [ ] Use named routes applied
- [ ] Alphabetical Route Ordering prevented
- [ ] Routes Registered in register() prevented
- [ ] Wildcard before specific prevented
- [ ] Closure routes blocking cache prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Specific routes before wildcard routes applied
- [ ] Cache routes in production applied
- [ ] Group related routes applied
- [ ] Use named routes applied
- [ ] Wildcard before specific prevented
- [ ] Closure routes blocking cache prevented
- [ ] Inconsistent group order prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Alphabetical Route Ordering prevented
- [ ] Routes Registered in register() prevented
- [ ] Duplicate Route Definitions prevented
- [ ] Fallback Route Registered Before Other Routes prevented
- [ ] Closure-Only Routes Blocking Caching prevented

---

# Testing Checklist

- [ ] Specific routes are defined before wildcard routes
- [ ] `Route::fallback()` is the last route definition
- [ ] All route handlers use controller classes (not closures) when route caching is used
- [ ] Every route referenced via `route()` has a unique `->name()`
- [ ] Specific routes are defined before wildcard routes
- [ ] All route handlers use controller classes (not closures) if route caching is used
- [ ] Fallback routes are registered last (after all other routes)
- [ ] Route groups have consistent, non-conflicting prefixes
- [ ] Every specific route is reachable and not shadowed by a wildcard
- [ ] Route::fallback() is the last entry and catches only truly unmatched requests
- [ ] php artisan route:cache completes without error
- [ ] All routes referenced via route() have unique names

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Alphabetical Route Ordering prevented
- [ ] Routes Registered in register() prevented
- [ ] Duplicate Route Definitions prevented
- [ ] Fallback Route Registered Before Other Routes prevented
- [ ] Closure-Only Routes Blocking Caching prevented

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

- [Register Phase Order](../register-phase-order/02-knowledge-unit.md)
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md)
- [Middleware Registration Order (ku-06)](../ku-06-middleware-registration-order/02-knowledge-unit.md)
- [Route Caching (ku-02)](../../caching-optimization/ku-02-route-caching/02-knowledge-unit.md)
- The `Router::dispatch()` method iterates `RouteCollection` in array order â€” confirmed in `Illuminate\Routing\Router` source.
- Route caching uses Symfony's `CompiledUrlMatcherDumper` â€” the prefix-compiled tree makes matching O(log n) regardless of registration order.
- Package routes register after application routes by default â€” package providers boot after application providers unless explicitly reordered.
- `route:cache` bootstraps a fresh application â€” this is why it captures the state at cache-build time, not deployment time.

---


