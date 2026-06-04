# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Observability
**Knowledge Unit:** Custom Pulse Recorders
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Recorder class implements `Recorder` with `register()`, `record()`, `get()`
- [ ] `record()` under 10ms
- [ ] `remember()` stores at correct aggregation bucket
- [ ] Prefer creating simple Pulse recorders for custom queue metrics. followed
- [ ] Always keep the record() method fast â€” under 10ms. followed
- [ ] Always name Pulse recorder keys descriptively. followed
- [ ] Prefer recording on a sampling basis for high-frequency metrics. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer creating simple Pulse recorders for custom queue metrics. followed
- [ ] Always keep the record() method fast â€” under 10ms. followed
- [ ] Always name Pulse recorder keys descriptively. followed
- [ ] Prefer recording on a sampling basis for high-frequency metrics. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer creating simple Pulse recorders for custom queue metrics. followed
- [ ] Always keep the record() method fast â€” under 10ms. followed
- [ ] Always name Pulse recorder keys descriptively. followed
- [ ] Prefer recording on a sampling basis for high-frequency metrics. followed

---

# Testing Checklist

- [ ] Recorder class implements `Recorder` with `register()`, `record()`, `get()`
- [ ] `record()` under 10ms
- [ ] `remember()` stores at correct aggregation bucket
- [ ] Livewire component registered for dashboard

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


