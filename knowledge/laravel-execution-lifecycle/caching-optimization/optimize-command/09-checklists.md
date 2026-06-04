# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Optimize Command
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan optimize` runs successfully without errors
- [ ] All cache files are present in `bootstrap/cache/` after optimization
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] `php artisan optimize` runs as the last Artisan command before serving traffic
- [ ] `php artisan optimize:clear` runs immediately before `optimize`
- [ ] `php artisan event:cache` runs as a separate step after `optimize`
- [ ] Run optimize after every deployment applied
- [ ] Run optimize:clear before optimize applied
- [ ] Verify optimization applied
- [ ] Check file permissions applied
- [ ] Blind Optimize All prevented
- [ ] Optimize Without Maintenance Mode prevented
- [ ] Running optimize without clearing first prevented
- [ ] Forgetting optimize in deploy prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Run optimize after every deployment applied
- [ ] Run optimize:clear before optimize applied
- [ ] Verify optimization applied
- [ ] Check file permissions applied
- [ ] Monitor optimize duration applied
- [ ] Running optimize without clearing first prevented
- [ ] Forgetting optimize in deploy prevented
- [ ] optimize:clear after optimize prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Blind Optimize All prevented
- [ ] Optimize Without Maintenance Mode prevented
- [ ] Not Clearing Before Optimizing prevented
- [ ] Optimize in CI Artifacts prevented
- [ ] optimize:clear Without Rebuild Strategy prevented

---

# Testing Checklist

- [ ] `php artisan optimize` runs as the last Artisan command before serving traffic
- [ ] `php artisan optimize:clear` runs immediately before `optimize`
- [ ] `php artisan event:cache` runs as a separate step after `optimize`
- [ ] Exit code of each command checked (deployment fails on error)
- [ ] `php artisan optimize` runs successfully without errors
- [ ] All cache files are present in `bootstrap/cache/` after optimization
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] Deployment script includes `optimize:clear` + `optimize` sequence
- [ ] All bootstrap caches generated without errors in every production deployment
- [ ] Bootstrap time reduced to 5-15ms from 50-150ms uncached
- [ ] No partial cache failures (all caches build or none)
- [ ] Deployment pipeline fails fast on cache build errors

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Blind Optimize All prevented
- [ ] Optimize Without Maintenance Mode prevented
- [ ] Not Clearing Before Optimizing prevented
- [ ] Optimize in CI Artifacts prevented
- [ ] optimize:clear Without Rebuild Strategy prevented

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

- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Route Caching](./route-caching/02-knowledge-unit.md)
- [Events Caching](./events-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md)

---


