# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Singleton State Leaks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Identify all `singleton()` calls across application and third-party providers
- [ ] For each singleton, determine if it holds mutable per-request state
- [ ] Convert request-aware singletons to `scoped()` or stateless design
- [ ] Sequential test passes: Alice's data does NOT appear in Bob's response
- [ ] Leaking singleton identified and documented
- [ ] Fix applied: converted to `scoped()`, stateless redesign, or RequestTerminated cleanup
- [ ] Audit every singleton for mutable per-request state. followed
- [ ] Convert request-aware singletons to scoped(). followed
- [ ] Test with two sequential requests for different users. followed
- [ ] Never use app()->instance() for per-request state. followed
- [ ] Do not use Auth::onceUsingId() in Octane workers. followed
- [ ] Keep Eloquent caches out of singleton properties. followed
- [ ] Audit every singleton for mutable state applied
- [ ] Convert request-aware singletons to `scoped()` applied
- [ ] Test with two sequential requests applied
- [ ] Use `$app->scoped()` instead of manual `forgetInstance()` applied
- [ ] Singleton as Catch-All Cache prevented
- [ ] Manual forgetInstance() Calls prevented
- [ ] Assuming FPM safety = Octane safety prevented
- [ ] Using Auth::onceUsingId() in Octane prevented

---

# Architecture Checklist

- [ ] Container does not auto-reset singletons architecture followed
- [ ] `shared = true` is the source of truth architecture followed
- [ ] Scoped bindings as the solution architecture followed
- [ ] Stateless Singleton pattern architecture followed

---

# Implementation Checklist

- [ ] Audit every singleton for mutable per-request state. followed
- [ ] Convert request-aware singletons to scoped(). followed
- [ ] Test with two sequential requests for different users. followed
- [ ] Never use app()->instance() for per-request state. followed
- [ ] Do not use Auth::onceUsingId() in Octane workers. followed
- [ ] Audit every singleton for mutable state applied
- [ ] Convert request-aware singletons to `scoped()` applied
- [ ] Test with two sequential requests applied
- [ ] Use `$app->scoped()` instead of manual `forgetInstance()` applied
- [ ] Assuming FPM safety = Octane safety prevented
- [ ] Using Auth::onceUsingId() in Octane prevented
- [ ] Storing user on app instance prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Singleton as Catch-All Cache prevented
- [ ] Manual forgetInstance() Calls prevented
- [ ] Cloning Singletons Manually prevented
- [ ] Ignoring the Problem (No Audit) prevented
- [ ] Singleton Caching Query Results prevented
- [ ] Audit every singleton for mutable per-request state. followed
- [ ] Convert request-aware singletons to scoped(). followed
- [ ] Test with two sequential requests for different users. followed
- [ ] Never use app()->instance() for per-request state. followed
- [ ] Do not use Auth::onceUsingId() in Octane workers. followed
- [ ] Keep Eloquent caches out of singleton properties. followed

---

# Testing Checklist

- [ ] Sequential test passes: Alice's data does NOT appear in Bob's response
- [ ] Leaking singleton identified and documented
- [ ] Fix applied: converted to `scoped()`, stateless redesign, or RequestTerminated cleanup
- [ ] No `app()->instance()` used for per-request state
- [ ] Identify all `singleton()` calls across application and third-party providers
- [ ] For each singleton, determine if it holds mutable per-request state
- [ ] Convert request-aware singletons to `scoped()` or stateless design
- [ ] Write a test: send two requests with different auth users, assert data isolation
- [ ] Sequential Alice/Bob test passes â€” zero cross-request data contamination
- [ ] All identified leaky singletons are fixed or have documented remediation plan
- [ ] CI blocks new singleton() registrations without human review
- [ ] No app()->instance() calls for per-request data in the codebase

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Singleton as Catch-All Cache prevented
- [ ] Manual forgetInstance() Calls prevented
- [ ] Cloning Singletons Manually prevented
- [ ] Ignoring the Problem (No Audit) prevented
- [ ] Singleton Caching Query Results prevented

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

- octane-architecture-overview (sandbox mechanism that allows scoped bindings)
- scoped-bindings-for-octane (the primary fix for singleton leaks)
- static-property-accumulation (a related but distinct leak pattern)
- service-binding-audit (systematic audit to catch singleton leaks)

---


