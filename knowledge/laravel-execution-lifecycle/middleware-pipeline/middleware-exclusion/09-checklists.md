# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Exclusion
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Exclude `VerifyCsrfToken` from a POST route â€” verify the route works without CSRF token
- [ ] Verify excluded middleware does not appear in `route:list -v` output
- [ ] Test alias-based exclusion â€” ensure class name resolution works correctly
- [ ] All `withoutMiddleware()` calls found and reviewed
- [ ] Each exclusion uses FQCN, not alias string
- [ ] `route:list -v` confirms exclusion works
- [ ] Document why middleware is excluded applied
- [ ] Use `withoutMiddleware()` sparingly applied
- [ ] Prefer adding to specific routes over excluding from global applied
- [ ] Verify exclusion with `route:list -v` applied
- [ ] Exclude-and-Forget (No Documentation) prevented
- [ ] Using Alias Strings Instead of FQCN in withoutMiddleware() prevented
- [ ] String mismatch in exclusion class name prevented
- [ ] Alias vs class name confusion prevented

---

# Architecture Checklist

- [ ] Route-level only architecture followed
- [ ] After assembly architecture followed
- [ ] Class name comparison architecture followed
- [ ] `ShouldSkipMiddleware` at runtime architecture followed

---

# Implementation Checklist

- [ ] Document why middleware is excluded applied
- [ ] Use `withoutMiddleware()` sparingly applied
- [ ] Prefer adding to specific routes over excluding from global applied
- [ ] Verify exclusion with `route:list -v` applied
- [ ] String mismatch in exclusion class name prevented
- [ ] Alias vs class name confusion prevented
- [ ] Excluding group middleware without checking route:list prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Exclude-and-Forget (No Documentation) prevented
- [ ] Using Alias Strings Instead of FQCN in withoutMiddleware() prevented
- [ ] Global-Plus-Exclude Pattern prevented
- [ ] Excluding Security Middleware for Development Convenience prevented
- [ ] Not Verifying Exclusion with route:list -v prevented

---

# Testing Checklist

- [ ] All `withoutMiddleware()` calls found and reviewed
- [ ] Each exclusion uses FQCN, not alias string
- [ ] `route:list -v` confirms exclusion works
- [ ] Rationale comment present for each exclusion
- [ ] Exclude `VerifyCsrfToken` from a POST route â€” verify the route works without CSRF token
- [ ] Verify excluded middleware does not appear in `route:list -v` output
- [ ] Test alias-based exclusion â€” ensure class name resolution works correctly
- [ ] Implement `ShouldSkipMiddleware` â€” verify `shouldSkip()` is called before `handle()`
- [ ] Every withoutMiddleware() call is documented with a rationale
- [ ] All exclusions use FQCN and are verified to work
- [ ] No security middleware is excluded without documented justification
- [ ] A regular audit schedule for exclusions is in place

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Exclude-and-Forget (No Documentation) prevented
- [ ] Using Alias Strings Instead of FQCN in withoutMiddleware() prevented
- [ ] Global-Plus-Exclude Pattern prevented
- [ ] Excluding Security Middleware for Development Convenience prevented
- [ ] Not Verifying Exclusion with route:list -v prevented

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

- Pipeline Pattern Fundamentals (pipeline assembly before exclusion)
- Route Middleware (middleware gathering and merge flow)
- Middleware Aliases (alias-to-class resolution for exclusion matching)
- CSRF Protection (common exclusion use case for webhooks)
- Global Middleware Stack (exclusion targeting global middleware)
- Middleware Groups (exclusion effect on group-applied middleware)

---


