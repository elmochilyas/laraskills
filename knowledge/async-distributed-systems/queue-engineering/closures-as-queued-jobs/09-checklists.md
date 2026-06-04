# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Closures As Queued Jobs
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No `$this` used in closure body
- [ ] No pass-by-reference in `use (&$var)`
- [ ] All classes imported explicitly inside closure
- [ ] Prefer class jobs over closures for anything complex or reusable. followed
- [ ] Never use $this inside a queued closure body. followed
- [ ] Always import classes explicitly inside queued closures. followed
- [ ] Prefer closures only for simple one-off async tasks. followed
- [ ] Never pass variables by reference in closure use (&$var). followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer class jobs over closures for anything complex or reusable. followed
- [ ] Never use $this inside a queued closure body. followed
- [ ] Always import classes explicitly inside queued closures. followed
- [ ] Prefer closures only for simple one-off async tasks. followed
- [ ] Never pass variables by reference in closure use (&$var). followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer class jobs over closures for anything complex or reusable. followed
- [ ] Never use $this inside a queued closure body. followed
- [ ] Always import classes explicitly inside queued closures. followed
- [ ] Prefer closures only for simple one-off async tasks. followed
- [ ] Never pass variables by reference in closure use (&$var). followed

---

# Testing Checklist

- [ ] No `$this` used in closure body
- [ ] No pass-by-reference in `use (&$var)`
- [ ] All classes imported explicitly inside closure
- [ ] Captured variables are serializable (no resources, no closures)

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


