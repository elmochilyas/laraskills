# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Contextual Binding Timing
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive contextual bindings use the correct `$parameterName` syntax
- [ ] Contextual binding is registered in `register()`, not `boot()`
- [ ] Consumer class name is correct (the concrete class, not the interface it implements)
- [ ] Primitive parameter names use `$` prefix (e.g., `'$apiKey'`)
- [ ] Register in the correct provider applied
- [ ] Keep contextual bindings with consumer registration applied
- [ ] Use primitive contextual binding applied
- [ ] Avoid over-abstraction applied
- [ ] Contextual Binding in boot() Instead of register() prevented
- [ ] Contextual Binding for Consumers Resolved Outside Container prevented
- [ ] Registration in boot() prevented
- [ ] Forgetting the consumer class prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Register in the correct provider applied
- [ ] Keep contextual bindings with consumer registration applied
- [ ] Use primitive contextual binding applied
- [ ] Avoid over-abstraction applied
- [ ] Registration in boot() prevented
- [ ] Forgetting the consumer class prevented
- [ ] Contextual + singleton conflict prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Contextual Binding in boot() Instead of register() prevented
- [ ] Contextual Binding for Consumers Resolved Outside Container prevented
- [ ] Contextual Binding Instead of Global Binding for Universal Needs prevented
- [ ] Circular Dependency via Contextual Bindings prevented
- [ ] Overengineering â€” using contextual binding for simple cases that just need a different interface binding. prevented

---

# Testing Checklist

- [ ] Contextual binding is registered in `register()`, not `boot()`
- [ ] Consumer class name is correct (the concrete class, not the interface it implements)
- [ ] Primitive parameter names use `$` prefix (e.g., `'$apiKey'`)
- [ ] Singleton consumers have their contextual bindings registered before any resolution
- [ ] All contextual bindings are registered in provider `register()` methods
- [ ] No consumer is resolved before its contextual bindings are registered
- [ ] Primitive contextual bindings use the correct `$parameterName` syntax
- [ ] Closure-based `give()` does not capture request-scoped state
- [ ] Each consumer receives the correct specialized implementation
- [ ] No contextual binding is registered after the consumer has been resolved
- [ ] Primitive parameters are injected via needs('$paramName') where appropriate
- [ ] Every contextual binding has a documented reason for the specialization

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Contextual Binding in boot() Instead of register() prevented
- [ ] Contextual Binding for Consumers Resolved Outside Container prevented
- [ ] Contextual Binding Instead of Global Binding for Universal Needs prevented
- [ ] Circular Dependency via Contextual Bindings prevented
- [ ] Overengineering â€” using contextual binding for simple cases that just need a different interface binding. prevented

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

- [Container Fundamentals](../../service-container/container-fundamentals/02-knowledge-unit.md)
- [Binding Types](../../service-container/binding-types/02-knowledge-unit.md)
- [Interface Binding Resolution](../../dependency-injection/interface-binding-resolution/02-knowledge-unit.md)

---


