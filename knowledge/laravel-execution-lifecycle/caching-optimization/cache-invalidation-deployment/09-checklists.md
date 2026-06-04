# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Cache Invalidation Deployment
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Deployment script includes `optimize:clear` + `optimize` sequence
- [ ] Caches are built with production-like environment values
- [ ] Symlink swap happens AFTER cache warmup
- [ ] `optimize:clear` runs before `optimize` in deploy script
- [ ] Cache files built in new release directory before symlink swap
- [ ] Migrations run before cache generation
- [ ] Build caches in CI/CD, not on the server applied
- [ ] Use atomic deployments applied
- [ ] Clear before building applied
- [ ] Keep previous caches for rollback applied
- [ ] Building Caches on the Production Server prevented
- [ ] Manual Cache Invalidation via SSH prevented
- [ ] Not clearing cache before deploy prevented
- [ ] Cache built with wrong environment prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Build caches in CI/CD, not on the server applied
- [ ] Use atomic deployments applied
- [ ] Clear before building applied
- [ ] Keep previous caches for rollback applied
- [ ] Monitor cache staleness applied
- [ ] Not clearing cache before deploy prevented
- [ ] Cache built with wrong environment prevented
- [ ] Symlink swap without warmup prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Building Caches on the Production Server prevented
- [ ] Manual Cache Invalidation via SSH prevented
- [ ] One-Size-Fits-All Cache Clear on Every Deploy prevented
- [ ] No Cache Verification After Deploy prevented
- [ ] Not Clearing Cache Before Regeneration prevented

---

# Testing Checklist

- [ ] `optimize:clear` runs before `optimize` in deploy script
- [ ] Cache files built in new release directory before symlink swap
- [ ] Migrations run before cache generation
- [ ] PHP-FPM/Octane workers restarted after cache build
- [ ] Deployment script includes `optimize:clear` + `optimize` sequence
- [ ] Caches are built with production-like environment values
- [ ] Symlink swap happens AFTER cache warmup
- [ ] Rollback keeps previous release's caches intact
- [ ] Zero first-request latency penalty after deployment
- [ ] No class-not-found or provider errors after cutover
- [ ] Rollback completes instantly with full cache support
- [ ] All workers serve new code within seconds of completion

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Building Caches on the Production Server prevented
- [ ] Manual Cache Invalidation via SSH prevented
- [ ] One-Size-Fits-All Cache Clear on Every Deploy prevented
- [ ] No Cache Verification After Deploy prevented
- [ ] Not Clearing Cache Before Regeneration prevented

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

- [Optimize Command](./optimize-command/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Route Caching](./route-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md)
- [Events Caching](./events-caching/02-knowledge-unit.md)

---


