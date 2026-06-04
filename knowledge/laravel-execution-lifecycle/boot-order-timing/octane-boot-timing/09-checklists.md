# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Boot Order Timing
**Knowledge Unit:** Octane Boot Timing
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All per-request services use scoped(), not singleton()
- [ ] Static properties are audited for accumulation risk
- [ ] Octane flush listeners are configured for session, auth, uploaded files
- [ ] All per-request services use `scoped()` instead of `singleton()`
- [ ] Octane flush listeners are configured for session, auth, and uploaded files
- [ ] Application-specific flush listeners handle custom request-scoped state
- [ ] Pre-resolve hot-path services in booted() applied
- [ ] Use scoped() for per-request state applied
- [ ] Audit all singletons applied
- [ ] Clear resolved instances applied
- [ ] Request-Scoped Singletons prevented
- [ ] No Flush Listeners for Auth, Session, Uploads prevented
- [ ] Using singleton for request-state services prevented
- [ ] Static property accumulation prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Pre-resolve hot-path services in booted() applied
- [ ] Use scoped() for per-request state applied
- [ ] Audit all singletons applied
- [ ] Clear resolved instances applied
- [ ] Leverage one-time boot cost applied
- [ ] Using singleton for request-state services prevented
- [ ] Static property accumulation prevented
- [ ] Not testing with Octane prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Request-Scoped Singletons prevented
- [ ] No Flush Listeners for Auth, Session, Uploads prevented
- [ ] Static Cache Accumulation prevented
- [ ] Deferred Providers Everywhere for Octane prevented
- [ ] No max_requests Configuration prevented

---

# Testing Checklist

- [ ] All per-request services use `scoped()` instead of `singleton()`
- [ ] Octane flush listeners are configured for session, auth, and uploaded files
- [ ] Application-specific flush listeners handle custom request-scoped state
- [ ] `max_requests` is configured to prevent unbounded memory growth
- [ ] All per-request services use scoped(), not singleton()
- [ ] Static properties are audited for accumulation risk
- [ ] Octane flush listeners are configured for session, auth, uploaded files
- [ ] max_requests is configured to prevent unbounded memory growth
- [ ] No state leaks occur between requests handled by the same Octane worker
- [ ] All per-request services use scoped() binding type
- [ ] Octane flush listeners are fully configured and tested
- [ ] Workers restart before memory growth causes issues (via max_requests)

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Request-Scoped Singletons prevented
- [ ] No Flush Listeners for Auth, Session, Uploads prevented
- [ ] Static Cache Accumulation prevented
- [ ] Deferred Providers Everywhere for Octane prevented
- [ ] No max_requests Configuration prevented

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

- [Complete Boot Sequence](../complete-boot-sequence/02-knowledge-unit.md)
- [Application Flush and Reset](../application-bootstrap/application-flush-and-reset/02-knowledge-unit.md)
- [Boot Phase Order](../boot-phase-order/02-knowledge-unit.md)
- [Lifecycle Callback Hooks](../lifecycle-callback-hooks/02-knowledge-unit.md)
- [Deferred Provider Loading Timing](../deferred-provider-loading-timing/02-knowledge-unit.md)
- [Console vs HTTP Boot Differences](../console-vs-http-boot-differences/02-knowledge-unit.md)

---


