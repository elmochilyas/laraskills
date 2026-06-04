# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Scoped Bindings For Octane
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Understand the difference between `singleton()`, `scoped()`, and `bind()`
- [ ] Register a service as `scoped()` and verify per-request freshness
- [ ] Implement `OctaneSandbox` on a provider and verify re-registration in sandbox
- [ ] Each converted binding is registered via `scoped()`, not `singleton()`
- [ ] Provider implements `OctaneSandbox` if per-request re-registration is needed
- [ ] `scoped()` registered in `boot()` (sandbox context) not `register()` (master context)
- [ ] Default to scoped for any service interacting with per-request data. followed
- [ ] Prefer class-name registration over closures for scoped bindings. followed
- [ ] Register scoped bindings inside OctaneSandbox providers. followed
- [ ] Test scoped isolation with identity assertions. followed
- [ ] Never use scoped() for global infrastructure services. followed
- [ ] Use coroutine-ID maps, not scoped, for per-coroutine state in Swoole. followed
- [ ] Default to scoped for any service that interacts with per-request data applied
- [ ] Prefer `scoped(Contract::class, Concrete::class)` over closures applied
- [ ] Register scoped bindings in `OctaneSandbox` providers applied
- [ ] Test scoped behavior explicitly applied
- [ ] Blind Singleton-to-Scoped Mass Conversion prevented
- [ ] Scoped-as-IO-Expensive-Catch-All prevented
- [ ] Using scoped() for truly global services prevented
- [ ] Registering scoped in non-OctaneSandbox provider prevented

---

# Architecture Checklist

- [ ] Scoped uses same registry as singleton architecture followed
- [ ] Flush happens on sandbox destruction architecture followed
- [ ] `OctaneSandbox` is opt-in architecture followed
- [ ] Scoped !== per-test isolation architecture followed

---

# Implementation Checklist

- [ ] Default to scoped for any service interacting with per-request data. followed
- [ ] Prefer class-name registration over closures for scoped bindings. followed
- [ ] Register scoped bindings inside OctaneSandbox providers. followed
- [ ] Test scoped isolation with identity assertions. followed
- [ ] Never use scoped() for global infrastructure services. followed
- [ ] Default to scoped for any service that interacts with per-request data applied
- [ ] Prefer `scoped(Contract::class, Concrete::class)` over closures applied
- [ ] Register scoped bindings in `OctaneSandbox` providers applied
- [ ] Test scoped behavior explicitly applied
- [ ] Using scoped() for truly global services prevented
- [ ] Registering scoped in non-OctaneSandbox provider prevented
- [ ] Expecting per-coroutine isolation from scoped prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Blind Singleton-to-Scoped Mass Conversion prevented
- [ ] Scoped-as-IO-Expensive-Catch-All prevented
- [ ] Registering Scoped in register() Without Sandbox Awareness prevented
- [ ] Using Scoped for Per-Coroutine State prevented
- [ ] Expecting Per-Coroutine Isolation from Scoped prevented
- [ ] Default to scoped for any service interacting with per-request data. followed
- [ ] Prefer class-name registration over closures for scoped bindings. followed
- [ ] Register scoped bindings inside OctaneSandbox providers. followed
- [ ] Test scoped isolation with identity assertions. followed
- [ ] Never use scoped() for global infrastructure services. followed
- [ ] Use coroutine-ID maps, not scoped, for per-coroutine state in Swoole. followed

---

# Testing Checklist

- [ ] Each converted binding is registered via `scoped()`, not `singleton()`
- [ ] Provider implements `OctaneSandbox` if per-request re-registration is needed
- [ ] `scoped()` registered in `boot()` (sandbox context) not `register()` (master context)
- [ ] Class-name registration used where possible; closures used only for runtime config
- [ ] Understand the difference between `singleton()`, `scoped()`, and `bind()`
- [ ] Register a service as `scoped()` and verify per-request freshness
- [ ] Implement `OctaneSandbox` on a provider and verify re-registration in sandbox
- [ ] Test with two sequential requests: assert same instance within request, different instances across requests
- [ ] All identified leaky singletons holding per-request state are converted to scoped()
- [ ] Scoped bindings registered in correct provider context (OctaneSandbox.boot() where needed)
- [ ] Identity assertions verify per-request isolation with zero false positives
- [ ] No global infrastructure services accidentally converted to scoped

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Blind Singleton-to-Scoped Mass Conversion prevented
- [ ] Scoped-as-IO-Expensive-Catch-All prevented
- [ ] Registering Scoped in register() Without Sandbox Awareness prevented
- [ ] Using Scoped for Per-Coroutine State prevented
- [ ] Expecting Per-Coroutine Isolation from Scoped prevented

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

- singleton-state-leaks (the problem scoped bindings solve)
- octane-architecture-overview (sandbox mechanism that enables scoped)
- service-binding-audit (auditing tooling to identify scoped candidates)
- octane-package-compatibility (third-party packages that need scoped)

---


