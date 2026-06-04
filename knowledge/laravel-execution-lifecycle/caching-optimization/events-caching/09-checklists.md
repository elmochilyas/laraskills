# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Events Caching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan event:cache` runs successfully without errors
- [ ] All listeners are defined as classes in `$listen` array (no Closures)
- [ ] `php artisan event:list` output matches expected listeners
- [ ] `php artisan event:cache` runs without errors
- [ ] `bootstrap/cache/events.php` exists and contains expected listener map
- [ ] `php artisan event:list` output matches expected event-to-listener mappings
- [ ] Use listener classes, not Closures applied
- [ ] Cache after event changes applied
- [ ] Run after config:cache applied
- [ ] Verify with event:list applied
- [ ] Dynamic Listener Registration as Default prevented
- [ ] Closure-Heavy Event Handling prevented
- [ ] Closure listeners not cached prevented
- [ ] Stale cache after listener change prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use listener classes, not Closures applied
- [ ] Cache after event changes applied
- [ ] Run after config:cache applied
- [ ] Verify with event:list applied
- [ ] Closure listeners not cached prevented
- [ ] Stale cache after listener change prevented
- [ ] Assuming cache includes all listeners prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Dynamic Listener Registration as Default prevented
- [ ] Closure-Heavy Event Handling prevented
- [ ] Stale Cache in Production prevented
- [ ] Not Running event:cache After Configuration Changes prevented
- [ ] Mixed $listen and Auto-Discovery prevented

---

# Testing Checklist

- [ ] `php artisan event:cache` runs without errors
- [ ] `bootstrap/cache/events.php` exists and contains expected listener map
- [ ] `php artisan event:list` output matches expected event-to-listener mappings
- [ ] All listeners use class references, not Closures
- [ ] `php artisan event:cache` runs successfully without errors
- [ ] All listeners are defined as classes in `$listen` array (no Closures)
- [ ] `php artisan event:list` output matches expected listeners
- [ ] Deployment includes `event:cache` step after code changes
- [ ] Listener discovery reduced from 10-30ms to <1ms per request
- [ ] All static listeners captured in the cached manifest
- [ ] No ClassNotFoundException from stale event cache after deployment
- [ ] Event cache is always regenerated during deployment when events change

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Dynamic Listener Registration as Default prevented
- [ ] Closure-Heavy Event Handling prevented
- [ ] Stale Cache in Production prevented
- [ ] Not Running event:cache After Configuration Changes prevented
- [ ] Mixed $listen and Auto-Discovery prevented

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

- [Bootstrap with Event System](../boot-order-timing/bootstrap-with-event-system/02-knowledge-unit.md)
- [Lifecycle Callback Hooks](../boot-order-timing/lifecycle-callback-hooks/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [Optimize Command](./optimize-command/02-knowledge-unit.md)

---


