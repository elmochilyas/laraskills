# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Async Patterns
**Knowledge Unit:** After Commit Transactional Safety
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Global `queue.after_commit` set to `true`
- [ ] `->afterCommit(false)` used explicitly for non-transactional dispatches
- [ ] Rollback discards deferred jobs (verified in tests)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist


---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist


---

# Testing Checklist

- [ ] Global `queue.after_commit` set to `true`
- [ ] `->afterCommit(false)` used explicitly for non-transactional dispatches
- [ ] Rollback discards deferred jobs (verified in tests)
- [ ] Nested transactions wait for outermost commit (tested)

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


