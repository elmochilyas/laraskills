# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Failed Jobs Storage
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `failed_jobs` table migrated and configured
- [ ] Dedicated DB connection for high-volume failures
- [ ] Pruning scheduled (7-30 day retention)
- [ ] Always prune failed jobs regularly via the scheduler. followed
- [ ] Prefer a dedicated database connection for failed jobs in high-volume systems. followed
- [ ] Always be aware that the failed_jobs payload may contain sensitive data. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always prune failed jobs regularly via the scheduler. followed
- [ ] Prefer a dedicated database connection for failed jobs in high-volume systems. followed
- [ ] Always be aware that the failed_jobs payload may contain sensitive data. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always prune failed jobs regularly via the scheduler. followed
- [ ] Prefer a dedicated database connection for failed jobs in high-volume systems. followed
- [ ] Always be aware that the failed_jobs payload may contain sensitive data. followed

---

# Testing Checklist

- [ ] `failed_jobs` table migrated and configured
- [ ] Dedicated DB connection for high-volume failures
- [ ] Pruning scheduled (7-30 day retention)
- [ ] Payload reviewed for sensitive data

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


