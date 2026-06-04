# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Resolution Callbacks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain execution order: beforeResolving â†’ extenders â†’ resolving â†’ cache â†’ afterResolving
- [ ] Understand why `afterResolving()` cannot affect cached instance
- [ ] Know the difference between global and abstract-specific callbacks
- [ ] Correct hook chosen (`resolving` for config, `afterResolving` for side effects)
- [ ] Instance not replaced via non-null return (no accidental `tap()` returns)
- [ ] Extenders are registered before `resolving()` if decoration is needed
- [ ] Prefer abstract-specific callbacks over global callbacks with instanceof checks applied
- [ ] Avoid instance replacement in `resolving()` callbacks applied
- [ ] Use `afterResolving()` for side effects only applied
- [ ] Use `$app` parameter for dependency resolution applied
- [ ] Mutating Global State Inside resolving() Callbacks prevented
- [ ] No Callback Scope Limitation (Callbacks Fire on All Resolutions) prevented
- [ ] Using resolving() to configure a service that is also extended prevented
- [ ] Modifying instance in afterResolving() expecting cache update prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer abstract-specific callbacks over global callbacks with instanceof checks applied
- [ ] Avoid instance replacement in `resolving()` callbacks applied
- [ ] Use `afterResolving()` for side effects only applied
- [ ] Use `$app` parameter for dependency resolution applied
- [ ] Using resolving() to configure a service that is also extended prevented
- [ ] Modifying instance in afterResolving() expecting cache update prevented
- [ ] Registering callbacks in register() that depend on unavailable services prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Mutating Global State Inside resolving() Callbacks prevented
- [ ] No Callback Scope Limitation (Callbacks Fire on All Resolutions) prevented
- [ ] Not Understanding afterResolving() vs. resolving() Timing prevented
- [ ] Modifying the Resolved Instance Interface in resolving() prevented
- [ ] Application Logic in resolving() Callbacks prevented

---

# Testing Checklist

- [ ] Correct hook chosen (`resolving` for config, `afterResolving` for side effects)
- [ ] Instance not replaced via non-null return (no accidental `tap()` returns)
- [ ] Extenders are registered before `resolving()` if decoration is needed
- [ ] `$app` parameter used instead of captured container reference
- [ ] Can explain execution order: beforeResolving â†’ extenders â†’ resolving â†’ cache â†’ afterResolving
- [ ] Understand why `afterResolving()` cannot affect cached instance
- [ ] Know the difference between global and abstract-specific callbacks
- [ ] Can explain callback return value behavior (non-null replaces instance)
- [ ] Services automatically configured at resolution time without modifying constructors
- [ ] Correct hook used for each concern (before, at, after resolution)
- [ ] No instance replacement in callbacks
- [ ] No performance degradation from global callback instanceof chains

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Mutating Global State Inside resolving() Callbacks prevented
- [ ] No Callback Scope Limitation (Callbacks Fire on All Resolutions) prevented
- [ ] Not Understanding afterResolving() vs. resolving() Timing prevented
- [ ] Modifying the Resolved Instance Interface in resolving() prevented
- [ ] Application Logic in resolving() Callbacks prevented

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
- Binding Resolution
- Binding Extending
- Rebound Callbacks

---


