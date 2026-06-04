# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Simple And No Balancing Modes
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `balance: false` has explicit `processes` set
- [ ] `simple` not used for queues with very different job durations
- [ ] `simple` respects minProcesses/maxProcesses bounds
- [ ] Prefer auto with time strategy for most general-purpose workloads. followed
- [ ] Prefer balance: false for SLA-critical queues with over-provisioned processes. followed
- [ ] Avoid simple balancing when job durations vary significantly between queues. followed
- [ ] Always set explicit processes when using balance: false. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer auto with time strategy for most general-purpose workloads. followed
- [ ] Prefer balance: false for SLA-critical queues with over-provisioned processes. followed
- [ ] Avoid simple balancing when job durations vary significantly between queues. followed
- [ ] Always set explicit processes when using balance: false. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer auto with time strategy for most general-purpose workloads. followed
- [ ] Prefer balance: false for SLA-critical queues with over-provisioned processes. followed
- [ ] Avoid simple balancing when job durations vary significantly between queues. followed
- [ ] Always set explicit processes when using balance: false. followed

---

# Testing Checklist

- [ ] `balance: false` has explicit `processes` set
- [ ] `simple` not used for queues with very different job durations
- [ ] `simple` respects minProcesses/maxProcesses bounds
- [ ] `false` mode shows no scaling events under load

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


