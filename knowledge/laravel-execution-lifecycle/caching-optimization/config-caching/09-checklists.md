# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Config Caching
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `php artisan config:cache` runs successfully without errors
- [ ] No `env()` calls exist outside of `config/*.php` files
- [ ] `bootstrap/cache/config.php` is not committed to version control
- [ ] `php artisan config:cache` runs without errors (no Closure exceptions)
- [ ] `bootstrap/cache/config.php` exists
- [ ] No `env()` calls exist in controllers, middleware, jobs, or views
- [ ] Always use `config()` instead of `env()` in application code applied
- [ ] Wrap all `env()` calls in config files applied
- [ ] Cache after every deployment applied
- [ ] Secure the cached file applied
- [ ] env() in Application Code prevented
- [ ] Dynamic Config Keys prevented
- [ ] env() in app code prevented
- [ ] Stale cache after .env change prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use `config()` instead of `env()` in application code applied
- [ ] Wrap all `env()` calls in config files applied
- [ ] Cache after every deployment applied
- [ ] Secure the cached file applied
- [ ] env() in app code prevented
- [ ] Stale cache after .env change prevented
- [ ] Closures in config prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] env() in Application Code prevented
- [ ] Dynamic Config Keys prevented
- [ ] Config Cache in Development prevented
- [ ] Closures in Config Files prevented
- [ ] Stale Cache After .env Changes prevented

---

# Testing Checklist

- [ ] `php artisan config:cache` runs without errors (no Closure exceptions)
- [ ] `bootstrap/cache/config.php` exists
- [ ] No `env()` calls exist in controllers, middleware, jobs, or views
- [ ] `config:cache` runs before `route:cache` and `event:cache`
- [ ] `php artisan config:cache` runs successfully without errors
- [ ] No `env()` calls exist outside of `config/*.php` files
- [ ] `bootstrap/cache/config.php` is not committed to version control
- [ ] Deployment script includes `config:cache` step
- [ ] Config loading reduced from 30-80ms to <1ms per request
- [ ] No env() calls exist outside config/.php
- [ ] Cache rebuilds automatically after any .env or config change
- [ ] Secrets protected with restrictive file permissions

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] env() in Application Code prevented
- [ ] Dynamic Config Keys prevented
- [ ] Config Cache in Development prevented
- [ ] Closures in Config Files prevented
- [ ] Stale Cache After .env Changes prevented

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
- [Application Builder Configuration](../application-bootstrap/application-builder-configuration/02-knowledge-unit.md)
- [Route Caching](./route-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [Optimize Command](./optimize-command/02-knowledge-unit.md)

---


