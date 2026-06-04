# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Register Vs Boot
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No `$this->app->make()` calls exist in any `register()` method
- [ ] All container bindings are in `register()` or `$bindings`/`$singletons` properties
- [ ] Route/view/listener registration is in `boot()`, not `register()`
- [ ] `register()` contains only bindings and no resolution calls
- [ ] `boot()` contains all initialization logic
- [ ] No `$this->app->make()` exists in `register()`
- [ ] Keep register() pure applied
- [ ] Use boot() for initialization applied
- [ ] Document phase expectations applied
- [ ] Prefer $bindings/$singletons properties applied
- [ ] Service Resolution in register() prevented
- [ ] Side Effects in register() prevented
- [ ] Resolving in register() prevented
- [ ] Heavy I/O in register() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Keep register() pure applied
- [ ] Use boot() for initialization applied
- [ ] Document phase expectations applied
- [ ] Prefer $bindings/$singletons properties applied
- [ ] Resolving in register() prevented
- [ ] Heavy I/O in register() prevented
- [ ] Phase order assumptions prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Service Resolution in register() prevented
- [ ] Side Effects in register() prevented
- [ ] Manual Provider Registration Instead of Framework Orchestration prevented
- [ ] Business Logic in register() That Belongs in boot() prevented

---

# Testing Checklist

- [ ] `register()` contains only bindings and no resolution calls
- [ ] `boot()` contains all initialization logic
- [ ] No `$this->app->make()` exists in `register()`
- [ ] Simple mappings use `$bindings`/`$singletons` properties
- [ ] No `$this->app->make()` calls exist in any `register()` method
- [ ] All container bindings are in `register()` or `$bindings`/`$singletons` properties
- [ ] Route/view/listener registration is in `boot()`, not `register()`
- [ ] The provider passes `php artisan optimize` without errors
- [ ] Every provider clearly separates bindings (in register()) from initialization (in boot())
- [ ] No BindingResolutionException occurs from resolution in register()
- [ ] All bindings are available when any provider's boot() runs
- [ ] The codebase has no manual $app->boot() calls

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Service Resolution in register() prevented
- [ ] Side Effects in register() prevented
- [ ] Manual Provider Registration Instead of Framework Orchestration prevented
- [ ] Business Logic in register() That Belongs in boot() prevented

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

- [Provider Fundamentals](../service-providers/provider-fundamentals/02-knowledge-unit.md)
- [Provider Registration Order (ku-02)](./ku-02-provider-registration-order/02-knowledge-unit.md)
- [Deferred Providers (ku-03)](./ku-03-deferred-providers/02-knowledge-unit.md)
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md)

---


