# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Route Caching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] Use controller strings for all routes applied
- [ ] Cache after config:cache applied
- [ ] Validate routes before caching applied
- [ ] Include in deployment applied
- [ ] Closure Routes Blocking Cache prevented
- [ ] Route Cache Deployed Without Regeneration prevented
- [ ] Closure routes prevented
- [ ] Missing re-cache after route addition prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Use controller strings for all routes applied
- [ ] Cache after config:cache applied
- [ ] Validate routes before caching applied
- [ ] Include in deployment applied
- [ ] Closure routes prevented
- [ ] Missing re-cache after route addition prevented
- [ ] Caching without config cache prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Closure Routes Blocking Cache prevented
- [ ] Route Cache Deployed Without Regeneration prevented
- [ ] Not Clearing Cache on Route Change prevented
- [ ] Caching Before All Route Files Load prevented
- [ ] Route Cache Without Config Cache prevented

---

# Testing Checklist

- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] `php artisan route:list` output matches expected routes after caching
- [ ] `php artisan route:cache` runs without LogicException
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment
- [ ] `php artisan route:list` output matches expectations after caching
- [ ] Route registration overhead reduced from 20-40ms to 0ms per request
- [ ] No Closure routes exist in the codebase
- [ ] All routes cache successfully on every production deployment
- [ ] URL matching resolves correctly via compiled prefix tree

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Closure Routes Blocking Cache prevented
- [ ] Route Cache Deployed Without Regeneration prevented
- [ ] Not Clearing Cache on Route Change prevented
- [ ] Caching Before All Route Files Load prevented
- [ ] Route Cache Without Config Cache prevented

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

- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [Optimize Command](./optimize-command/02-knowledge-unit.md)
- [Events Caching](./events-caching/02-knowledge-unit.md)

---


