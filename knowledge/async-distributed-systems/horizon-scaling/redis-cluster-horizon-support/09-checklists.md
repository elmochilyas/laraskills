# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Redis Cluster Horizon Support
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Single Redis with replica preferred unless throughput exceeds 10K jobs/sec
- [ ] `queue_key_hash_tag: true` set in Horizon config
- [ ] Redis cluster nodes configured in database config
- [ ] Prefer single Redis with replica for most deployments. followed
- [ ] Always set queue_key_hash_tag: true when using Redis Cluster. followed
- [ ] Always test Redis Cluster failover behavior before deploying to production. followed
- [ ] Always avoid multi-key Redis operations across slots. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer single Redis with replica for most deployments. followed
- [ ] Always set queue_key_hash_tag: true when using Redis Cluster. followed
- [ ] Always test Redis Cluster failover behavior before deploying to production. followed
- [ ] Always avoid multi-key Redis operations across slots. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer single Redis with replica for most deployments. followed
- [ ] Always set queue_key_hash_tag: true when using Redis Cluster. followed
- [ ] Always test Redis Cluster failover behavior before deploying to production. followed
- [ ] Always avoid multi-key Redis operations across slots. followed

---

# Testing Checklist

- [ ] Single Redis with replica preferred unless throughput exceeds 10K jobs/sec
- [ ] `queue_key_hash_tag: true` set in Horizon config
- [ ] Redis cluster nodes configured in database config
- [ ] `BRPOP` tested â€” workers can pop jobs in cluster mode

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


