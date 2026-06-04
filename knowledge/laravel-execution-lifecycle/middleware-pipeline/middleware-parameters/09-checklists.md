# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Parameters
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Create a parameterized middleware with variadic `...$params`
- [ ] Define a route with `'middleware:param1,param2'` and verify parameters reach middleware
- [ ] Test with type-hinted parameters (int, string) â€” observe auto-casting behavior
- [ ] Parameters are documented with position, type, and purpose
- [ ] String comparisons use `===` not truthy/falsy checks
- [ ] Parameters are type-cast explicitly (int, bool) when needed
- [ ] Document parameter order clearly applied
- [ ] Use variadic parameters for optional arguments applied
- [ ] Compare parameters with string literals applied
- [ ] Prefer middleware class with constructor injection for complex config applied
- [ ] Over-Parameterization (6+ Comma-Separated Values) prevented
- [ ] Sensitive Data in Route Parameters prevented
- [ ] Passing boolean values as strings prevented
- [ ] Too few parameters for middleware prevented

---

# Architecture Checklist

- [ ] Colon-delimited syntax architecture followed
- [ ] Individual arguments over array architecture followed
- [ ] Parsing in Pipeline architecture followed
- [ ] Route caching architecture followed

---

# Implementation Checklist

- [ ] Document parameter order clearly applied
- [ ] Use variadic parameters for optional arguments applied
- [ ] Compare parameters with string literals applied
- [ ] Prefer middleware class with constructor injection for complex config applied
- [ ] Passing boolean values as strings prevented
- [ ] Too few parameters for middleware prevented
- [ ] Colon in namespace path prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Over-Parameterization (6+ Comma-Separated Values) prevented
- [ ] Sensitive Data in Route Parameters prevented
- [ ] Truthy Check on String Parameters prevented
- [ ] Too Few Parameters Causing TypeError prevented
- [ ] Not Documenting Parameter Order prevented

---

# Testing Checklist

- [ ] Parameters are documented with position, type, and purpose
- [ ] String comparisons use `===` not truthy/falsy checks
- [ ] Parameters are type-cast explicitly (int, bool) when needed
- [ ] Variadic parameters used for optional arguments
- [ ] Create a parameterized middleware with variadic `...$params`
- [ ] Define a route with `'middleware:param1,param2'` and verify parameters reach middleware
- [ ] Test with type-hinted parameters (int, string) â€” observe auto-casting behavior
- [ ] Test missing parameters â€” observe default values or errors
- [ ] Middleware accepts parameters from route definitions with : syntax
- [ ] Parameters are type-cast, documented, and validated
- [ ] Missing parameters use sensible defaults
- [ ] No sensitive data is passed through route-level parameters

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Over-Parameterization (6+ Comma-Separated Values) prevented
- [ ] Sensitive Data in Route Parameters prevented
- [ ] Truthy Check on String Parameters prevented
- [ ] Too Few Parameters Causing TypeError prevented
- [ ] Not Documenting Parameter Order prevented

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

- Pipeline Pattern Fundamentals (pipe parameter passing mechanism)
- Middleware Aliases (colon-delimited alias syntax)
- Service Container (parameter binding resolution)
- Route Middleware (parameterized alias usage in route definitions)
- Middleware Aliases (alias-to-class resolution with parameter extraction)

---


