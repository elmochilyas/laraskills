# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Service Providers
**Knowledge Unit:** Eager Providers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can distinguish eager vs deferred providers and their tradeoffs
- [ ] Know which providers must be eager (boot-time registrations)
- [ ] Can profile eager provider overhead using Debugbar or Xdebug
- [ ] Every eager provider identified and categorized (infrastructure / domain / package)
- [ ] Bootstrap time measured before optimization (baseline)
- [ ] Eligible deferred candidates identified (services used on <30% of routes)
- [ ] Keep eager providers lightweight applied
- [ ] Audit eager provider count applied
- [ ] Prefer deferred for rarely-used services applied
- [ ] Profile bootstrap time applied
- [ ] Unintentional Eager Provider prevented
- [ ] Eager Provider Loading Large Datasets prevented
- [ ] Making every provider deferred for "optimization" prevented
- [ ] Multiple tiny providers when one suffices prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Keep eager providers lightweight applied
- [ ] Audit eager provider count applied
- [ ] Prefer deferred for rarely-used services applied
- [ ] Profile bootstrap time applied
- [ ] Making every provider deferred for "optimization" prevented
- [ ] Multiple tiny providers when one suffices prevented
- [ ] Assuming a provider is deferred when it's actually eager prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Unintentional Eager Provider prevented
- [ ] Eager Provider Loading Large Datasets prevented
- [ ] God Eager Provider prevented
- [ ] Every Provider Eager by Default prevented
- [ ] Assuming Auto-Discovered Provider Is Deferred prevented

---

# Testing Checklist

- [ ] Every eager provider identified and categorized (infrastructure / domain / package)
- [ ] Bootstrap time measured before optimization (baseline)
- [ ] Eligible deferred candidates identified (services used on <30% of routes)
- [ ] No boot-time artifact registrations in converted providers
- [ ] Can distinguish eager vs deferred providers and their tradeoffs
- [ ] Know which providers must be eager (boot-time registrations)
- [ ] Can profile eager provider overhead using Debugbar or Xdebug
- [ ] Understand the default behavior (eager unless `DeferrableProvider`)
- [ ] Bootstrap time reduced by at least the combined cost of converted providers.
- [ ] No regressions in route availability, event dispatching, or view rendering.
- [ ] Provider count audit documents which are eager, deferred, and why.
- [ ] Re-profiling schedule established (quarterly automated check).

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Unintentional Eager Provider prevented
- [ ] Eager Provider Loading Large Datasets prevented
- [ ] God Eager Provider prevented
- [ ] Every Provider Eager by Default prevented
- [ ] Assuming Auto-Discovered Provider Is Deferred prevented

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

- provider-fundamentals (provider contract and registration flow)
- register-vs-boot-methods (what eager providers execute on every request)
- deferred-providers (comparison with lazy-loaded alternatives)
- provider-sprawl-and-governance (managing eager provider count)
- environment-specific-providers (conditional eager registration)

---


