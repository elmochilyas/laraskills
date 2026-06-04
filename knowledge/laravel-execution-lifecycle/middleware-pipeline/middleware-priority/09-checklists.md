# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Priority
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] List the default middleware priority order and understand the dependency chain
- [ ] Add custom middleware that depends on session â€” verify it runs after StartSession
- [ ] Add custom middleware without priority â€” observe it may run before its dependencies
- [ ] Default priority entries are preserved (not reordered or removed)
- [ ] Custom middleware position respects framework dependency chain
- [ ] Middleware accessing route bindings is after `SubstituteBindings`
- [ ] Use priority sparingly applied
- [ ] Place custom middleware relative to SubstituteBindings applied
- [ ] Keep the priority list in source control and review during upgrades applied
- [ ] Prefer explicit group ordering over priority applied
- [ ] Not Adding Custom Middleware to Priority prevented
- [ ] Using Priority Instead of Group Ordering prevented
- [ ] Not adding custom middleware to priority prevented
- [ ] Using priority instead of group ordering prevented

---

# Architecture Checklist

- [ ] Priority Queue pattern architecture followed
- [ ] Stable Sort architecture followed
- [ ] Dependency Inversion architecture followed
- [ ] Global override, not per-route architecture followed

---

# Implementation Checklist

- [ ] Use priority sparingly applied
- [ ] Place custom middleware relative to SubstituteBindings applied
- [ ] Keep the priority list in source control and review during upgrades applied
- [ ] Prefer explicit group ordering over priority applied
- [ ] Not adding custom middleware to priority prevented
- [ ] Using priority instead of group ordering prevented
- [ ] Changing default priority prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not Adding Custom Middleware to Priority prevented
- [ ] Using Priority Instead of Group Ordering prevented
- [ ] Changing Default Priority prevented
- [ ] Stale Priority List After Middleware Removal prevented
- [ ] Missing Priority Entry for Dependent Middleware prevented

---

# Testing Checklist

- [ ] Default priority entries are preserved (not reordered or removed)
- [ ] Custom middleware position respects framework dependency chain
- [ ] Middleware accessing route bindings is after `SubstituteBindings`
- [ ] Auth-dependent middleware is after `Authenticate`
- [ ] List the default middleware priority order and understand the dependency chain
- [ ] Add custom middleware that depends on session â€” verify it runs after StartSession
- [ ] Add custom middleware without priority â€” observe it may run before its dependencies
- [ ] Add it to the priority list â€” verify correct ordering
- [ ] Custom middleware runs in correct order relative to framework middleware
- [ ] Default priority is unchanged
- [ ] Priority list is small and only contains middleware with cross-source ordering needs
- [ ] All routes execute middleware in the expected order

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Not Adding Custom Middleware to Priority prevented
- [ ] Using Priority Instead of Group Ordering prevented
- [ ] Changing Default Priority prevented
- [ ] Stale Priority List After Middleware Removal prevented
- [ ] Missing Priority Entry for Dependent Middleware prevented

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

- Pipeline Pattern Fundamentals (pipe execution order)
- Middleware Groups (multi-source middleware merging)
- Global Middleware Stack (base ordering constraints)
- Route Middleware (per-route middleware and sort interaction)
- Middleware vs Route Binding Ordering (priority effects on SubstituteBindings)

---


