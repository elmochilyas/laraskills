# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Pruning Failed Jobs
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `queue:prune-failed` scheduled daily
- [ ] Retention period set (7-30 days)
- [ ] Runs during low-traffic period
- [ ] Always schedule queue:prune-failed to run daily. followed
- [ ] Always run pruning during low-traffic periods. followed
- [ ] Prefer chunked pruning for very large failed_jobs tables (> 100K rows). followed
- [ ] Never prune failed jobs too aggressively (e.g., 1-hour retention). followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always schedule queue:prune-failed to run daily. followed
- [ ] Always run pruning during low-traffic periods. followed
- [ ] Prefer chunked pruning for very large failed_jobs tables (> 100K rows). followed
- [ ] Never prune failed jobs too aggressively (e.g., 1-hour retention). followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always schedule queue:prune-failed to run daily. followed
- [ ] Always run pruning during low-traffic periods. followed
- [ ] Prefer chunked pruning for very large failed_jobs tables (> 100K rows). followed
- [ ] Never prune failed jobs too aggressively (e.g., 1-hour retention). followed

---

# Testing Checklist

- [ ] `queue:prune-failed` scheduled daily
- [ ] Retention period set (7-30 days)
- [ ] Runs during low-traffic period
- [ ] Chunked delete for large tables (> 100K rows)

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


