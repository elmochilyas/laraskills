# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Horizon Supervisor Configuration
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] One supervisor per queue type (not one giant supervisor)
- [ ] `maxJobs` and `maxTime` set on all supervisors
- [ ] `minProcesses >= 1` for each supervisor
- [ ] Always set maxJobs and maxTime on all supervisors. followed
- [ ] Always use one supervisor per queue type. followed
- [ ] Always run horizon:terminate in deployment scripts. followed
- [ ] Prefer setting nice for CPU priority isolation. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set maxJobs and maxTime on all supervisors. followed
- [ ] Always use one supervisor per queue type. followed
- [ ] Always run horizon:terminate in deployment scripts. followed
- [ ] Prefer setting nice for CPU priority isolation. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set maxJobs and maxTime on all supervisors. followed
- [ ] Always use one supervisor per queue type. followed
- [ ] Always run horizon:terminate in deployment scripts. followed
- [ ] Prefer setting nice for CPU priority isolation. followed

---

# Testing Checklist

- [ ] One supervisor per queue type (not one giant supervisor)
- [ ] `maxJobs` and `maxTime` set on all supervisors
- [ ] `minProcesses >= 1` for each supervisor
- [ ] `maxProcesses` based on available RAM

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


