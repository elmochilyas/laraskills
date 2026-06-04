# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Failed Job Events
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Listener registered in service provider â€” not controllers/commands
- [ ] No heavy I/O in listener (or dispatched async)
- [ ] Exception filtering applied to reduce noise
- [ ] Always keep Queue::failing event listeners lightweight or dispatch them async. followed
- [ ] Always use Queue::failing for infrastructure-level monitoring, not job-specific cleanup. followed
- [ ] Never register Queue::failing listeners without cleanup in long-running workers. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always keep Queue::failing event listeners lightweight or dispatch them async. followed
- [ ] Always use Queue::failing for infrastructure-level monitoring, not job-specific cleanup. followed
- [ ] Never register Queue::failing listeners without cleanup in long-running workers. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always keep Queue::failing event listeners lightweight or dispatch them async. followed
- [ ] Always use Queue::failing for infrastructure-level monitoring, not job-specific cleanup. followed
- [ ] Never register Queue::failing listeners without cleanup in long-running workers. followed

---

# Testing Checklist

- [ ] Listener registered in service provider â€” not controllers/commands
- [ ] No heavy I/O in listener (or dispatched async)
- [ ] Exception filtering applied to reduce noise
- [ ] Not used for job-specific cleanup

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


