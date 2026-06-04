# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Provider Fundamentals
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain the two-phase register-then-boot model and why it exists
- [ ] Understand where providers are registered (`bootstrap/providers.php`)
- [ ] Know the difference between eager and deferred providers
- [ ] Provider extends `Illuminate\Support\ServiceProvider`
- [ ] `register()` contains only container bindings and config merges (no resolution)
- [ ] `boot()` contains only post-registration initialization (routes, views, event listeners)
- [ ] Keep `register()` pure â€” bindings only applied
- [ ] Order providers deliberately applied
- [ ] Use `$app->booted()` for post-boot logic applied
- [ ] Audit provider count applied
- [ ] God AppServiceProvider prevented
- [ ] Resolution in register() prevented
- [ ] Resolving services inside register() prevented
- [ ] Forgetting to add provider to bootstrap/providers.php prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Keep `register()` pure â€” bindings only applied
- [ ] Order providers deliberately applied
- [ ] Use `$app->booted()` for post-boot logic applied
- [ ] Audit provider count applied
- [ ] Resolving services inside register() prevented
- [ ] Forgetting to add provider to bootstrap/providers.php prevented
- [ ] Assuming boot() runs after all providers booted prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] God AppServiceProvider prevented
- [ ] Resolution in register() prevented
- [ ] Dynamic Provider Registration prevented
- [ ] Forgetting Provider in bootstrap/providers.php prevented
- [ ] Overriding Constructor Without Calling Parent prevented

---

# Testing Checklist

- [ ] Provider extends `Illuminate\Support\ServiceProvider`
- [ ] `register()` contains only container bindings and config merges (no resolution)
- [ ] `boot()` contains only post-registration initialization (routes, views, event listeners)
- [ ] Provider registered in `bootstrap/providers.php`
- [ ] Can explain the two-phase register-then-boot model and why it exists
- [ ] Understand where providers are registered (`bootstrap/providers.php`)
- [ ] Know the difference between eager and deferred providers
- [ ] Can identify the correct method (`register()` vs `boot()`) for a given operation
- [ ] Provider correctly registers all bindings â€” verified via $app->bound() tests.
- [ ] Boot-time artifacts (routes, views, events) are available after boot.
- [ ] Provider appears in the expected position in the provider registration order.
- [ ] Provider is confirmed registered and in correct order.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] God AppServiceProvider prevented
- [ ] Resolution in register() prevented
- [ ] Dynamic Provider Registration prevented
- [ ] Forgetting Provider in bootstrap/providers.php prevented
- [ ] Overriding Constructor Without Calling Parent prevented

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

- Service Container & Binding (container resolution mechanics)
- Laravel Application Lifecycle Overview (bootstrap sequence)
- Application Bootstrap (bootstrap/providers.php role in provider discovery)
- register-vs-boot-methods (two-phase initialization contract)
- deferred-providers (performance optimization pattern)
- eager-providers (always-on provider behavior)

---


