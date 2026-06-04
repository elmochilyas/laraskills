# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Container
**Knowledge Unit:** Tagged Bindings
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can register and resolve tagged bindings correctly
- [ ] Understand lazy resolution behavior of `tagged()`
- [ ] Know how to combine tags with variadic constructor injection
- [ ] Bindings registered before tagging
- [ ] Interfaces tagged, not concrete classes
- [ ] Tag name is descriptive and namespaced
- [ ] Use tags for service collections applied
- [ ] Combine tags with variadic constructors applied
- [ ] Use descriptive tag names applied
- [ ] Leverage lazy resolution applied
- [ ] Using Tagged Bindings for Two Different Concerns Under One Tag prevented
- [ ] Registering Services in Wrong Order (Tagged Order Matters) prevented
- [ ] Assuming tagged() resolves eagerly prevented
- [ ] Tagging interfaces without bindings prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use tags for service collections applied
- [ ] Combine tags with variadic constructors applied
- [ ] Use descriptive tag names applied
- [ ] Leverage lazy resolution applied
- [ ] Assuming tagged() resolves eagerly prevented
- [ ] Tagging interfaces without bindings prevented
- [ ] Not using variadic injection with tags prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Using Tagged Bindings for Two Different Concerns Under One Tag prevented
- [ ] Registering Services in Wrong Order (Tagged Order Matters) prevented
- [ ] Using Tagged Bindings When Manual Collection Registration Is Simpler prevented
- [ ] Forgetting to Tag When Iterating With tagged() prevented
- [ ] Not Documenting Tag Contracts prevented

---

# Testing Checklist

- [ ] Bindings registered before tagging
- [ ] Interfaces tagged, not concrete classes
- [ ] Tag name is descriptive and namespaced
- [ ] Tagged collection iterated lazily (not converted to array eagerly)
- [ ] Can register and resolve tagged bindings correctly
- [ ] Understand lazy resolution behavior of `tagged()`
- [ ] Know how to combine tags with variadic constructor injection
- [ ] Can explain the storage structure (`$tags[tagName][abstracts]`)
- [ ] Tagged services resolve correctly via tagged()
- [ ] Lazy resolution avoids constructing unused services
- [ ] Tag names are collision-free and descriptive
- [ ] Collection caching avoids double resolution on multi-pass iteration

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Using Tagged Bindings for Two Different Concerns Under One Tag prevented
- [ ] Registering Services in Wrong Order (Tagged Order Matters) prevented
- [ ] Using Tagged Bindings When Manual Collection Registration Is Simpler prevented
- [ ] Forgetting to Tag When Iterating With tagged() prevented
- [ ] Not Documenting Tag Contracts prevented

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
- Contextual Binding
- Binding Resolution

---


