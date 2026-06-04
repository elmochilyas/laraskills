# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Automatic Injection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All interfaces and abstract classes have explicit bindings
- [ ] No primitive constructor parameters without defaults or explicit bindings
- [ ] Circular dependency detection works (test with a known circular setup)
- [ ] All interfaces and abstract classes have explicit bindings (not relying on auto-resolution)
- [ ] No primitive constructor parameters exist without defaults or explicit bindings
- [ ] Circular dependency detection works (no infinite resolution loops)
- [ ] Let auto-resolution handle concrete deps applied
- [ ] Bind interfaces explicitly applied
- [ ] Provide defaults for optional primitives applied
- [ ] Use auto-resolution as convenience, not strategy applied
- [ ] Over-Reliance on Auto-Resolution prevented
- [ ] Auto-Resolution for Interfaces prevented
- [ ] Assuming auto-resolution for interfaces prevented
- [ ] Forgetting primitives prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Let auto-resolution handle concrete deps applied
- [ ] Bind interfaces explicitly applied
- [ ] Provide defaults for optional primitives applied
- [ ] Use auto-resolution as convenience, not strategy applied
- [ ] Assuming auto-resolution for interfaces prevented
- [ ] Forgetting primitives prevented
- [ ] Deep circular deps not detected prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Over-Reliance on Auto-Resolution prevented
- [ ] Auto-Resolution for Interfaces prevented
- [ ] Auto-Resolution on Hot Paths prevented
- [ ] Forgetting Primitive Parameters prevented
- [ ] Auto-Resolving Wrong Implementation prevented

---

# Testing Checklist

- [ ] All interfaces and abstract classes have explicit bindings (not relying on auto-resolution)
- [ ] No primitive constructor parameters exist without defaults or explicit bindings
- [ ] Circular dependency detection works (no infinite resolution loops)
- [ ] Hot-path classes use explicit `singleton()` bindings
- [ ] All interfaces and abstract classes have explicit bindings
- [ ] No primitive constructor parameters without defaults or explicit bindings
- [ ] Circular dependency detection works (test with a known circular setup)
- [ ] Hot-path classes use explicit bindings or singletons (not auto-resolution on every request)
- [ ] All interfaces have explicit bindings â€” no auto-resolution attempts on abstractions
- [ ] Concrete classes resolve via app() without registration in service providers
- [ ] Hot-path classes bypass auto-resolution via singleton() bindings
- [ ] Zero primitive parameters exist without defaults or bindings

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Over-Reliance on Auto-Resolution prevented
- [ ] Auto-Resolution for Interfaces prevented
- [ ] Auto-Resolution on Hot Paths prevented
- [ ] Forgetting Primitive Parameters prevented
- [ ] Auto-Resolving Wrong Implementation prevented

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
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md)
- [Interface Binding (ku-08)](../ku-08-interface-binding/02-knowledge-unit.md)
- [Circular Dependency Resolution (ku-09)](../ku-09-circular-dependency-resolution/02-knowledge-unit.md)
- Auto-resolution lives in `Container::build()` at `Illuminate\Container\Container::build()`.
- The method checks `$reflector->isInstantiable()` â€” throws for interfaces and abstract classes.
- `$buildStack` is the circular dependency detector â€” a class appearing twice triggers the exception.
- For debugging auto-resolution, set a breakpoint in `Container::build()` and inspect the `$buildStack`.

---


