# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Job Batching Chaining
**Knowledge Unit:** Batch Deployment Hazards
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Callbacks are thin â€” only dispatch a dedicated job class
- [ ] No `$this` or framework objects in `use()` clause
- [ ] Only primitive values captured (strings, ints, arrays, DTOs)
- [ ] Always use thin callbacks that only dispatch a dedicated job class. followed
- [ ] Never capture $this or framework objects in batch callback use() clauses. followed
- [ ] Prefer draining all in-flight batches before deploying critical changes. followed
- [ ] Always monitor failed_jobs for BatchCallbackJob failures after deploys. followed
- [ ] Always test callback serialization across deploys in CI. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use thin callbacks that only dispatch a dedicated job class. followed
- [ ] Never capture $this or framework objects in batch callback use() clauses. followed
- [ ] Prefer draining all in-flight batches before deploying critical changes. followed
- [ ] Always monitor failed_jobs for BatchCallbackJob failures after deploys. followed
- [ ] Always test callback serialization across deploys in CI. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always use thin callbacks that only dispatch a dedicated job class. followed
- [ ] Never capture $this or framework objects in batch callback use() clauses. followed
- [ ] Prefer draining all in-flight batches before deploying critical changes. followed
- [ ] Always monitor failed_jobs for BatchCallbackJob failures after deploys. followed
- [ ] Always test callback serialization across deploys in CI. followed

---

# Testing Checklist

- [ ] Callbacks are thin â€” only dispatch a dedicated job class
- [ ] No `$this` or framework objects in `use()` clause
- [ ] Only primitive values captured (strings, ints, arrays, DTOs)
- [ ] Post-deploy monitoring for BatchCallbackJob failures

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No anti-patterns detected

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

- Prerequisites and related topics from domain docs

---


