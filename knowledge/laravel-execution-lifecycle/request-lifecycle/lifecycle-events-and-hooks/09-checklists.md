# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Lifecycle Events And Hooks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can list all lifecycle hooks in chronological order
- [ ] Understand the difference between callbacks and event dispatcher listeners
- [ ] Know when `booting()` vs `booted()` callbacks actually fire
- [ ] `booting()` callbacks are registered in provider `register()`, never in `boot()`
- [ ] `booted()` callbacks are used for post-boot initialization, not `booting()`
- [ ] `RequestHandled` listeners are sub-millisecond â€” no I/O, no heavy computation
- [ ] Use `Terminating` for cleanup, not `RequestHandled` applied
- [ ] Keep `RequestHandled` listeners sub-millisecond applied
- [ ] Use `booting()` for logic that must run after all providers register applied
- [ ] Test wildcard bootstrap event listeners applied
- [ ] Using RequestHandled for Post-Response Cleanup prevented
- [ ] Heavy Computation in RequestHandled Listeners prevented
- [ ] Assuming booted() fires after all providers register prevented
- [ ] Registering booting() in boot() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use `Terminating` for cleanup, not `RequestHandled` applied
- [ ] Keep `RequestHandled` listeners sub-millisecond applied
- [ ] Use `booting()` for logic that must run after all providers register applied
- [ ] Test wildcard bootstrap event listeners applied
- [ ] Assuming booted() fires after all providers register prevented
- [ ] Registering booting() in boot() prevented
- [ ] Heavy computation in RequestHandled listener prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using RequestHandled for Post-Response Cleanup prevented
- [ ] Heavy Computation in RequestHandled Listeners prevented
- [ ] Registering booting() in Provider boot() Method prevented
- [ ] Nested Lifecycle Hook Registration prevented
- [ ] Container Resolution in booting() Callbacks prevented

---

# Testing Checklist

- [ ] `booting()` callbacks are registered in provider `register()`, never in `boot()`
- [ ] `booted()` callbacks are used for post-boot initialization, not `booting()`
- [ ] `RequestHandled` listeners are sub-millisecond â€” no I/O, no heavy computation
- [ ] Response modification uses `RequestHandled`, not `Terminating`
- [ ] Can list all lifecycle hooks in chronological order
- [ ] Understand the difference between callbacks and event dispatcher listeners
- [ ] Know when `booting()` vs `booted()` callbacks actually fire
- [ ] Can explain the dual `Terminating` mechanism (callbacks + event)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using RequestHandled for Post-Response Cleanup prevented
- [ ] Heavy Computation in RequestHandled Listeners prevented
- [ ] Registering booting() in Provider boot() Method prevented
- [ ] Nested Lifecycle Hook Registration prevented
- [ ] Container Resolution in booting() Callbacks prevented

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

- HTTP Kernel Dispatch (hooks fire within kernel handle/terminate)
- Response Sending and Termination (termination phase context)
- Service Providers (boot callbacks register during provider lifecycle)
- Boot Order & Timing (complete hook timing within bootstrap sequence)
- Long-Running Process Architecture (Octane's use of Terminating for state flush)
- Console Kernel Dispatch (console hooks via Terminating event)
- Entry Point Mechanics (LARAVEL_START constant for duration measurement)

---


