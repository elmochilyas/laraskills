# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Contextual Binding
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax (with `$` prefix)
- [ ] Register in the provider with the consumer applied
- [ ] Use primitive contextual binding for config values applied
- [ ] Document the rationale applied
- [ ] Prefer over factory pattern applied
- [ ] Contextual Binding Sprawl prevented
- [ ] Wrong Consumer Class prevented
- [ ] Registering in boot() prevented
- [ ] Wrong consumer class prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Register in the provider with the consumer applied
- [ ] Use primitive contextual binding for config values applied
- [ ] Document the rationale applied
- [ ] Prefer over factory pattern applied
- [ ] Registering in boot() prevented
- [ ] Wrong consumer class prevented
- [ ] Contextual + singleton conflict prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Contextual Binding Sprawl prevented
- [ ] Wrong Consumer Class prevented
- [ ] Registering in boot() Instead of register() prevented
- [ ] Forgetting $ Prefix for Primitives prevented
- [ ] Runtime Conditions in give() prevented

---

# Testing Checklist

- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax (with `$` prefix)
- [ ] Closure `give()` does not capture request-scoped state
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive bindings use the correct `$parameterName` syntax
- [ ] Closure `give()` does not capture request-scoped state
- [ ] Consumer-specific implementations are handled via declarative contextual bindings
- [ ] No conditional factory logic or instanceof checks exist for implementation selection
- [ ] All contextual bindings are registered in register() methods and documented
- [ ] Primitive bindings use correct $ prefix syntax

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Contextual Binding Sprawl prevented
- [ ] Wrong Consumer Class prevented
- [ ] Registering in boot() Instead of register() prevented
- [ ] Forgetting $ Prefix for Primitives prevented
- [ ] Runtime Conditions in give() prevented

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
- [Aliasing Primitives (ku-07)](../ku-07-aliasing-primitives/02-knowledge-unit.md)
- [Automatic Injection (ku-04)](../ku-04-automatic-injection/02-knowledge-unit.md)
- Contextual bindings are stored in `Container::$contextual[$consumer][$abstract]`.
- The `when()` method returns a `ContextualBindingBuilder` â€” the binding is registered when `give()` is called.
- Primitive contextual binding requires the `$` prefix: `needs('$paramName')`.
- Contextual bindings ONLY work for constructor injection â€” NOT for `Container::call()` method injection.

---


