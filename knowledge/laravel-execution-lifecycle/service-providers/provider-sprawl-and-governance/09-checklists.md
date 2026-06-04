# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Provider Sprawl And Governance
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can audit the full provider list (manual + discovered) for an application
- [ ] Can set up CI enforcement of provider budget
- [ ] Can perform a provider audit and identify candidates for deferral or removal
- [ ] Provider budget value is documented and agreed upon by the team
- [ ] CI script counts both manual and auto-discovered providers
- [ ] CI pipeline fails when budget is exceeded
- [ ] Set a provider budget applied
- [ ] Perform quarterly provider audits applied
- [ ] Default to deferred applied
- [ ] Monitor provider count as a deployment metric applied
- [ ] Unchecked Provider Growth prevented
- [ ] God Provider After Consolidation prevented
- [ ] Assuming provider count doesn't matter prevented
- [ ] Only counting manual providers prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Set a provider budget applied
- [ ] Perform quarterly provider audits applied
- [ ] Default to deferred applied
- [ ] Monitor provider count as a deployment metric applied
- [ ] Assuming provider count doesn't matter prevented
- [ ] Only counting manual providers prevented
- [ ] Adding provider without checking for existing duplicate prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Unchecked Provider Growth prevented
- [ ] God Provider After Consolidation prevented
- [ ] Alert Fatigue from Budget Violations prevented
- [ ] Only Counting Manual Providers prevented
- [ ] Adding Without Checking Existing Duplicates prevented

---

# Testing Checklist

- [ ] Provider budget value is documented and agreed upon by the team
- [ ] CI script counts both manual and auto-discovered providers
- [ ] CI pipeline fails when budget is exceeded
- [ ] Exception process exists (how to exceed budget when justified)
- [ ] Can audit the full provider list (manual + discovered) for an application
- [ ] Can set up CI enforcement of provider budget
- [ ] Can perform a provider audit and identify candidates for deferral or removal
- [ ] Understand the different cost model under Octane vs FPM
- [ ] CI pipeline fails when provider budget is exceeded.
- [ ] Provider count stays within budget (or exceptions are documented).
- [ ] Team has visibility into provider count changes on every PR.
- [ ] Reduced total provider count by 20%+ or to within budget (whichever is more ambitious).

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Unchecked Provider Growth prevented
- [ ] God Provider After Consolidation prevented
- [ ] Alert Fatigue from Budget Violations prevented
- [ ] Only Counting Manual Providers prevented
- [ ] Adding Without Checking Existing Duplicates prevented

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

- provider-fundamentals (what constitutes a provider)
- eager-providers (main source of bootstrap overhead)
- deferred-providers (primary mitigation strategy)
- provider-organization-strategies (consolidation tactics)
- environment-specific-providers (reducing production provider count)
- package-discovery-and-auto-registration (auto-discovered providers as sprawl source)
- eager-providers (identifying unnecessary eager providers)

---


