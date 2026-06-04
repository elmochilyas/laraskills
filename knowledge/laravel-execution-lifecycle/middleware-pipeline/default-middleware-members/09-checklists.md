# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Default Middleware Members
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] List all default global, web group, and api group middleware
- [ ] Understand the purpose of each default middleware
- [ ] Run `route:list -v` for a web route and identify all default middleware
- [ ] Global stack middleware listed and understood
- [ ] Web group middleware listed and understood
- [ ] API group middleware listed and understood
- [ ] Audit default middleware before production applied
- [ ] Understand the ordering dependency chain applied
- [ ] Don't remove `SubstituteBindings` applied
- [ ] Use `php artisan route:list -v` to see default middleware per route applied
- [ ] Blindly Removing Default Middleware prevented
- [ ] Adding Heavy Middleware to Default Groups prevented
- [ ] Removing default middleware without understanding prevented
- [ ] Moving middleware from web to api without adjusting priority prevented

---

# Architecture Checklist

- [ ] Security defaults out of the box architecture followed
- [ ] Group specialization architecture followed
- [ ] Layered concerns architecture followed
- [ ] Dependency chain architecture followed

---

# Implementation Checklist

- [ ] Audit default middleware before production applied
- [ ] Understand the ordering dependency chain applied
- [ ] Don't remove `SubstituteBindings` applied
- [ ] Use `php artisan route:list -v` to see default middleware per route applied
- [ ] Removing default middleware without understanding prevented
- [ ] Moving middleware from web to api without adjusting priority prevented
- [ ] Assuming defaults are the same across Laravel versions prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Blindly Removing Default Middleware prevented
- [ ] Adding Heavy Middleware to Default Groups prevented
- [ ] Not Verifying Middleware Composition After Upgrades prevented
- [ ] Modifying Default Groups Instead of Creating Custom Groups prevented
- [ ] Removing SubstituteBindings Without Knowing the Impact prevented

---

# Testing Checklist

- [ ] Global stack middleware listed and understood
- [ ] Web group middleware listed and understood
- [ ] API group middleware listed and understood
- [ ] Dependency chain documented
- [ ] List all default global, web group, and api group middleware
- [ ] Understand the purpose of each default middleware
- [ ] Run `route:list -v` for a web route and identify all default middleware
- [ ] Remove `VerifyCsrfToken` from a test route â€” verify POST requests work without token
- [ ] You can list every default middleware from memory
- [ ] You know which defaults are essential vs optional for your app type
- [ ] You have documented the dependency chain
- [ ] You have identified which defaults to remove for performance optimization

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Blindly Removing Default Middleware prevented
- [ ] Adding Heavy Middleware to Default Groups prevented
- [ ] Not Verifying Middleware Composition After Upgrades prevented
- [ ] Modifying Default Groups Instead of Creating Custom Groups prevented
- [ ] Removing SubstituteBindings Without Knowing the Impact prevented

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

- Pipeline Pattern Fundamentals (pipe ordering and chaining)
- Global Middleware Stack (outermost default middleware layer)
- Middleware Groups (web/api group composition)
- Middleware Aliases (default alias registrations for built-in middleware)
- Middleware Priority (ordering constraints among default middleware)
- Pre-and-Post-Middleware Code (how default middleware uses pre/post patterns)

---


