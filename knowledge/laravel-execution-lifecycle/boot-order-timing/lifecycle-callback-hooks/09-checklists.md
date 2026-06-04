# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Lifecycle Callback Hooks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] booting/booted hooks are registered in register() phase, not boot()
- [ ] No heavy I/O in booting() callbacks
- [ ] booted() callbacks are not used to replace provider boot() logic
- [ ] `booting()`/`booted()` callbacks are registered in `register()`, not `boot()`
- [ ] `booting()` callbacks are lightweight (no I/O, no heavy computation)
- [ ] `booted()` callbacks are not used to replace individual provider `boot()` logic
- [ ] Use booted() for post-provider setup applied
- [ ] Keep hooks focused applied
- [ ] Register hooks early applied
- [ ] Prefer provider boot() over hooks applied
- [ ] Callback Spaghetti prevented
- [ ] Using Hooks Instead of Provider boot() prevented
- [ ] Registering hook too late prevented
- [ ] Registering booting() in booted() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use booted() for post-provider setup applied
- [ ] Keep hooks focused applied
- [ ] Register hooks early applied
- [ ] Prefer provider boot() over hooks applied
- [ ] Registering hook too late prevented
- [ ] Registering booting() in booted() prevented
- [ ] Heavy work in booting() prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Callback Spaghetti prevented
- [ ] Using Hooks Instead of Provider boot() prevented
- [ ] State Mutation in booting() Callbacks prevented
- [ ] Forgetting Fire-Once Semantics prevented
- [ ] Heavy Work in booting() Callbacks prevented

---

# Testing Checklist

- [ ] `booting()`/`booted()` callbacks are registered in `register()`, not `boot()`
- [ ] `booting()` callbacks are lightweight (no I/O, no heavy computation)
- [ ] `booted()` callbacks are not used to replace individual provider `boot()` logic
- [ ] Fire-once semantics are understood: `booted()` fires once per application instance
- [ ] booting/booted hooks are registered in register() phase, not boot()
- [ ] No heavy I/O in booting() callbacks
- [ ] booted() callbacks are not used to replace provider boot() logic
- [ ] Fire-once semantics are understood and accounted for in testing
- [ ] booting() callbacks execute before any provider boots and are lightweight
- [ ] booted() callbacks execute after all providers boot and successfully coordinate cross-provider setup
- [ ] No callback is registered in the wrong phase (e.g., booting() in boot())
- [ ] Fire-once semantics are respected in testing and Octane environments

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Callback Spaghetti prevented
- [ ] Using Hooks Instead of Provider boot() prevented
- [ ] State Mutation in booting() Callbacks prevented
- [ ] Forgetting Fire-Once Semantics prevented
- [ ] Heavy Work in booting() Callbacks prevented

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
- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md)
- [Bootstrap with Event System](../bootstrap-with-event-system/02-knowledge-unit.md)
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md)
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md)

---


