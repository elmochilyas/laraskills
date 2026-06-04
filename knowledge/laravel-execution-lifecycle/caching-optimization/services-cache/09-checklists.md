# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Services Cache
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Services cache is regenerated after all provider changes
- [ ] `bootstrap/cache/services.php` is not in version control
- [ ] Provider count per request is monitored for optimization opportunities
- [ ] `bootstrap/cache/services.php` exists after regeneration
- [ ] All expected providers appear in the manifest (check file manually if needed)
- [ ] Manifest regenerated after any provider addition, removal, or reorder
- [ ] Clear services cache after provider changes applied
- [ ] Do not commit the services cache applied
- [ ] Generate services cache after deployment warmup applied
- [ ] Monitor provider count applied
- [ ] Caching Without Service Provider Understanding prevented
- [ ] Service Cache with Deferred Providers prevented
- [ ] Adding provider without clearing cache prevented
- [ ] Removing provider without clearing cache prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Clear services cache after provider changes applied
- [ ] Do not commit the services cache applied
- [ ] Generate services cache after deployment warmup applied
- [ ] Monitor provider count applied
- [ ] Adding provider without clearing cache prevented
- [ ] Removing provider without clearing cache prevented
- [ ] Assuming optimize always regenerates prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Caching Without Service Provider Understanding prevented
- [ ] Service Cache with Deferred Providers prevented
- [ ] Not Clearing Services Cache After Provider Changes prevented
- [ ] Services Cache Without Config Cache prevented
- [ ] Assuming Services Cache Covers All Providers prevented

---

# Testing Checklist

- [ ] `bootstrap/cache/services.php` exists after regeneration
- [ ] All expected providers appear in the manifest (check file manually if needed)
- [ ] Manifest regenerated after any provider addition, removal, or reorder
- [ ] Manifest regenerated after any `composer install` or `composer update`
- [ ] Services cache is regenerated after all provider changes
- [ ] `bootstrap/cache/services.php` is not in version control
- [ ] Provider count per request is monitored for optimization opportunities
- [ ] Deferred providers correctly implement `DeferrableProvider` and `provides()`
- [ ] All expected providers registered after every deployment
- [ ] No ClassNotFoundException from stale service manifest
- [ ] Deferred providers correctly skip register()/boot() until first resolution
- [ ] Provider count per request is monitored and optimized for performance

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Caching Without Service Provider Understanding prevented
- [ ] Service Cache with Deferred Providers prevented
- [ ] Not Clearing Services Cache After Provider Changes prevented
- [ ] Services Cache Without Config Cache prevented
- [ ] Assuming Services Cache Covers All Providers prevented

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

- [Deferred Provider Loading Timing](../boot-order-timing/deferred-provider-loading-timing/02-knowledge-unit.md)
- [Register Phase Order](../boot-order-timing/register-phase-order/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Optimize Command](./optimize-command/02-knowledge-unit.md)
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md)

---


