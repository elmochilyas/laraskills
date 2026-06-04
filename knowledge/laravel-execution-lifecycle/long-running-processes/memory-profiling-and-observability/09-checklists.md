# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Memory Profiling And Observability
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Log `memory_get_usage()` before and after each request â€” calculate delta
- [ ] Set up a baseline trend tracker â€” log baseline after every 100 requests
- [ ] Run GC status check: `gc_status()` â€” monitor roots count over time
- [ ] `memory_get_usage()` logged before and after each request with delta calculated
- [ ] Baseline trend tracker logs baseline after every N requests (configurable)
- [ ] GC status monitored via `gc_status()['roots']` in tick callback
- [ ] Track per-request memory delta on every request. followed
- [ ] Monitor baseline trend, not instantaneous memory. followed
- [ ] Use memory_get_usage(false) for actual usage, true for OS allocation. followed
- [ ] Use structured logging over ad-hoc metrics for memory data. followed
- [ ] Inspect GC root counts as a leading leak indicator. followed
- [ ] Limit profiling tool overhead in production. followed
- [ ] Track baseline, not just current usage applied
- [ ] Log per-request memory delta applied
- [ ] Use `memory_get_usage(false)` for actual usage, `true` for OS allocation applied
- [ ] Cache static property reflection results applied
- [ ] Single-Point-in-Time Snapshots prevented
- [ ] Profiling Tool as Leak Source prevented
- [ ] Measuring only at request end prevented
- [ ] Confusing high memory with leak prevented

---

# Architecture Checklist

- [ ] `memory_get_usage()` over `xdebug_memory_usage()` architecture followed
- [ ] Real usage (`true`) for baseline architecture followed
- [ ] Structured logging over metrics architecture followed
- [ ] Telescope integration over custom tool architecture followed

---

# Implementation Checklist

- [ ] Track per-request memory delta on every request. followed
- [ ] Monitor baseline trend, not instantaneous memory. followed
- [ ] Use memory_get_usage(false) for actual usage, true for OS allocation. followed
- [ ] Use structured logging over ad-hoc metrics for memory data. followed
- [ ] Inspect GC root counts as a leading leak indicator. followed
- [ ] Track baseline, not just current usage applied
- [ ] Log per-request memory delta applied
- [ ] Use `memory_get_usage(false)` for actual usage, `true` for OS allocation applied
- [ ] Cache static property reflection results applied
- [ ] Measuring only at request end prevented
- [ ] Confusing high memory with leak prevented
- [ ] Not accounting for Zend MM internals prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Single-Point-in-Time Snapshots prevented
- [ ] Profiling Tool as Leak Source prevented
- [ ] Manual Memory Inspection in Production prevented
- [ ] Ignoring GC Statistics prevented
- [ ] Not Accounting for Zend MM Internals prevented
- [ ] Track per-request memory delta on every request. followed
- [ ] Monitor baseline trend, not instantaneous memory. followed
- [ ] Use memory_get_usage(false) for actual usage, true for OS allocation. followed
- [ ] Use structured logging over ad-hoc metrics for memory data. followed
- [ ] Inspect GC root counts as a leading leak indicator. followed
- [ ] Limit profiling tool overhead in production. followed

---

# Testing Checklist

- [ ] `memory_get_usage()` logged before and after each request with delta calculated
- [ ] Baseline trend tracker logs baseline after every N requests (configurable)
- [ ] GC status monitored via `gc_status()['roots']` in tick callback
- [ ] Grafana dashboard panels for worker memory baseline, delta, GC roots
- [ ] Log `memory_get_usage()` before and after each request â€” calculate delta
- [ ] Set up a baseline trend tracker â€” log baseline after every 100 requests
- [ ] Run GC status check: `gc_status()` â€” monitor roots count over time
- [ ] Deploy Blackfire or Telescope for continuous profiling in staging
- [ ] Per-request memory delta is logged with zero false positives from measurement methodology
- [ ] Baseline trend over 1000 requests shows stable or predictably bounded memory
- [ ] GC root count does not grow monotonically across requests
- [ ] Alert fires before workers hit memory_limit, with sufficient lead time for investigation

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Single-Point-in-Time Snapshots prevented
- [ ] Profiling Tool as Leak Source prevented
- [ ] Manual Memory Inspection in Production prevented
- [ ] Ignoring GC Statistics prevented
- [ ] Not Accounting for Zend MM Internals prevented

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

- singleton-state-leaks (the leaks to profile)
- static-property-accumulation (the main source of growth)
- octane-lifecycle-hooks (hooks for pre/post request measurement)
- octane-configuration-and-workers (max_requests as leak safety valve)
- octane-package-compatibility (profiling package memory behavior)

---


