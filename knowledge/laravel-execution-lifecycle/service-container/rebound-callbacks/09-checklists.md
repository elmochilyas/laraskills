# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Rebound Callbacks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain when rebound fires vs does not fire (resolved guard)
- [ ] Understand difference between `rebinding()` and `resolving()` callbacks
- [ ] Know why `rebinding()` fires immediately if binding is already resolved
- [ ] Abstract must be resolved before rebinding for callback to fire
- [ ] Callback is idempotent â€” safe to fire multiple times
- [ ] `rebinding()` used, not manual `forgetInstance()` + `rebound()`
- [ ] Use `rebinding()` rather than manually calling `forgetInstance()` + `rebound()` applied
- [ ] Ensure callbacks are idempotent applied
- [ ] Avoid rebinding in Octane applied
- [ ] Log rebinding events in development applied
- [ ] Relying on Rebound for Application Bootstrap Logic prevented
- [ ] Using rebinding() on Non-Singleton Bindings prevented
- [ ] Expecting rebound on unresolved bindings prevented
- [ ] rebinding() callback calling make() on same abstract prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use `rebinding()` rather than manually calling `forgetInstance()` + `rebound()` applied
- [ ] Ensure callbacks are idempotent applied
- [ ] Avoid rebinding in Octane applied
- [ ] Log rebinding events in development applied
- [ ] Expecting rebound on unresolved bindings prevented
- [ ] rebinding() callback calling make() on same abstract prevented
- [ ] Using rebinding() in register() before target is resolved prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Relying on Rebound for Application Bootstrap Logic prevented
- [ ] Using rebinding() on Non-Singleton Bindings prevented
- [ ] Removing Rebound Listeners via forgetInstance() Without Re-registering prevented
- [ ] Rebinding Callback Executed on Every Boot (Not Just First Resolution) prevented
- [ ] Using rebinding() When Simple Event Would Be Cleaner prevented

---

# Testing Checklist

- [ ] Abstract must be resolved before rebinding for callback to fire
- [ ] Callback is idempotent â€” safe to fire multiple times
- [ ] `rebinding()` used, not manual `forgetInstance()` + `rebound()`
- [ ] Not used for per-resolution configuration (use `resolving()` instead)
- [ ] Can explain when rebound fires vs does not fire (resolved guard)
- [ ] Understand difference between `rebinding()` and `resolving()` callbacks
- [ ] Know why `rebinding()` fires immediately if binding is already resolved
- [ ] Can identify appropriate use cases (binding changes) vs inappropriate (per-resolution config)
- [ ] Rebound callbacks fire at the correct time (after resolved binding is re-registered)
- [ ] Callbacks are idempotent and safe to fire multiple times
- [ ] No rebound callbacks used for per-resolution configuration
- [ ] Rebound callbacks fire at the correct time

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Relying on Rebound for Application Bootstrap Logic prevented
- [ ] Using rebinding() on Non-Singleton Bindings prevented
- [ ] Removing Rebound Listeners via forgetInstance() Without Re-registering prevented
- [ ] Rebinding Callback Executed on Every Boot (Not Just First Resolution) prevented
- [ ] Using rebinding() When Simple Event Would Be Cleaner prevented

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

- Container Fundamentals
- Binding Types
- Binding Resolution
- Resolution Callbacks
- Binding Extending

---


