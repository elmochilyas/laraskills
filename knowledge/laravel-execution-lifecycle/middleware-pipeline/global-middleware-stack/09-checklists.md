# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Middleware Pipeline
**Knowledge Unit:** Global Middleware Stack
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] List all default global middleware and understand each one's purpose
- [ ] Run `php artisan route:list -v` and identify global middleware on a sample route
- [ ] Add custom global middleware and verify it runs on every route
- [ ] Global stack contains only infrastructure middleware
- [ ] No session/cookie middleware in global for API-only apps
- [ ] Trust proxies run before IP-dependent middleware
- [ ] Audit global middleware before production applied
- [ ] Add middleware at the most specific level possible applied
- [ ] Use `php artisan route:list -v` to verify per-route middleware applied
- [ ] Keep global middleware order predictable applied
- [ ] Adding Custom Middleware to Global Unnecessarily prevented
- [ ] Removing Default Global Middleware Without Understanding prevented
- [ ] Adding custom middleware to global unnecessarily prevented
- [ ] Removing default global middleware without understanding prevented

---

# Architecture Checklist

- [ ] Global vs group vs route architecture followed
- [ ] Predictable execution order architecture followed
- [ ] Default set is ordered architecture followed

---

# Implementation Checklist

- [ ] Audit global middleware before production applied
- [ ] Add middleware at the most specific level possible applied
- [ ] Use `php artisan route:list -v` to verify per-route middleware applied
- [ ] Keep global middleware order predictable applied
- [ ] Adding custom middleware to global unnecessarily prevented
- [ ] Removing default global middleware without understanding prevented
- [ ] Heavy middleware in global stack prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Adding Custom Middleware to Global Unnecessarily prevented
- [ ] Removing Default Global Middleware Without Understanding prevented
- [ ] Heavy Middleware in Global Stack prevented
- [ ] Not Ordering Global Middleware Correctly prevented
- [ ] API Routes with Session Middleware prevented

---

# Testing Checklist

- [ ] Global stack contains only infrastructure middleware
- [ ] No session/cookie middleware in global for API-only apps
- [ ] Trust proxies run before IP-dependent middleware
- [ ] Maintenance mode middleware blocks before any processing
- [ ] List all default global middleware and understand each one's purpose
- [ ] Run `php artisan route:list -v` and identify global middleware on a sample route
- [ ] Add custom global middleware and verify it runs on every route
- [ ] Remove a global middleware and verify the effect (e.g., remove session middleware, test auth)
- [ ] Global stack contains only necessary infrastructure middleware
- [ ] No application-specific middleware in global stack
- [ ] All routes benefit from or are not harmed by global middleware
- [ ] Health checks and monitoring endpoints remain functional

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Adding Custom Middleware to Global Unnecessarily prevented
- [ ] Removing Default Global Middleware Without Understanding prevented
- [ ] Heavy Middleware in Global Stack prevented
- [ ] Not Ordering Global Middleware Correctly prevented
- [ ] API Routes with Session Middleware prevented

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

- Pipeline Pattern Fundamentals (onion model and pipe chaining)
- Kernel Architecture (HTTP kernel request handling flow)
- Middleware Groups (named middleware collections applied to route files)
- Default Middleware Members (individual middleware class responsibilities)

---


