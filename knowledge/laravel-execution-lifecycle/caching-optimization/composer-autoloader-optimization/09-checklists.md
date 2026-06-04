# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Composer Autoloader Optimization
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `composer install --no-dev -o` is used in production deployment
- [ ] `autoload_classmap.php` exists and is up to date
- [ ] Authoritative mode (-a) is used for Octane deployments
- [ ] `composer install --no-dev -o` is used in production deployment script
- [ ] `vendor/composer/autoload_classmap.php` exists
- [ ] No `ClassNotFoundException` for expected classes
- [ ] Run `composer dump-autoload -o` in deployment applied
- [ ] Use authoritative mode (-a) for Octane applied
- [ ] Regenerate after any composer change applied
- [ ] Combine with OpCache applied
- [ ] Optimizing Autoloader Without Deploying prevented
- [ ] Authoritative Mode in Development prevented
- [ ] Not optimizing autoloader in production prevented
- [ ] Using authoritative mode with dynamic classes prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Run `composer dump-autoload -o` in deployment applied
- [ ] Use authoritative mode (-a) for Octane applied
- [ ] Regenerate after any composer change applied
- [ ] Combine with OpCache applied
- [ ] Not optimizing autoloader in production prevented
- [ ] Using authoritative mode with dynamic classes prevented
- [ ] Stale classmap after composer update prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Optimizing Autoloader Without Deploying prevented
- [ ] Authoritative Mode in Development prevented
- [ ] Manual Classmap Editing prevented
- [ ] Not Optimizing Autoloader in Production prevented
- [ ] Forgetting to Regenerate After Composer Changes prevented

---

# Testing Checklist

- [ ] `composer install --no-dev -o` is used in production deployment script
- [ ] `vendor/composer/autoload_classmap.php` exists
- [ ] No `ClassNotFoundException` for expected classes
- [ ] For authoritative mode: no dynamic class generation in the application
- [ ] `composer install --no-dev -o` is used in production deployment
- [ ] `autoload_classmap.php` exists and is up to date
- [ ] Authoritative mode (-a) is used for Octane deployments
- [ ] Autoloader is regenerated after every composer change
- [ ] Class resolution uses O(1) array lookup instead of PSR-4 filesystem scanning
- [ ] Bootstrap time reduced by 2-5ms per request
- [ ] No class-not-found errors from stale classmap
- [ ] Autoloader regenerated as part of standard deployment workflow

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Optimizing Autoloader Without Deploying prevented
- [ ] Authoritative Mode in Development prevented
- [ ] Manual Classmap Editing prevented
- [ ] Not Optimizing Autoloader in Production prevented
- [ ] Forgetting to Regenerate After Composer Changes prevented

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
- [Path Helpers and Environment Detection](../application-bootstrap/path-helpers-and-environment-detection/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md)
- [Optimize Command](./optimize-command/02-knowledge-unit.md)

---


