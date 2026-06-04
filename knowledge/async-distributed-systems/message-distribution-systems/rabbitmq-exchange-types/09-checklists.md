# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Rabbitmq Exchange Types
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Exchange type matches routing pattern (direct/fanout/topic/headers)
- [ ] `durable = true` in production
- [ ] Direct exchange used for point-to-point dispatch
- [ ] Prefer direct exchanges for point-to-point job dispatch (one publisher, one consumer). followed
- [ ] Always use fanout exchanges for broadcast events that all consumers need. followed
- [ ] Prefer topic exchanges when consumers need a subset of events based on patterns. followed
- [ ] Prefer header exchanges when routing depends on multiple attributes. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer direct exchanges for point-to-point job dispatch (one publisher, one consumer). followed
- [ ] Always use fanout exchanges for broadcast events that all consumers need. followed
- [ ] Prefer topic exchanges when consumers need a subset of events based on patterns. followed
- [ ] Prefer header exchanges when routing depends on multiple attributes. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer direct exchanges for point-to-point job dispatch (one publisher, one consumer). followed
- [ ] Always use fanout exchanges for broadcast events that all consumers need. followed
- [ ] Prefer topic exchanges when consumers need a subset of events based on patterns. followed
- [ ] Prefer header exchanges when routing depends on multiple attributes. followed

---

# Testing Checklist

- [ ] Exchange type matches routing pattern (direct/fanout/topic/headers)
- [ ] `durable = true` in production
- [ ] Direct exchange used for point-to-point dispatch
- [ ] Fanout used for broadcast (all consumers)

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


