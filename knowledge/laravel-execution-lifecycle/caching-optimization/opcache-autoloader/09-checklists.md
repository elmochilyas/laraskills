# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Opcache Autoloader
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] OpCache is enabled in production (`php -i | grep opcache.enable`)
- [ ] `memory_consumption` is sufficient (monitor `opcache_get_status()['memory_usage']`)
- [ ] `validate_timestamps=0` is set in production
- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] Configure OpCache for Laravel applied
- [ ] Restart PHP on deploy applied
- [ ] Use `--optimize-autoloader` with composer install applied
- [ ] Preload for Octane applied
- [ ] No opcache Settings Tuning prevented
- [ ] Using files in composer.json Inefficiently prevented
- [ ] Not restarting PHP after deploy prevented
- [ ] Undersized memory_consumption prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure OpCache for Laravel applied
- [ ] Restart PHP on deploy applied
- [ ] Use `--optimize-autoloader` with composer install applied
- [ ] Preload for Octane applied
- [ ] Not restarting PHP after deploy prevented
- [ ] Undersized memory_consumption prevented
- [ ] Authoritative mode with dynamic classes prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] No opcache Settings Tuning prevented
- [ ] Using files in composer.json Inefficiently prevented
- [ ] Ignoring opcache.validate_timestamps=0 in Production prevented
- [ ] Not Warming Opcache on Deploy prevented
- [ ] Monolithic Classmap Without Profiling prevented

---

# Testing Checklist

- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] `opcache.validate_timestamps=0` in production
- [ ] OpCache is enabled in production (`php -i | grep opcache.enable`)
- [ ] `memory_consumption` is sufficient (monitor `opcache_get_status()['memory_usage']`)
- [ ] `validate_timestamps=0` is set in production
- [ ] PHP-FPM or Octane workers are restarted after deployment
- [ ] OpCache hit ratio > 95% in production
- [ ] No stale opcode issues after deployment
- [ ] PHP compilation overhead eliminated (files compiled once, cached permanently)
- [ ] Configuration resilient to application growth (adequate memory and file limits)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No opcache Settings Tuning prevented
- [ ] Using files in composer.json Inefficiently prevented
- [ ] Ignoring opcache.validate_timestamps=0 in Production prevented
- [ ] Not Warming Opcache on Deploy prevented
- [ ] Monolithic Classmap Without Profiling prevented

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

- [Config Caching (ku-01)](../config-caching/02-knowledge-unit.md)
- [Route Caching (ku-02)](../ku-02-route-caching/02-knowledge-unit.md)
- [Compilation Optimization (ku-06)](../ku-06-compilation-optimization/02-knowledge-unit.md)
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md)
- OpCache status: `opcache_get_status()` returns cache statistics, memory usage, and file list.
- Use `opcache_reset()` in a deploy script to clear OpCache without restarting PHP (requires `opcache.enable_cli=1`).
- Composer 2.x uses `autoload_static.php` for zero-overhead classmap — default in Composer 2+.
- The `--apcu` autoloader flag stores the classmap in APCu — adds extension dependency but marginally improves lookup speed.

---


