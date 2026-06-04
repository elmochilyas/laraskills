# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Http Kernel Dispatch
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can trace the full flow from `handle()` through `sendRequestThroughRouter()` to `dispatchToRouter()`
- [ ] Understand why `bootstrap()` is guarded by `hasBeenBootstrapped()`
- [ ] Know the 6 core bootstrappers and their execution order
- [ ] Can identify all 4 core kernel methods: `handle()`, `sendRequestThroughRouter()`, `bootstrap()`, `dispatchToRouter()`
- [ ] Understands that `bootstrap()` runs once per Application instance, guarded by `hasBeenBootstrapped()`
- [ ] Can explain why `dispatchToRouter()` is a closure (decouples Pipeline from Router)
- [ ] Never call `$this->bootstrap()` manually applied
- [ ] Monitor bootstrap time separately from route time applied
- [ ] Use `php artisan optimize` in CI/CD applied
- [ ] Audit middleware order applied
- [ ] Calling bootstrap() Manually prevented
- [ ] Mutating $middleware at Runtime prevented
- [ ] Calling bootstrap() manually prevented
- [ ] Adding global middleware that should be route-specific prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Never call `$this->bootstrap()` manually applied
- [ ] Monitor bootstrap time separately from route time applied
- [ ] Use `php artisan optimize` in CI/CD applied
- [ ] Audit middleware order applied
- [ ] Calling bootstrap() manually prevented
- [ ] Adding global middleware that should be route-specific prevented
- [ ] Assuming middleware runs before provider boot prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Calling bootstrap() Manually prevented
- [ ] Mutating $middleware at Runtime prevented
- [ ] Adding Route-Scoped Middleware as Global prevented
- [ ] Kernel Subclassing for Behavioral Changes prevented
- [ ] Restructuring Kernel Execution Phase Order prevented

---

# Testing Checklist

- [ ] Can identify all 4 core kernel methods: `handle()`, `sendRequestThroughRouter()`, `bootstrap()`, `dispatchToRouter()`
- [ ] Understands that `bootstrap()` runs once per Application instance, guarded by `hasBeenBootstrapped()`
- [ ] Can explain why `dispatchToRouter()` is a closure (decouples Pipeline from Router)
- [ ] Knows the 6 core bootstrappers and their order
- [ ] Can trace the full flow from `handle()` through `sendRequestThroughRouter()` to `dispatchToRouter()`
- [ ] Understand why `bootstrap()` is guarded by `hasBeenBootstrapped()`
- [ ] Know the 6 core bootstrappers and their execution order
- [ ] Can explain why `dispatchToRouter()` is a closure

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Calling bootstrap() Manually prevented
- [ ] Mutating $middleware at Runtime prevented
- [ ] Adding Route-Scoped Middleware as Global prevented
- [ ] Kernel Subclassing for Behavioral Changes prevented
- [ ] Restructuring Kernel Execution Phase Order prevented

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

- Entry Point Mechanics (the flow that enters the kernel)
- Application Bootstrap (Application initialization before kernel dispatch)
- Service Container (kernel and router resolution)
- Middleware Pipeline (the Pipeline class used by `sendRequestThroughRouter()`)
- Console Kernel Dispatch (parallel dispatch path for CLI)
- Boot Order & Timing (the exact sequence within `bootstrap()`)
- Response Sending and Termination (the output side after kernel handle)
- Kernel Architecture (HTTP kernel class hierarchy and bootstrapper array)
- Lifecycle Events and Hooks (RequestHandled event, bootstrap events)

---


