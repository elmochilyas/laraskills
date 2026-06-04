# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Job Batching Chaining
**Knowledge Unit:** Bus Chain Sequential Jobs
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Each chain job is idempotent
- [ ] `catch()` callback provides compensatory action (not just logging)
- [ ] Per-job `$timeout` set explicitly
- [ ] Always make each job in a chain idempotent. followed
- [ ] Always set $timeout explicitly on each job in a chain. followed
- [ ] Always use catch() for compensatory actions, not just logging. followed
- [ ] Prefer keeping chain length under 5 jobs. followed
- [ ] Never use Bus::chain for work that can run in parallel. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always make each job in a chain idempotent. followed
- [ ] Always set $timeout explicitly on each job in a chain. followed
- [ ] Always use catch() for compensatory actions, not just logging. followed
- [ ] Prefer keeping chain length under 5 jobs. followed
- [ ] Never use Bus::chain for work that can run in parallel. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always make each job in a chain idempotent. followed
- [ ] Always set $timeout explicitly on each job in a chain. followed
- [ ] Always use catch() for compensatory actions, not just logging. followed
- [ ] Prefer keeping chain length under 5 jobs. followed
- [ ] Never use Bus::chain for work that can run in parallel. followed

---

# Testing Checklist

- [ ] Each chain job is idempotent
- [ ] `catch()` callback provides compensatory action (not just logging)
- [ ] Per-job `$timeout` set explicitly
- [ ] Chain length under 5 jobs

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


