# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Bootstrap Warmup In Cicd
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] CI/CD pipeline includes `optimize:clear` + `optimize` steps
- [ ] Caches are built with production-like environment values
- [ ] Warmup completes before traffic is routed to new deployment
- [ ] `bootstrap/cache/config.php` exists and contains production-like values
- [ ] `bootstrap/cache/routes.php` exists and produces correct route list
- [ ] `bootstrap/cache/events.php` exists (if events are used)
- [ ] Warm caches before traffic is routed applied
- [ ] Verify caches after warmup applied
- [ ] Use build-time warmup for containers applied
- [ ] Include environment-appropriate values applied
- [ ] Manual Warmup via SSH prevented
- [ ] Skipping Warmup for Emergency Deploys prevented
- [ ] Building caches with wrong env prevented
- [ ] Not clearing caches before warmup prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Warm caches before traffic is routed applied
- [ ] Verify caches after warmup applied
- [ ] Use build-time warmup for containers applied
- [ ] Include environment-appropriate values applied
- [ ] Monitor warmup duration applied
- [ ] Building caches with wrong env prevented
- [ ] Not clearing caches before warmup prevented
- [ ] Skipping warmup for "small" deploys prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Manual Warmup via SSH prevented
- [ ] Skipping Warmup for Emergency Deploys prevented
- [ ] One Pipeline for All Environments prevented
- [ ] Warmup After Traffic Switch prevented
- [ ] Cache Built with Wrong Environment Variables prevented

---

# Testing Checklist

- [ ] `bootstrap/cache/config.php` exists and contains production-like values
- [ ] `bootstrap/cache/routes.php` exists and produces correct route list
- [ ] `bootstrap/cache/events.php` exists (if events are used)
- [ ] `bootstrap/cache/services.php` exists with expected providers
- [ ] CI/CD pipeline includes `optimize:clear` + `optimize` steps
- [ ] Caches are built with production-like environment values
- [ ] Warmup completes before traffic is routed to new deployment
- [ ] Cache build failures cause deployment to fail (not silently skipped)
- [ ] All bootstrap cache files exist before traffic reaches new deployment
- [ ] First request latency matches optimized (50-150ms faster than cold)
- [ ] Cache build failures halt deployment with clear error
- [ ] Container images include pre-built caches ready to serve

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Manual Warmup via SSH prevented
- [ ] Skipping Warmup for Emergency Deploys prevented
- [ ] One Pipeline for All Environments prevented
- [ ] Warmup After Traffic Switch prevented
- [ ] Cache Built with Wrong Environment Variables prevented

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
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Route Caching](./route-caching/02-knowledge-unit.md)
- [Events Caching](./events-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)

---


