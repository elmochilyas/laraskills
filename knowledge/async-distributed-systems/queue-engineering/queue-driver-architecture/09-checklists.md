# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Queue Driver Architecture
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Driver selected based on volume, infra, and Horizon requirements
- [ ] Redis queue and cache on separate instances
- [ ] `after_commit=true` configured on connection
- [ ] Always use a separate Redis instance for queues vs. cache. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Always configure retry_after higher than the longest expected job runtime. followed
- [ ] Never use the database driver for moderate-to-high volume queues in production. followed
- [ ] Always index the jobs table when using the database driver. followed
- [ ] Never use the sync driver in production. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use a separate Redis instance for queues vs. cache. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Always configure retry_after higher than the longest expected job runtime. followed
- [ ] Never use the database driver for moderate-to-high volume queues in production. followed
- [ ] Always index the jobs table when using the database driver. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always use a separate Redis instance for queues vs. cache. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Always configure retry_after higher than the longest expected job runtime. followed
- [ ] Never use the database driver for moderate-to-high volume queues in production. followed
- [ ] Always index the jobs table when using the database driver. followed
- [ ] Never use the sync driver in production. followed

---

# Testing Checklist

- [ ] Driver selected based on volume, infra, and Horizon requirements
- [ ] Redis queue and cache on separate instances
- [ ] `after_commit=true` configured on connection
- [ ] `retry_after` > longest expected job runtime

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


