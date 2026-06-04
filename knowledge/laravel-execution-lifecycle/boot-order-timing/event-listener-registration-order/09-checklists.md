# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Event Listener Registration Order
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All listeners are registered in `$listen` array or via `Event::listen()` in provider `boot()`
- [ ] Event cache is generated for production (`php artisan event:cache`)
- [ ] No listener is registered twice via both $listen and auto-discovery
- [ ] All static listeners use the declarative `$listen` array (not `Event::listen()` in `boot()`)
- [ ] Listeners within each event array are ordered by intended execution order
- [ ] Subscribers are used for groups of related listeners
- [ ] Use $listen array for static mappings applied
- [ ] Use explicit priority sparingly applied
- [ ] Cache events in production applied
- [ ] Use subscribers for related listeners applied
- [ ] Listener State Sharing prevented
- [ ] Events Registered in Controllers prevented
- [ ] Priority confusion prevented
- [ ] Duplicate listeners prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use $listen array for static mappings applied
- [ ] Use explicit priority sparingly applied
- [ ] Cache events in production applied
- [ ] Use subscribers for related listeners applied
- [ ] Priority confusion prevented
- [ ] Duplicate listeners prevented
- [ ] Boot() registration not cached prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Listener State Sharing prevented
- [ ] Events Registered in Controllers prevented
- [ ] Non-Deterministic Ordering via Auto-Discovery prevented
- [ ] Using Event::listen() Instead of $listen Array prevented
- [ ] Stale Event Cache After Listener Changes prevented

---

# Testing Checklist

- [ ] All static listeners use the declarative `$listen` array (not `Event::listen()` in `boot()`)
- [ ] Listeners within each event array are ordered by intended execution order
- [ ] Subscribers are used for groups of related listeners
- [ ] Priority is used sparingly and documented
- [ ] All listeners are registered in `$listen` array or via `Event::listen()` in provider `boot()`
- [ ] Event cache is generated for production (`php artisan event:cache`)
- [ ] No listener is registered twice via both $listen and auto-discovery
- [ ] Priority values are documented and used consistently
- [ ] All static listeners are declared in the $listen array
- [ ] php artisan event:cache succeeds and lists all expected mappings
- [ ] Listeners execute in the intended order at the same priority level
- [ ] No listener is registered twice or silently skipped

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Listener State Sharing prevented
- [ ] Events Registered in Controllers prevented
- [ ] Non-Deterministic Ordering via Auto-Discovery prevented
- [ ] Using Event::listen() Instead of $listen Array prevented
- [ ] Stale Event Cache After Listener Changes prevented

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

- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md)
- [Register Phase Order](../register-phase-order/02-knowledge-unit.md)
- [Deferred Providers (ku-03)](../ku-03-deferred-providers/02-knowledge-unit.md)
- [Event Caching (ku-03)](../../caching-optimization/events-caching/02-knowledge-unit.md)
- The event dispatcher stores listeners in `$this->listeners[$event]` — listeners are appended in registration order.
- `event:cache` generates `bootstrap/cache/events.php` — inspect it to verify listener mappings.
- Auto-discovery uses `ReflectionMethod` on `handle()` to find the event type-hint — expensive and should be cached.
- Listener order at the same priority level follows registration order within `$listen`, then subscriber registration, then auto-discovery.

---


