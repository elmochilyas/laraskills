# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Observability
**Knowledge Unit:** Pulse Slow Jobs Recorder
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `SlowJobs` recorder enabled in config
- [ ] `threshold_ms` set per job-type profile
- [ ] High-frequency expected-slow jobs ignored via `ignore_after`
- [ ] Always set the slow job threshold based on job type expectations, not global defaults. followed
- [ ] Always correlate slow job detection with resource monitoring. followed
- [ ] Prefer distinguishing between consistently slow jobs and sporadic outliers. followed
- [ ] Prefer alerting on slow job percentile rather than raw count. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set the slow job threshold based on job type expectations, not global defaults. followed
- [ ] Always correlate slow job detection with resource monitoring. followed
- [ ] Prefer distinguishing between consistently slow jobs and sporadic outliers. followed
- [ ] Prefer alerting on slow job percentile rather than raw count. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set the slow job threshold based on job type expectations, not global defaults. followed
- [ ] Always correlate slow job detection with resource monitoring. followed
- [ ] Prefer distinguishing between consistently slow jobs and sporadic outliers. followed
- [ ] Prefer alerting on slow job percentile rather than raw count. followed

---

# Testing Checklist

- [ ] `SlowJobs` recorder enabled in config
- [ ] `threshold_ms` set per job-type profile
- [ ] High-frequency expected-slow jobs ignored via `ignore_after`
- [ ] Dashboard card configured and placed

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


