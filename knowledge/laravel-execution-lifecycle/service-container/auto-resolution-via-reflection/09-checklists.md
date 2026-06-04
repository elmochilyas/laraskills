# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Auto Resolution Via Reflection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can explain how `build()` uses ReflectionClass to resolve dependencies
- [ ] Understand why auto-resolution fails for interfaces without bindings
- [ ] Know how primitives are handled (defaults, makeWith parameters)
- [ ] Every interface/abstract type-hint has a registered binding
- [ ] Every primitive constructor parameter has a default value or uses `makeWith()`
- [ ] Optional dependencies use nullable type-hints with null defaults
- [ ] Pre-register hot-path classes as bindings applied
- [ ] Always provide default values for primitive constructor parameters applied
- [ ] Register bindings for every interface used as constructor type-hint applied
- [ ] Avoid deep constructor dependency chains applied
- [ ] Type-Hinting Interface Without Registered Binding prevented
- [ ] Required Primitive Parameters Without Defaults prevented
- [ ] Type-hinting interface without binding prevented
- [ ] Adding required primitive without default prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Pre-register hot-path classes as bindings applied
- [ ] Always provide default values for primitive constructor parameters applied
- [ ] Register bindings for every interface used as constructor type-hint applied
- [ ] Avoid deep constructor dependency chains applied
- [ ] Enable ReflectionCache in Laravel 12+ applied
- [ ] Type-hinting interface without binding prevented
- [ ] Adding required primitive without default prevented
- [ ] Assuming reflection is cached prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Type-Hinting Interface Without Registered Binding prevented
- [ ] Required Primitive Parameters Without Defaults prevented
- [ ] Deep Constructor Dependency Chains prevented
- [ ] Relying on Auto-Resolution for Hot-Path Services prevented
- [ ] No Explicit Bindings for Interfaces at All prevented

---

# Testing Checklist

- [ ] Every interface/abstract type-hint has a registered binding
- [ ] Every primitive constructor parameter has a default value or uses `makeWith()`
- [ ] Optional dependencies use nullable type-hints with null defaults
- [ ] Resolution succeeds without exceptions
- [ ] Can explain how `build()` uses ReflectionClass to resolve dependencies
- [ ] Understand why auto-resolution fails for interfaces without bindings
- [ ] Know how primitives are handled (defaults, makeWith parameters)
- [ ] Can estimate reflection overhead for a given dependency graph depth
- [ ] All auto-resolved classes resolve successfully via $app->make()
- [ ] No BindingResolutionException thrown during normal resolution paths
- [ ] Hot-path services optionally pre-registered as explicit bindings for performance
- [ ] Hot-path services resolve in <10Î¼s per chain

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Type-Hinting Interface Without Registered Binding prevented
- [ ] Required Primitive Parameters Without Defaults prevented
- [ ] Deep Constructor Dependency Chains prevented
- [ ] Relying on Auto-Resolution for Hot-Path Services prevented
- [ ] No Explicit Bindings for Interfaces at All prevented

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
- Binding Types
- Circular Dependency Detection

---


