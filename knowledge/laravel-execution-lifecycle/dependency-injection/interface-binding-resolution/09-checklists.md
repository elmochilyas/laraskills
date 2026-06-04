# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Interface Binding Resolution
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All interface type-hints in constructors have corresponding bindings in service providers
- [ ] No concrete-to-concrete bindings exist (unnecessary)
- [ ] Contextual binding is used where different consumers need different implementations
- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers (not all in AppServiceProvider)
- [ ] Singleton bindings are used for stateless services only
- [ ] Bind interfaces, not concretions applied
- [ ] Register bindings in service providers applied
- [ ] Use contextual binding for consumer-specific implementations applied
- [ ] Bind to singleton for stateless services applied
- [ ] Interface Explosion prevented
- [ ] Not Binding Interfaces at All prevented
- [ ] Forgetting to bind interface prevented
- [ ] Binding concrete to concrete prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Bind interfaces, not concretions applied
- [ ] Register bindings in service providers applied
- [ ] Use contextual binding for consumer-specific implementations applied
- [ ] Bind to singleton for stateless services applied
- [ ] Forgetting to bind interface prevented
- [ ] Binding concrete to concrete prevented
- [ ] Not using contextual binding prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Interface Explosion prevented
- [ ] Not Binding Interfaces at All prevented
- [ ] Concrete-to-Concrete Binding prevented
- [ ] Binding in boot() Instead of register() prevented
- [ ] Interface Bound to Non-Instantiable Class prevented

---

# Testing Checklist

- [ ] All interface type-hints have corresponding bindings in service providers
- [ ] Bindings are organized by domain/feature in dedicated providers (not all in AppServiceProvider)
- [ ] Singleton bindings are used for stateless services only
- [ ] No `bind(Concrete::class, Concrete::class)` redundancies exist
- [ ] All interface type-hints in constructors have corresponding bindings in service providers
- [ ] No concrete-to-concrete bindings exist (unnecessary)
- [ ] Contextual binding is used where different consumers need different implementations
- [ ] Interface bindings are registered in the correct service provider
- [ ] Every interface type-hinted in a constructor has a corresponding binding in a service provider
- [ ] Bindings are organized by domain in dedicated service providers
- [ ] Stateless interface bindings use singleton() for shared instances
- [ ] No concrete-to-concrete redundant bindings exist

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Interface Explosion prevented
- [ ] Not Binding Interfaces at All prevented
- [ ] Concrete-to-Concrete Binding prevented
- [ ] Binding in boot() Instead of register() prevented
- [ ] Interface Bound to Non-Instantiable Class prevented

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

- **Auto-Resolution Strategy** â€” the fallback when no interface binding exists
- **Constructor Injection** â€” where interface type-hints are resolved via this mechanism
- **Service Container Binding API** â€” `bind()`, `singleton()`, `when()->needs()->give()`
- **Testing with the Container** â€” using `instance()` and `swap()` to replace interface bindings in tests
- **Facade Architecture** â€” facades leverage interface bindings for their underlying resolution
- **Injection Guidelines by Class Type** â€” which class types should depend on interfaces vs concretes

---


