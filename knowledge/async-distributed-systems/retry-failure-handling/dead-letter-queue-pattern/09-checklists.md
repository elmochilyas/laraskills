# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Dead Letter Queue Pattern
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `failed()` dispatches to dedicated DLQ queue
- [ ] Poison message detection implemented for early retry failures
- [ ] DLQ depth and age monitored with alerts
- [ ] Always implement poison message detection for jobs that fail on early retries. followed
- [ ] Always monitor dead-letter queue depth and oldest message age. followed
- [ ] Prefer implementing DLQ reprocessing with a cool-off period. followed
- [ ] Never use the failed_jobs table as a dead-letter queue. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always implement poison message detection for jobs that fail on early retries. followed
- [ ] Always monitor dead-letter queue depth and oldest message age. followed
- [ ] Prefer implementing DLQ reprocessing with a cool-off period. followed
- [ ] Never use the failed_jobs table as a dead-letter queue. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always implement poison message detection for jobs that fail on early retries. followed
- [ ] Always monitor dead-letter queue depth and oldest message age. followed
- [ ] Prefer implementing DLQ reprocessing with a cool-off period. followed
- [ ] Never use the failed_jobs table as a dead-letter queue. followed

---

# Testing Checklist

- [ ] `failed()` dispatches to dedicated DLQ queue
- [ ] Poison message detection implemented for early retry failures
- [ ] DLQ depth and age monitored with alerts
- [ ] Reprocessing has cool-off period (no immediate re-dispatch)

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


