# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Caching Optimization
**Knowledge Unit:** Opcache Configuration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] OpCache is enabled in production PHP configuration
- [ ] memory_consumption is sufficient for the application (256MB+)
- [ ] max_accelerated_files >= total PHP file count
- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] Set memory_consumption to at least 256MB applied
- [ ] Set max_accelerated_files to at least 20000 applied
- [ ] Use validate_timestamps=0 in production applied
- [ ] Use opcache.preload for critical paths applied
- [ ] Default opcache Settings on Large Apps prevented
- [ ] validate_timestamps=1 in Production prevented
- [ ] validate_timestamps=1 in production prevented
- [ ] Insufficient memory_consumption prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Set memory_consumption to at least 256MB applied
- [ ] Set max_accelerated_files to at least 20000 applied
- [ ] Use validate_timestamps=0 in production applied
- [ ] Use opcache.preload for critical paths applied
- [ ] Reset OpCache after deployment applied
- [ ] validate_timestamps=1 in production prevented
- [ ] Insufficient memory_consumption prevented
- [ ] No OpCache reset after deploy prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Default opcache Settings on Large Apps prevented
- [ ] validate_timestamps=1 in Production prevented
- [ ] No Opcache Monitoring prevented
- [ ] Not Warming Opcache on Deploy prevented
- [ ] opcache.max_accelerated_files Too Low prevented

---

# Testing Checklist

- [ ] `opcache.enable=1` confirmed via `php -i`
- [ ] `opcache.memory_consumption` set to at least 256MB
- [ ] `opcache.max_accelerated_files` >= total PHP file count
- [ ] `opcache.validate_timestamps=0` in production configuration
- [ ] OpCache is enabled in production PHP configuration
- [ ] memory_consumption is sufficient for the application (256MB+)
- [ ] max_accelerated_files >= total PHP file count
- [ ] validate_timestamps=0 in production
- [ ] OpCache hit ratio > 95% in production
- [ ] No stale opcode issues after code deployment
- [ ] PHP compilation overhead eliminated (files compiled once, cached permanently)
- [ ] Configuration scales with application growth (adequate memory and file limits)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Default opcache Settings on Large Apps prevented
- [ ] validate_timestamps=1 in Production prevented
- [ ] No Opcache Monitoring prevented
- [ ] Not Warming Opcache on Deploy prevented
- [ ] opcache.max_accelerated_files Too Low prevented

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

- [Complete Boot Sequence](../boot-order-timing/complete-boot-sequence/02-knowledge-unit.md)
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md)
- [Config Caching](./config-caching/02-knowledge-unit.md)
- [Route Caching](./route-caching/02-knowledge-unit.md)
- [Services Cache](./services-cache/02-knowledge-unit.md)

---


