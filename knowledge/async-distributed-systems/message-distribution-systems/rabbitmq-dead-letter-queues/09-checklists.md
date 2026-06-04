# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Rabbitmq Dead Letter Queues
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] DLX configured on production queues via `x-dead-letter-exchange`
- [ ] `x-delivery-limit` set (prevents infinite delivery loops)
- [ ] `x-max-length` and `x-overflow` configured (backpressure)
- [ ] Always configure a Dead Letter Exchange (DLX) for production queues. followed
- [ ] Always set x-max-length and x-overflow: reject-publish on queues. followed
- [ ] Always bind a consumer to the dead-letter queue for alerting and manual replay. followed
- [ ] Prefer separate DLX routing keys for retryable vs. fatal errors. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always configure a Dead Letter Exchange (DLX) for production queues. followed
- [ ] Always set x-max-length and x-overflow: reject-publish on queues. followed
- [ ] Always bind a consumer to the dead-letter queue for alerting and manual replay. followed
- [ ] Prefer separate DLX routing keys for retryable vs. fatal errors. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always configure a Dead Letter Exchange (DLX) for production queues. followed
- [ ] Always set x-max-length and x-overflow: reject-publish on queues. followed
- [ ] Always bind a consumer to the dead-letter queue for alerting and manual replay. followed
- [ ] Prefer separate DLX routing keys for retryable vs. fatal errors. followed

---

# Testing Checklist

- [ ] DLX configured on production queues via `x-dead-letter-exchange`
- [ ] `x-delivery-limit` set (prevents infinite delivery loops)
- [ ] `x-max-length` and `x-overflow` configured (backpressure)
- [ ] DLQ queue bound to DLX (consumer attached)

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


