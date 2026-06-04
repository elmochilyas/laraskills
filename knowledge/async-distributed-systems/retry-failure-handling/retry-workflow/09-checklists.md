# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Retry Workflow
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Root cause investigated before retrying
- [ ] Single test retry succeeds before retrying all
- [ ] Old failures (>7 days) pruned or skipped
- [ ] Always investigate the root cause before retrying failed jobs. followed
- [ ] Always be aware that retry does NOT reset the attempt counter. followed
- [ ] Prefer testing a single retry before retrying all failed jobs. followed
- [ ] Always consider payload age before retrying old failed jobs. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always investigate the root cause before retrying failed jobs. followed
- [ ] Always be aware that retry does NOT reset the attempt counter. followed
- [ ] Prefer testing a single retry before retrying all failed jobs. followed
- [ ] Always consider payload age before retrying old failed jobs. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always investigate the root cause before retrying failed jobs. followed
- [ ] Always be aware that retry does NOT reset the attempt counter. followed
- [ ] Prefer testing a single retry before retrying all failed jobs. followed
- [ ] Always consider payload age before retrying old failed jobs. followed

---

# Testing Checklist

- [ ] Root cause investigated before retrying
- [ ] Single test retry succeeds before retrying all
- [ ] Old failures (>7 days) pruned or skipped
- [ ] Attempt counter non-reset accounted for

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


