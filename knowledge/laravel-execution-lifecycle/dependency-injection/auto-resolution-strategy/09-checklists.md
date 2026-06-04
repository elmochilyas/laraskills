# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Auto Resolution Strategy
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have resolvable constructors (no unresolvable primitives)
- [ ] Hot-path classes are explicitly bound as singletons to avoid reflection cost
- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have fully resolvable constructors
- [ ] Hot-path classes are explicitly bound as singletons to avoid per-request Reflection
- [ ] Bind interfaces explicitly applied
- [ ] Use auto-resolution for concrete classes applied
- [ ] Pre-resolve hot paths in production applied
- [ ] Default optional dependencies applied
- [ ] Auto-Resolution as Architecture Strategy prevented
- [ ] No Primitives Resolution Path prevented
- [ ] Type-hinting interface without binding prevented
- [ ] Primitive parameter without default prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Bind interfaces explicitly applied
- [ ] Use auto-resolution for concrete classes applied
- [ ] Pre-resolve hot paths in production applied
- [ ] Default optional dependencies applied
- [ ] Type-hinting interface without binding prevented
- [ ] Primitive parameter without default prevented
- [ ] Circular dependency prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Auto-Resolution as Architecture Strategy prevented
- [ ] No Primitives Resolution Path prevented
- [ ] Hot-Path Auto-Resolution prevented
- [ ] Interface Without Binding prevented
- [ ] Constructor Changes Break Silently prevented

---

# Testing Checklist

- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have fully resolvable constructors
- [ ] Hot-path classes are explicitly bound as singletons to avoid per-request Reflection
- [ ] No unresolved primitive parameters exist in auto-resolved constructors
- [ ] All interface/abstract type-hints have explicit bindings in service providers
- [ ] Concrete classes without bindings have resolvable constructors (no unresolvable primitives)
- [ ] Hot-path classes are explicitly bound as singletons to avoid reflection cost
- [ ] No circular dependencies exist in the auto-resolution chain
- [ ] Concrete classes resolve via app() without explicit registration in service providers
- [ ] Auto-resolution chain completes without exceptions for all expected resolution paths
- [ ] Hot-path classes bypass auto-resolution via explicit singleton() bindings
- [ ] Zero primitive parameters exist without defaults or bindings in auto-resolved classes

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Auto-Resolution as Architecture Strategy prevented
- [ ] No Primitives Resolution Path prevented
- [ ] Hot-Path Auto-Resolution prevented
- [ ] Interface Without Binding prevented
- [ ] Constructor Changes Break Silently prevented

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

- **PHP Reflection API** â€” ReflectionClass, ReflectionParameter, and instantiability checks
- **Constructor Injection** â€” the primary consumer of auto-resolution
- **Service Container Internals** â€” how `build()`, `make()`, and `resolve()` interact
- **Method Injection** â€” uses auto-resolution for method parameter resolution in `BoundMethod`
- **Interface Binding Resolution** â€” the explicit counterpart when auto-resolution cannot handle interfaces
- **Injection Guidelines by Class Type** â€” guidance on when auto-resolution is appropriate vs. explicit binding

---


