# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Environment Specific Providers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can implement compile-time exclusion vs runtime guard
- [ ] Understand why compile-time exclusion is more performant
- [ ] Can use `dont-discover` + conditional manual registration for development packages
- [ ] Development provider excluded from auto-discovery via `dont-discover`
- [ ] Conditional registration uses compile-time exclusion (not runtime guard inside the provider itself)
- [ ] Provider does NOT appear in production provider list (`php artisan about --json`)
- [ ] Prefer compile-time exclusion applied
- [ ] Use config-driven guards over environment strings applied
- [ ] Use `dont-discover` + manual registration applied
- [ ] Audit production provider list applied
- [ ] Guard in boot() Only prevented
- [ ] Environment String Hard-Coding prevented
- [ ] Only guarding in boot() but registering bindings in register() prevented
- [ ] Using environment check in register() for auto-discovered provider prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer compile-time exclusion applied
- [ ] Use config-driven guards over environment strings applied
- [ ] Use `dont-discover` + manual registration applied
- [ ] Audit production provider list applied
- [ ] Only guarding in boot() but registering bindings in register() prevented
- [ ] Using environment check in register() for auto-discovered provider prevented
- [ ] APP_ENV misconfigured as local in production prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Guard in boot() Only prevented
- [ ] Environment String Hard-Coding prevented
- [ ] Partial Deferral of Dev-Only Providers prevented
- [ ] Development Providers in Production prevented
- [ ] Environment Guards in Deferred Providers prevented

---

# Testing Checklist

- [ ] Development provider excluded from auto-discovery via `dont-discover`
- [ ] Conditional registration uses compile-time exclusion (not runtime guard inside the provider itself)
- [ ] Provider does NOT appear in production provider list (`php artisan about --json`)
- [ ] Provider IS registered in target environment (local/staging)
- [ ] Can implement compile-time exclusion vs runtime guard
- [ ] Understand why compile-time exclusion is more performant
- [ ] Can use `dont-discover` + conditional manual registration for development packages
- [ ] Know how to audit the production provider list
- [ ] Development providers are registered in local but absent from production provider list.
- [ ] Zero bootstrap overhead from excluded providers in production.
- [ ] Provider registration uses compile-time exclusion (not runtime guards).
- [ ] CI/CD pipeline validates that no development providers are registered in production.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Guard in boot() Only prevented
- [ ] Environment String Hard-Coding prevented
- [ ] Partial Deferral of Dev-Only Providers prevented
- [ ] Development Providers in Production prevented
- [ ] Environment Guards in Deferred Providers prevented

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

- provider-fundamentals (provider registration mechanics)
- Application Environment Configuration (APP_ENV and config-driven checks)
- Application Bootstrap (bootstrap/providers.php limitations for conditional logic)
- package-discovery-and-auto-registration (dont-discover for env-specific packages)
- provider-organization-strategies (proxy provider pattern for env gating)
- eager-providers (environment gating to prevent eager overhead in production)

---


