# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Dependency Injection
**Knowledge Unit:** Aliasing Primitives
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All primitive bindings use the `$` prefix in `needs()`
- [ ] No hardcoded secrets in `give()` â€” use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] All primitive bindings use the `$` prefix in `needs('$paramName')`
- [ ] No hardcoded secrets in `give()` â€” use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] Bind named parameters over entire config applied
- [ ] Document primitive bindings applied
- [ ] Use environment-specific values in give() applied
- [ ] Combine with contextual binding applied
- [ ] Injecting Entire Config Array prevented
- [ ] Hardcoded Secrets in give() prevented
- [ ] Missing $ prefix prevented
- [ ] Hardcoding values prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Bind named parameters over entire config applied
- [ ] Document primitive bindings applied
- [ ] Use environment-specific values in give() applied
- [ ] Combine with contextual binding applied
- [ ] Missing $ prefix prevented
- [ ] Hardcoding values prevented
- [ ] Wrong parameter name prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Injecting Entire Config Array prevented
- [ ] Hardcoded Secrets in give() prevented
- [ ] Over-Aliasing prevented
- [ ] Missing $ Prefix prevented
- [ ] Forgetting Default Values prevented

---

# Testing Checklist

- [ ] All primitive bindings use the `$` prefix in `needs('$paramName')`
- [ ] No hardcoded secrets in `give()` â€” use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] Default values exist as fallback when no binding is provided
- [ ] All primitive bindings use the `$` prefix in `needs()`
- [ ] No hardcoded secrets in `give()` â€” use `config()` instead
- [ ] Parameter names are stable and documented
- [ ] Default values exist as fallback when no binding is provided
- [ ] Configuration values are injected as typed constructor parameters, not via Config repository
- [ ] All primitive bindings use correct $ prefix syntax
- [ ] Sensitive values come from config() â€” no hardcoded secrets in providers
- [ ] Fewer than 4 primitive bindings per class (DTO used beyond that)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Injecting Entire Config Array prevented
- [ ] Hardcoded Secrets in give() prevented
- [ ] Over-Aliasing prevented
- [ ] Missing $ Prefix prevented
- [ ] Forgetting Default Values prevented

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

- [Contextual Binding (ku-05)](../ku-05-contextual-binding/02-knowledge-unit.md)
- [DI Container Basics (ku-01)](../ku-01-di-container-basics/02-knowledge-unit.md)
- [Constructor Injection (ku-02)](../ku-02-constructor-injection/02-knowledge-unit.md)
- Primitive aliasing uses `needs('$paramName')` â€” the `$` prefix is required.
- Under the hood, it's stored in `Container::$contextual[Consumer][$paramName]`.
- The container checks for primitive bindings during `Container::build()` parameter loop.
- If no binding exists and no default value is defined, `BindingResolutionException` is thrown.

---


