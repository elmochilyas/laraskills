# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Idempotency Patterns
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dedup check at start of `handle()` before side effects
- [ ] Dedup TTL > total retry window + 24h
- [ ] Shared cache driver (Redis/DB) used â€” not `array`
- [ ] Prefer database unique constraints over cache for financial operations. followed
- [ ] Always set dedup TTL to exceed total retry window + 24 hours. followed
- [ ] Never use array cache driver for dedup keys. followed
- [ ] Always implement idempotency for jobs with side effects. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer database unique constraints over cache for financial operations. followed
- [ ] Always set dedup TTL to exceed total retry window + 24 hours. followed
- [ ] Never use array cache driver for dedup keys. followed
- [ ] Always implement idempotency for jobs with side effects. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer database unique constraints over cache for financial operations. followed
- [ ] Always set dedup TTL to exceed total retry window + 24 hours. followed
- [ ] Never use array cache driver for dedup keys. followed
- [ ] Always implement idempotency for jobs with side effects. followed

---

# Testing Checklist

- [ ] Dedup check at start of `handle()` before side effects
- [ ] Dedup TTL > total retry window + 24h
- [ ] Shared cache driver (Redis/DB) used â€” not `array`
- [ ] Financial operations use DB unique constraints

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


