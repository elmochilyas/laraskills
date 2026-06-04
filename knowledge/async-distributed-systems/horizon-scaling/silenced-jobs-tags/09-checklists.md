# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Silenced Jobs Tags
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] External alerting configured before silencing
- [ ] `Silenced` trait used (preferred) or `ShouldBeSilenced` interface
- [ ] Silenced jobs documented in runbooks
- [ ] Never silence a job without configuring external alerting for its failures. followed
- [ ] Prefer the Silenced trait over implementing ShouldBeSilenced manually. followed
- [ ] Always document silenced jobs in team runbooks. followed
- [ ] Prefer tag-based silencing for cross-cutting categories across multiple job types. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Never silence a job without configuring external alerting for its failures. followed
- [ ] Prefer the Silenced trait over implementing ShouldBeSilenced manually. followed
- [ ] Always document silenced jobs in team runbooks. followed
- [ ] Prefer tag-based silencing for cross-cutting categories across multiple job types. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Never silence a job without configuring external alerting for its failures. followed
- [ ] Prefer the Silenced trait over implementing ShouldBeSilenced manually. followed
- [ ] Always document silenced jobs in team runbooks. followed
- [ ] Prefer tag-based silencing for cross-cutting categories across multiple job types. followed

---

# Testing Checklist

- [ ] External alerting configured before silencing
- [ ] `Silenced` trait used (preferred) or `ShouldBeSilenced` interface
- [ ] Silenced jobs documented in runbooks
- [ ] Failures in silenced jobs still generate events/failed_jobs entries

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


