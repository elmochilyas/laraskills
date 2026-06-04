# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Broadcasting Realtime
**Knowledge Unit:** Reverb Scaling
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `numprocs` = CPU core count (no over-provisioning)
- [ ] Redis pub/sub enabled in `reverb.php` config
- [ ] Load balancer sticky sessions configured (or Redis pub/sub handles state)
- [ ] Prefer increasing Reverb process count over vertical scaling. followed
- [ ] Prefer reducing reserved list memory in reverb.php when scaling horizontally. followed
- [ ] Always enable Redis pub/sub when running multiple Reverb processes. followed
- [ ] Prefer using Redis pub/sub to avoid sticky sessions in load balancers. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer increasing Reverb process count over vertical scaling. followed
- [ ] Prefer reducing reserved list memory in reverb.php when scaling horizontally. followed
- [ ] Always enable Redis pub/sub when running multiple Reverb processes. followed
- [ ] Prefer using Redis pub/sub to avoid sticky sessions in load balancers. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer increasing Reverb process count over vertical scaling. followed
- [ ] Prefer reducing reserved list memory in reverb.php when scaling horizontally. followed
- [ ] Always enable Redis pub/sub when running multiple Reverb processes. followed
- [ ] Prefer using Redis pub/sub to avoid sticky sessions in load balancers. followed

---

# Testing Checklist

- [ ] `numprocs` = CPU core count (no over-provisioning)
- [ ] Redis pub/sub enabled in `reverb.php` config
- [ ] Load balancer sticky sessions configured (or Redis pub/sub handles state)
- [ ] Cross-process broadcast works â€” events reach all clients

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


