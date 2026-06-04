# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Kernel Bootstrappers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read `Illuminate\Foundation\Application::bootstrapWith()` source
- [ ] List all six bootstrappers in exact order
- [ ] Understand what each bootstrapper does internally
- [ ] Bootstrapper class implements `Illuminate\Contracts\Foundation\Bootstrapper`
- [ ] `bootstrap()` method does not resolve services whose providers haven't run yet
- [ ] Bootstrapper is inserted at the correct position relative to the six core bootstrappers
- [ ] Use config caching in production to eliminate filesystem I/O during bootstrap. followed
- [ ] Never resolve services in bootstrappers that depend on other bootstrappers yet to run. followed
- [ ] Register custom bootstrappers in the correct position relative to the six core bootstrappers. followed
- [ ] Defer service providers that only register container bindings. followed
- [ ] Keep custom bootstrappers fast and side-effect-free beyond their single responsibility. followed
- [ ] Do not attempt to remove or skip core bootstrappers. followed
- [ ] Keep bootstrappers pure and fast applied
- [ ] Never resolve services in bootstrappers that depend on other bootstrappers applied
- [ ] Use config caching in production applied
- [ ] Defer providers that only bind applied
- [ ] Bootstrapper as Service Provider prevented
- [ ] Heavy Bootstrapper prevented
- [ ] Assuming bootstrap order is configurable prevented
- [ ] Forgetting parent::bootstrap() prevented

---

# Architecture Checklist

- [ ] Bootstrappers are framework-owned architecture followed
- [ ] Container-resolved architecture followed
- [ ] Single-pass sequential architecture followed
- [ ] Before middleware architecture followed

---

# Implementation Checklist

- [ ] Use config caching in production to eliminate filesystem I/O during bootstrap. followed
- [ ] Never resolve services in bootstrappers that depend on other bootstrappers yet to run. followed
- [ ] Register custom bootstrappers in the correct position relative to the six core bootstrappers. followed
- [ ] Defer service providers that only register container bindings. followed
- [ ] Keep custom bootstrappers fast and side-effect-free beyond their single responsibility. followed
- [ ] Keep bootstrappers pure and fast applied
- [ ] Never resolve services in bootstrappers that depend on other bootstrappers applied
- [ ] Use config caching in production applied
- [ ] Defer providers that only bind applied
- [ ] Assuming bootstrap order is configurable prevented
- [ ] Forgetting parent::bootstrap() prevented
- [ ] Dependency on bootstrapper state in tests prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Bootstrapper as Service Provider prevented
- [ ] Heavy Bootstrapper prevented
- [ ] Custom Bootstrapper Duplicating Core prevented
- [ ] Removing Core Bootstrappers prevented
- [ ] Assuming Bootstrapper Order Is Configurable prevented
- [ ] Use config caching in production to eliminate filesystem I/O during bootstrap. followed
- [ ] Never resolve services in bootstrappers that depend on other bootstrappers yet to run. followed
- [ ] Register custom bootstrappers in the correct position relative to the six core bootstrappers. followed
- [ ] Defer service providers that only register container bindings. followed
- [ ] Keep custom bootstrappers fast and side-effect-free beyond their single responsibility. followed
- [ ] Do not attempt to remove or skip core bootstrappers. followed

---

# Testing Checklist

- [ ] Bootstrapper class implements `Illuminate\Contracts\Foundation\Bootstrapper`
- [ ] `bootstrap()` method does not resolve services whose providers haven't run yet
- [ ] Bootstrapper is inserted at the correct position relative to the six core bootstrappers
- [ ] No core bootstrapper is removed or replaced â€” only custom bootstrappers are added alongside
- [ ] Read `Illuminate\Foundation\Application::bootstrapWith()` source
- [ ] List all six bootstrappers in exact order
- [ ] Understand what each bootstrapper does internally
- [ ] Compare HTTP and Console kernel bootstrapper arrays â€” verify they are identical
- [ ] Custom bootstrapper runs at the exact intended position in the bootstrapper sequence
- [ ] All services resolved in bootstrap() are guaranteed available at that position
- [ ] Bootstrapper adds less than 5ms to every request's bootstrap time
- [ ] Both HTTP and Console kernels execute the bootstrapper correctly

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Bootstrapper as Service Provider prevented
- [ ] Heavy Bootstrapper prevented
- [ ] Custom Bootstrapper Duplicating Core prevented
- [ ] Removing Core Bootstrappers prevented
- [ ] Assuming Bootstrapper Order Is Configurable prevented

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

- **Service Container** â€” how `$app->bootstrapWith()` iterates and resolves each bootstrapper from the container
- **Service Providers** â€” understanding `register()` vs `boot()` phases, provider deferral
- **Facades** â€” how `RegisterFacades` bootstrapper sets up the facade alias system
- **HTTP Kernel Internals** â€” where the bootstrapper array is defined and executed per request
- **Console Kernel Internals** â€” the console kernel's identical bootstrapper sequence in CLI context
- **Configuration Caching Internals** â€” how `php artisan config:cache` optimizes `LoadConfiguration`

---


