# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Tagged Bindings
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tags are registered in provider `register()` methods
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and documented
- [ ] Tags are registered in provider `register()` methods (not at runtime)
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and namespace-prefixed to avoid collisions
- [ ] Tag in the same provider as the binding applied
- [ ] Use descriptive tag names applied
- [ ] Combine with variadic injection applied
- [ ] Document tag contracts applied
- [ ] Tag as Interface Replacement prevented
- [ ] Runtime Tag Registration prevented
- [ ] Tag with non-existent abstract prevented
- [ ] Tag order assumptions prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Tag in the same provider as the binding applied
- [ ] Use descriptive tag names applied
- [ ] Combine with variadic injection applied
- [ ] Document tag contracts applied
- [ ] Tag with non-existent abstract prevented
- [ ] Tag order assumptions prevented
- [ ] Singleton tags with mutable state prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Tag as Interface Replacement prevented
- [ ] Runtime Tag Registration prevented
- [ ] Tagged Service Locator prevented
- [ ] Tag Order Assumptions prevented
- [ ] Over-Tagging prevented

---

# Testing Checklist

- [ ] Tags are registered in provider `register()` methods (not at runtime)
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and namespace-prefixed to avoid collisions
- [ ] No runtime tag registration occurs (tags are static bootstrap-time configuration)
- [ ] Tags are registered in provider `register()` methods
- [ ] Tagged implementations implement a common interface (type-hinted in consumer)
- [ ] Tag names are descriptive and documented
- [ ] No runtime tag registration (tags are static bootstrap-time)
- [ ] Multiple implementations of an interface are collected via tags, not manual arrays
- [ ] Tag names are descriptive and namespace-prefixed to prevent collisions
- [ ] Tags are registered in the same provider as the individual bindings
- [ ] Consumer uses type-safe variadic injection for tagged services

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Tag as Interface Replacement prevented
- [ ] Runtime Tag Registration prevented
- [ ] Tagged Service Locator prevented
- [ ] Tag Order Assumptions prevented
- [ ] Over-Tagging prevented

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

- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md)
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md)
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- Tags are stored in `Container::$tags` â€” a simple array: `$tags['reports'] = ['reports.csv', 'reports.pdf']`.
- `tagged($tag)` iterates the tag array and calls `make()` on each abstract.
- Variadic constructor parameters with type-hints are resolved via tagged bindings if no explicit variadic binding exists.
- The `tag()` method accepts a single abstract or an array.

---


