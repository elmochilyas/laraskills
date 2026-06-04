# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Provider Organization Strategies
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can organize providers by domain bounded context
- [ ] Know when to use dedicated vs consolidated providers
- [ ] Can implement proxy provider pattern for hierarchical registration
- [ ] Each domain has one dedicated provider in `app/Providers/{DomainName}/`
- [ ] Provider class names reflect domain responsibility (not generic names)
- [ ] `bootstrap/providers.php` is grouped with comments showing the architecture layers
- [ ] One provider per bounded context applied
- [ ] Keep provider count 10-30 applied
- [ ] Use `bootstrap/providers.php` as architecture map applied
- [ ] Consolidate via private methods, not god providers applied
- [ ] God AppServiceProvider prevented
- [ ] Provider Per Class prevented
- [ ] One provider per service class prevented
- [ ] Putting everything in AppServiceProvider prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] One provider per bounded context applied
- [ ] Keep provider count 10-30 applied
- [ ] Use `bootstrap/providers.php` as architecture map applied
- [ ] Consolidate via private methods, not god providers applied
- [ ] One provider per service class prevented
- [ ] Putting everything in AppServiceProvider prevented
- [ ] Registering providers from database content prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] God AppServiceProvider prevented
- [ ] Provider Per Class prevented
- [ ] Dynamic Provider Registration prevented
- [ ] Provider Names Not Reflecting Domain prevented
- [ ] Consolidating Too Aggressively prevented

---

# Testing Checklist

- [ ] Each domain has one dedicated provider in `app/Providers/{DomainName}/`
- [ ] Provider class names reflect domain responsibility (not generic names)
- [ ] `bootstrap/providers.php` is grouped with comments showing the architecture layers
- [ ] No cross-domain bindings in a single provider (each provider scoped to its domain)
- [ ] Can organize providers by domain bounded context
- [ ] Know when to use dedicated vs consolidated providers
- [ ] Can implement proxy provider pattern for hierarchical registration
- [ ] Can read `bootstrap/providers.php` as an architecture map
- [ ] bootstrap/providers.php reads like an application architecture map â€” infrastructure layer, then domain contexts.
- [ ] Each domain's bindings are discoverable in one predictable location.
- [ ] New team members can understand application capabilities from the provider list.
- [ ] Provider count in bootstrap/providers.php reduced by consolidating related sub-providers.

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] God AppServiceProvider prevented
- [ ] Provider Per Class prevented
- [ ] Dynamic Provider Registration prevented
- [ ] Provider Names Not Reflecting Domain prevented
- [ ] Consolidating Too Aggressively prevented

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

- provider-fundamentals (provider class contract)
- Domain-Driven Design basics (bounded context alignment)
- provider-sprawl-and-governance (why organization matters)
- provider-sprawl-and-governance (consequences of poor organization)
- environment-specific-providers (organization for env-specific logic)
- package-discovery-and-auto-registration (third-party provider organization)

---


