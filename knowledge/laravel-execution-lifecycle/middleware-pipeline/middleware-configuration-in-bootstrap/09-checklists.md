# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Middleware Configuration In Bootstrap
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Set up middleware configuration in `bootstrap/app.php` using `->withMiddleware()`
- [ ] Register global middleware with `append()` and `prepend()` â€” verify execution order
- [ ] Define a custom `admin` group with its own middleware set
- [ ] `use` statement for `Middleware` class is present
- [ ] `->withMiddleware()` callback is properly indented in the builder chain
- [ ] Global middleware added correctly (append vs prepend as needed)
- [ ] Use `replace()` instead of `remove()` + `append()` applied
- [ ] Keep `withMiddleware()` focused on middleware concerns applied
- [ ] Use `remove()` explicitly rather than `replace()` for deletion applied
- [ ] Cache configuration after changes applied
- [ ] Hybrid Configuration (Kernel + Bootstrap) prevented
- [ ] Not Re-Caching After Changes prevented
- [ ] Editing App\Http\Kernel in Laravel 11 prevented
- [ ] Forgetting use statement prevented

---

# Architecture Checklist

- [ ] Centralized configuration architecture followed
- [ ] Builder Pattern architecture followed
- [ ] Invokable Registry architecture followed
- [ ] Replaces kernel property approach architecture followed
- [ ] Method-based over property-based architecture followed

---

# Implementation Checklist

- [ ] Use `replace()` instead of `remove()` + `append()` applied
- [ ] Keep `withMiddleware()` focused on middleware concerns applied
- [ ] Use `remove()` explicitly rather than `replace()` for deletion applied
- [ ] Cache configuration after changes applied
- [ ] Editing App\Http\Kernel in Laravel 11 prevented
- [ ] Forgetting use statement prevented
- [ ] Using append/prepend incorrectly prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Hybrid Configuration (Kernel + Bootstrap) prevented
- [ ] Not Re-Caching After Changes prevented
- [ ] Using Global append() When Group-Specific Is Needed prevented
- [ ] Forgetting the Middleware use Statement prevented
- [ ] Using remove() + append() Instead of replace() prevented

---

# Testing Checklist

- [ ] `use` statement for `Middleware` class is present
- [ ] `->withMiddleware()` callback is properly indented in the builder chain
- [ ] Global middleware added correctly (append vs prepend as needed)
- [ ] Group modifications use group-specific methods, not global append
- [ ] Set up middleware configuration in `bootstrap/app.php` using `->withMiddleware()`
- [ ] Register global middleware with `append()` and `prepend()` â€” verify execution order
- [ ] Define a custom `admin` group with its own middleware set
- [ ] Register aliases and use them in route definitions
- [ ] All middleware configuration is in bootstrap/app.php (not kernel)
- [ ] Global, group, alias, and priority configuration are present and correct
- [ ] Configuration survives php artisan optimize caching
- [ ] route:list -v shows the expected resolved middleware stack

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Hybrid Configuration (Kernel + Bootstrap) prevented
- [ ] Not Re-Caching After Changes prevented
- [ ] Using Global append() When Group-Specific Is Needed prevented
- [ ] Forgetting the Middleware use Statement prevented
- [ ] Using remove() + append() Instead of replace() prevented

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

- Pipeline Pattern Fundamentals (what is being configured)
- Global Middleware Stack (global stack configuration)
- Middleware Groups (group definition configuration)
- Application Bootstrap (bootstrap/app.php role in application setup)
- Middleware Aliases (alias registration via Middleware::alias())
- Middleware Priority (priority definition via Middleware::priority())
- Middleware Groups (group definition via Middleware::group())

---


