# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Horizon Tuning Parameters
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `minProcesses >= 1` for all queues
- [ ] `maxProcesses` within memory budget (RAM / 40MB)
- [ ] `balanceMaxShift` set to 1-2
- [ ] Always set minProcesses to at least 1. followed
- [ ] Always base maxProcesses on available server RAM. followed
- [ ] Prefer detecting oscillation (sawtooth process count pattern) and tuning accordingly. followed
- [ ] Prefer setting minProcesses = maxProcesses to disable balancing for predictable workloads. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set minProcesses to at least 1. followed
- [ ] Always base maxProcesses on available server RAM. followed
- [ ] Prefer detecting oscillation (sawtooth process count pattern) and tuning accordingly. followed
- [ ] Prefer setting minProcesses = maxProcesses to disable balancing for predictable workloads. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set minProcesses to at least 1. followed
- [ ] Always base maxProcesses on available server RAM. followed
- [ ] Prefer detecting oscillation (sawtooth process count pattern) and tuning accordingly. followed
- [ ] Prefer setting minProcesses = maxProcesses to disable balancing for predictable workloads. followed

---

# Testing Checklist

- [ ] `minProcesses >= 1` for all queues
- [ ] `maxProcesses` within memory budget (RAM / 40MB)
- [ ] `balanceMaxShift` set to 1-2
- [ ] `balanceCooldown` set to 3-5

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


