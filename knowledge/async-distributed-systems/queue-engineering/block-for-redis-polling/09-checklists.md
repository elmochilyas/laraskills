# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Block For Redis Polling
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `block_for` configured in queue.php Redis connection
- [ ] `block_for` value appropriately chosen (5-10 for low volume)
- [ ] `--sleep=0` set on worker (redundant with block_for)
- [ ] Prefer block_for=5-10 for low-volume queues. followed
- [ ] Always set block_for to null when using Redis Cluster. followed
- [ ] Never set block_for > 10 when using the Predis driver. followed
- [ ] Always account for blocking connections in Redis connection pool sizing. followed
- [ ] Prefer removing --sleep when block_for is set. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer block_for=5-10 for low-volume queues. followed
- [ ] Always set block_for to null when using Redis Cluster. followed
- [ ] Never set block_for > 10 when using the Predis driver. followed
- [ ] Always account for blocking connections in Redis connection pool sizing. followed
- [ ] Prefer removing --sleep when block_for is set. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer block_for=5-10 for low-volume queues. followed
- [ ] Always set block_for to null when using Redis Cluster. followed
- [ ] Never set block_for > 10 when using the Predis driver. followed
- [ ] Always account for blocking connections in Redis connection pool sizing. followed
- [ ] Prefer removing --sleep when block_for is set. followed

---

# Testing Checklist

- [ ] `block_for` configured in queue.php Redis connection
- [ ] `block_for` value appropriately chosen (5-10 for low volume)
- [ ] `--sleep=0` set on worker (redundant with block_for)
- [ ] phpredis pool size >= worker count

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


