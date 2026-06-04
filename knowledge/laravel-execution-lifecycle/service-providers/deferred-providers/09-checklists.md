# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Deferred Providers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can implement `DeferrableProvider` and `provides()` correctly
- [ ] Understand when a provider cannot be deferred (boot-time registrations)
- [ ] Know how the deferred manifest works and when to rebuild it
- [ ] Provider implements `DeferrableProvider` interface
- [ ] `provides()` returns every identifier registered in `register()` (classes, interfaces, aliases)
- [ ] `provides()` does NOT include identifiers only used in `boot()` (these are not bound in the container)
- [ ] Implement `DeferrableProvider` and `provides()` together applied
- [ ] Return all service identifiers from `provides()` applied
- [ ] Rebuild manifest after changes applied
- [ ] Do not defer providers with `boot()` side effects applied
- [ ] Deferring Everything prevented
- [ ] Stale Manifest After Deployment prevented
- [ ] Forgetting provides() or returning empty array prevented
- [ ] Listing services in provides() that aren't registered in register() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Implement `DeferrableProvider` and `provides()` together applied
- [ ] Return all service identifiers from `provides()` applied
- [ ] Rebuild manifest after changes applied
- [ ] Do not defer providers with `boot()` side effects applied
- [ ] Forgetting provides() or returning empty array prevented
- [ ] Listing services in provides() that aren't registered in register() prevented
- [ ] Deferring provider with route/event registration prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Deferring Everything prevented
- [ ] Stale Manifest After Deployment prevented
- [ ] Partial provides() prevented
- [ ] Deferred Provider with Boot-Time Side Effects prevented
- [ ] Missing Manifest After Changes prevented

---

# Testing Checklist

- [ ] Provider implements `DeferrableProvider` interface
- [ ] `provides()` returns every identifier registered in `register()` (classes, interfaces, aliases)
- [ ] `provides()` does NOT include identifiers only used in `boot()` (these are not bound in the container)
- [ ] Provider's `boot()` does NOT register routes, views, event listeners, or middleware
- [ ] Can implement `DeferrableProvider` and `provides()` correctly
- [ ] Understand when a provider cannot be deferred (boot-time registrations)
- [ ] Know how the deferred manifest works and when to rebuild it
- [ ] Can diagnose stale manifest issues
- [ ] Provider only loads when its services are resolved; php artisan about does not show it in the loaded provider list until a service is requested.
- [ ] All service identifiers in register() are resolvable after deferral.
- [ ] Manifest is correctly generated and survives deployment cache regeneration.
- [ ] All deferred services resolve correctly after code changes.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Deferring Everything prevented
- [ ] Stale Manifest After Deployment prevented
- [ ] Partial provides() prevented
- [ ] Deferred Provider with Boot-Time Side Effects prevented
- [ ] Missing Manifest After Changes prevented

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

- provider-fundamentals (provider contract and registration flow)
- Service Container Bindings (what deferred providers register)
- eager-providers (contrast with deferred loading behavior)
- eager-providers (eager vs deferred tradeoffs)
- package-discovery-and-auto-registration (auto-discovered deferred providers)
- register-vs-boot-methods (register/boot timing for deferred providers)

---


