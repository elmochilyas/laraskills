# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Register Vs Boot Methods
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain why resolving in `register()` is harmful (non-deterministic failures)
- [ ] Know what belongs in `register()` (bindings only) vs `boot()` (initialization)
- [ ] Understand the `$app->booted()` callback and when it fires
- [ ] All container bindings are in `register()`
- [ ] No `$this->app->make()` or `resolve()` calls in `register()`
- [ ] Routes, views, event listeners, middleware registration in `boot()`
- [ ] Keep `register()` pure applied
- [ ] Use boot method injection applied
- [ ] Use `booted()` for non-critical initialization applied
- [ ] Never log or write files from `register()` applied
- [ ] Resolution in register() prevented
- [ ] register() as boot() prevented
- [ ] Calling $this->app->make() in register() prevented
- [ ] Defining routes in register() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Keep `register()` pure applied
- [ ] Use boot method injection applied
- [ ] Use `booted()` for non-critical initialization applied
- [ ] Never log or write files from `register()` applied
- [ ] Calling $this->app->make() in register() prevented
- [ ] Defining routes in register() prevented
- [ ] Expecting boot() to run after all others prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Resolution in register() prevented
- [ ] register() as boot() prevented
- [ ] Empty register(), Full boot() prevented
- [ ] Heavy I/O in register() prevented
- [ ] Expecting boot() After All Providers Booted prevented

---

# Testing Checklist

- [ ] All container bindings are in `register()`
- [ ] No `$this->app->make()` or `resolve()` calls in `register()`
- [ ] Routes, views, event listeners, middleware registration in `boot()`
- [ ] No I/O or logging in `register()`
- [ ] Can explain why resolving in `register()` is harmful (non-deterministic failures)
- [ ] Know what belongs in `register()` (bindings only) vs `boot()` (initialization)
- [ ] Understand the `$app->booted()` callback and when it fires
- [ ] Can identify the two-phase guarantee and why it exists
- [ ] Provider correctly separates bindings (register()) from boot-time initialization (boot()).
- [ ] No resolution or side effects in register().
- [ ] Config caching completes without errors.
- [ ] Routes, events, and views work correctly after bootstrap.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Resolution in register() prevented
- [ ] register() as boot() prevented
- [ ] Empty register(), Full boot() prevented
- [ ] Heavy I/O in register() prevented
- [ ] Expecting boot() After All Providers Booted prevented

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

- provider-fundamentals (base provider contract and two-phase model)
- Service Container Bindings (what register() populates in the container)
- deferred-providers (boot timing considerations for deferred providers)
- Service Container Bindings (binding vs resolution lifecycle)
- eager-providers (register/boot execution in eager context)

---


