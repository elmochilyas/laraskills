# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Contextual Binding
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can write a `when()->needs()->give()` chain correctly
- [ ] Understand why cached singletons bypass contextual binding
- [ ] Know how to bind primitives contextually (`$` prefix on parameter name)
- [ ] Consumer class name in `when()` is correct (no typos)
- [ ] Abstract in `needs()` is the type-hinted interface, not the concrete class
- [ ] Primitives use `$` prefix in `needs()`
- [ ] Prefer contextual binding over factories applied
- [ ] Use contextual binding for interface-based variation applied
- [ ] Avoid contextual binding for runtime data applied
- [ ] Test contextual bindings explicitly applied
- [ ] Overusing Contextual Bindings for Simple Constructor Injection prevented
- [ ] Using Contextual Binding with Primitive Values When Named Resolution Works prevented
- [ ] Expecting contextual binding to work with already-cached singletons prevented
- [ ] Using class-string instead of interface in needs() prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer contextual binding over factories applied
- [ ] Use contextual binding for interface-based variation applied
- [ ] Avoid contextual binding for runtime data applied
- [ ] Test contextual bindings explicitly applied
- [ ] Expecting contextual binding to work with already-cached singletons prevented
- [ ] Using class-string instead of interface in needs() prevented
- [ ] Not testing contextual bindings prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Overusing Contextual Bindings for Simple Constructor Injection prevented
- [ ] Using Contextual Binding with Primitive Values When Named Resolution Works prevented
- [ ] Contextual Binding on Classes That Should Share a Single Implementation prevented
- [ ] Not Testing Contextual Bindings With Contract Tests prevented
- [ ] Using Contextual Binding as a Substitute for Factory Pattern prevented

---

# Testing Checklist

- [ ] Consumer class name in `when()` is correct (no typos)
- [ ] Abstract in `needs()` is the type-hinted interface, not the concrete class
- [ ] Primitives use `$` prefix in `needs()`
- [ ] Cached singletons do not interfere with contextual resolution (use `bind()` not `singleton()` for varied abstracts)
- [ ] Can write a `when()->needs()->give()` chain correctly
- [ ] Understand why cached singletons bypass contextual binding
- [ ] Know how to bind primitives contextually (`$` prefix on parameter name)
- [ ] Can explain the storage structure (nested `$contextual` array)
- [ ] Each consumer receives the context-appropriate implementation
- [ ] No conditional logic in consumers to select implementations
- [ ] Tests confirm correct binding per consumer
- [ ] All tests pass without container bootstrapping outside of Laravel's test framework

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Overusing Contextual Bindings for Simple Constructor Injection prevented
- [ ] Using Contextual Binding with Primitive Values When Named Resolution Works prevented
- [ ] Contextual Binding on Classes That Should Share a Single Implementation prevented
- [ ] Not Testing Contextual Bindings With Contract Tests prevented
- [ ] Using Contextual Binding as a Substitute for Factory Pattern prevented

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
- Auto-Resolution via Reflection

---


