# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Redis Streams Queue Backend
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Consumer group created before workers start
- [ ] `XACK` called after each successful message processing
- [ ] Stream trimmed with `MAXLENGTH ~ N` (N appropriate for memory budget)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist


---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist


---

# Testing Checklist

- [ ] Consumer group created before workers start
- [ ] `XACK` called after each successful message processing
- [ ] Stream trimmed with `MAXLENGTH ~ N` (N appropriate for memory budget)
- [ ] Dead consumer detection running (XCLAIM from idle consumers)

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


