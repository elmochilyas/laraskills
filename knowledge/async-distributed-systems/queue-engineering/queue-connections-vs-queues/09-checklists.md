# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Queue Connections Vs Queues
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Queue names describe workload characteristics, not job classes
- [ ] Single connection serves all queues unless different drivers justified
- [ ] No separate connections per queue name
- [ ] Prefer defining queue topology before deploying the first job. followed
- [ ] Always name queues by workload characteristic, not job class. followed
- [ ] Never create separate connections per queue name. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Prefer one connection serving many queues. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer defining queue topology before deploying the first job. followed
- [ ] Always name queues by workload characteristic, not job class. followed
- [ ] Never create separate connections per queue name. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Prefer one connection serving many queues. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer defining queue topology before deploying the first job. followed
- [ ] Always name queues by workload characteristic, not job class. followed
- [ ] Never create separate connections per queue name. followed
- [ ] Always set after_commit to true at the connection level. followed
- [ ] Prefer one connection serving many queues. followed

---

# Testing Checklist

- [ ] Queue names describe workload characteristics, not job classes
- [ ] Single connection serves all queues unless different drivers justified
- [ ] No separate connections per queue name
- [ ] SQS: separate URLs and workers per queue

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


