# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Queue Priority Multiple Queues
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Priority tiers named by workload characteristic, not job class
- [ ] Worker `--queue` uses correct priority order (highest first)
- [ ] SQS: separate workers per queue URL
- [ ] Prefer defining priority based on user-facing latency sensitivity. followed
- [ ] Never use comma-separated --queue for SQS. followed
- [ ] Always use separate Horizon supervisors per priority tier. followed
- [ ] Prefer monitoring oldest-job-age per queue, not just aggregate per connection. followed
- [ ] Avoid more than 3 priority tiers. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer defining priority based on user-facing latency sensitivity. followed
- [ ] Never use comma-separated --queue for SQS. followed
- [ ] Always use separate Horizon supervisors per priority tier. followed
- [ ] Prefer monitoring oldest-job-age per queue, not just aggregate per connection. followed
- [ ] Avoid more than 3 priority tiers. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer defining priority based on user-facing latency sensitivity. followed
- [ ] Never use comma-separated --queue for SQS. followed
- [ ] Always use separate Horizon supervisors per priority tier. followed
- [ ] Prefer monitoring oldest-job-age per queue, not just aggregate per connection. followed
- [ ] Avoid more than 3 priority tiers. followed

---

# Testing Checklist

- [ ] Priority tiers named by workload characteristic, not job class
- [ ] Worker `--queue` uses correct priority order (highest first)
- [ ] SQS: separate workers per queue URL
- [ ] Horizon: separate supervisors per tier

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


