# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Compilation Optimization
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan optimize` completes without errors in production
- [ ] All cache files exist in `bootstrap/cache/`
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] `php artisan optimize:clear` runs before `php artisan optimize`
- [ ] `php artisan optimize` completes without errors
- [ ] `php artisan event:cache` runs as separate step
- [ ] Run optimize last in deployment applied
- [ ] Run optimize:clear before renovating applied
- [ ] Use individual cache commands for targeted changes applied
- [ ] Verify cache integrity applied
- [ ] Running optimize Without Context prevented
- [ ] Ignoring optimize:force in Production prevented
- [ ] Running optimize in development prevented
- [ ] Not running event:cache separately prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Run optimize last in deployment applied
- [ ] Run optimize:clear before renovating applied
- [ ] Use individual cache commands for targeted changes applied
- [ ] Verify cache integrity applied
- [ ] Running optimize in development prevented
- [ ] Not running event:cache separately prevented
- [ ] Optimize before migrations prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Running optimize Without Context prevented
- [ ] Ignoring optimize:force in Production prevented
- [ ] Mixing Optimized and Unoptimized Environments prevented
- [ ] Not Profiling Before Optimization prevented
- [ ] Optimizing Everything Unconditionally prevented

---

# Testing Checklist

- [ ] `php artisan optimize:clear` runs before `php artisan optimize`
- [ ] `php artisan optimize` completes without errors
- [ ] `php artisan event:cache` runs as separate step
- [ ] All cache files exist in `bootstrap/cache/`: `config.php`, `routes.php`, `services.php`, `events.php`
- [ ] `php artisan optimize` completes without errors in production
- [ ] All cache files exist in `bootstrap/cache/`
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] Deployment script runs optimize after migrations
- [ ] All five cache files (config, routes, events, services, views) generated
- [ ] Bootstrap time reduced to 5-15ms (from 50-150ms uncached)
- [ ] No cache-related errors after deployment
- [ ] Full pipeline completes in under 10 seconds

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Running optimize Without Context prevented
- [ ] Ignoring optimize:force in Production prevented
- [ ] Mixing Optimized and Unoptimized Environments prevented
- [ ] Not Profiling Before Optimization prevented
- [ ] Optimizing Everything Unconditionally prevented

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

- All caching KUs (ku-01 through ku-05) — individual cache mechanisms.
- [Config Caching (ku-01)](../config-caching/02-knowledge-unit.md)
- [Route Caching (ku-02)](../ku-02-route-caching/02-knowledge-unit.md)
- [Optimize Command (ku-09)](../optimize-command/02-knowledge-unit.md)
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md)
- `php artisan optimize` runs `config:cache`, `route:cache`, and triggers services manifest generation.
- `event:cache` is NOT always included in `optimize` — check your Laravel version.
- When debugging post-deploy issues, start with `php artisan optimize:clear` to eliminate cache-related causes.
- The `optimize:clear` command is idempotent — running it multiple times is safe.

---


