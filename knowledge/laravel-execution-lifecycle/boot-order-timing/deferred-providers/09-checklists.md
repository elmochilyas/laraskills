# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Deferred Providers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Every deferred provider has a complete `provides()` method covering all bindings and aliases
- [ ] No deferred provider has boot() logic that must run on every request
- [ ] Services cache is regenerated after any provider change
- [ ] Provider implements `DeferrableProvider` interface (not legacy `$defer` property)
- [ ] `provides()` returns ALL services, bindings, and aliases the provider registers
- [ ] No mandatory `boot()` logic exists that must run on every request
- [ ] Use `DeferrableProvider` interface applied
- [ ] Keep `provides()` complete applied
- [ ] Use `when()` sparingly applied
- [ ] Audit after Octane deployment applied
- [ ] Deferring Providers with Boot Logic prevented
- [ ] Missing provides() Method prevented
- [ ] Forgetting provides() prevented
- [ ] Early type-hint defeat prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use `DeferrableProvider` interface applied
- [ ] Keep `provides()` complete applied
- [ ] Use `when()` sparingly applied
- [ ] Audit after Octane deployment applied
- [ ] Forgetting provides() prevented
- [ ] Early type-hint defeat prevented
- [ ] Missing aliases in provides() prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Deferring Providers with Boot Logic prevented
- [ ] Missing provides() Method prevented
- [ ] Over-Deferral for Frequently-Used Services prevented
- [ ] Forgetting Services Cache Regeneration prevented
- [ ] Queue Abuse â€” using deferred providers to defer non-trivial initialization logic. prevented

---

# Testing Checklist

- [ ] Provider implements `DeferrableProvider` interface (not legacy `$defer` property)
- [ ] `provides()` returns ALL services, bindings, and aliases the provider registers
- [ ] No mandatory `boot()` logic exists that must run on every request
- [ ] Services cache is regenerated and verified
- [ ] Every deferred provider has a complete `provides()` method covering all bindings and aliases
- [ ] No deferred provider has boot() logic that must run on every request
- [ ] Services cache is regenerated after any provider change
- [ ] Deferred services are not type-hinted in high-traffic class constructors
- [ ] Deferred providers skip both phases on requests that don't use their services
- [ ] All services from deferred providers resolve correctly on first use
- [ ] Event listeners in deferred providers always fire (via correct when() configuration)
- [ ] Services cache is regenerated after every provider change

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Deferring Providers with Boot Logic prevented
- [ ] Missing provides() Method prevented
- [ ] Over-Deferral for Frequently-Used Services prevented
- [ ] Forgetting Services Cache Regeneration prevented
- [ ] Queue Abuse â€” using deferred providers to defer non-trivial initialization logic. prevented

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

- [Register vs Boot (ku-01)](./ku-01-register-vs-boot/02-knowledge-unit.md)
- [Provider Registration Order (ku-02)](./ku-02-provider-registration-order/02-knowledge-unit.md)
- [Eager Providers](../../service-providers/eager-providers/02-knowledge-unit.md)
- [Services Cache](../../caching-optimization/services-cache/02-knowledge-unit.md)

---


