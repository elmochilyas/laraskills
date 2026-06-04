# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Backoff Strategies
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `$backoff` set on every job with `$tries > 1`
- [ ] Array length equals `$tries - 1`
- [ ] First element > 0
- [ ] Always set an explicit $backoff value on every job class. followed
- [ ] Prefer exponential backoff with jitter for all external API calls. followed
- [ ] Always match $backoff array length to $tries - 1. followed
- [ ] Always log the backoff value on each job retry. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set an explicit $backoff value on every job class. followed
- [ ] Prefer exponential backoff with jitter for all external API calls. followed
- [ ] Always match $backoff array length to $tries - 1. followed
- [ ] Always log the backoff value on each job retry. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set an explicit $backoff value on every job class. followed
- [ ] Prefer exponential backoff with jitter for all external API calls. followed
- [ ] Always match $backoff array length to $tries - 1. followed
- [ ] Always log the backoff value on each job retry. followed

---

# Testing Checklist

- [ ] `$backoff` set on every job with `$tries > 1`
- [ ] Array length equals `$tries - 1`
- [ ] First element > 0
- [ ] Gradual doubling used (not steep jumps)

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


