# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Interface Binding
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] Bind interfaces in dedicated providers applied
- [ ] Use singleton for stateless services applied
- [ ] Use `bind()` for stateful services applied
- [ ] Document interface contracts applied
- [ ] Interface Explosion prevented
- [ ] No Interface at All prevented
- [ ] Forgetting to bind prevented
- [ ] Binding to non-instantiable class prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Bind interfaces in dedicated providers applied
- [ ] Use singleton for stateless services applied
- [ ] Use `bind()` for stateful services applied
- [ ] Document interface contracts applied
- [ ] Register bindings in boot() or register()? applied
- [ ] Forgetting to bind prevented
- [ ] Binding to non-instantiable class prevented
- [ ] Binding concrete to concrete prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Interface Explosion prevented
- [ ] No Interface at All prevented
- [ ] Binding to Self prevented
- [ ] Forgetting to Bind prevented
- [ ] Binding in Wrong Provider prevented

---

# Testing Checklist

- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies exist
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies
- [ ] Every interface type-hinted in a constructor has a binding in a service provider
- [ ] Bindings are organized by domain in dedicated providers
- [ ] Stateless interface bindings use singleton() for shared instances
- [ ] No concrete-to-concrete redundant bindings exist

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Interface Explosion prevented
- [ ] No Interface at All prevented
- [ ] Binding to Self prevented
- [ ] Forgetting to Bind prevented
- [ ] Binding in Wrong Provider prevented

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
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md)
- [Tagged Bindings (ku-06)](../ku-06-tagged-bindings/02-knowledge-unit.md)
- Bindings are stored in `Container::$bindings[Abstract]['concrete']` and `Container::$bindings[Abstract]['shared']`.
- `Container::resolve()` processes the binding: checks contextual, checks global binding, then builds.
- The `isInstantiable()` check in `build()` catches interfaces without bindings.
- To check if an interface has a binding: `$app->bound(Interface::class)`.
- Use `$app->resolved(Interface::class)` to check if it's been resolved already.

---


