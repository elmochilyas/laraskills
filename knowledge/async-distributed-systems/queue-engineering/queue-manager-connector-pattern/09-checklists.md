# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Queue Manager Connector Pattern
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Custom connector returns a full Queue contract implementation
- [ ] All Queue contract methods implemented (push, pop, delete, release, size)
- [ ] Driver registered in service provider boot(), not in routes
- [ ] Always ensure custom connectors return a full Queue contract implementation. followed
- [ ] Always register custom queue drivers in a service provider's boot() method, not in routes. followed
- [ ] Prefer lazy connections in custom queue drivers â€” defer TCP/HTTP connects inside connect(), not in the constructor. followed
- [ ] Never create a new connection per queue name. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always ensure custom connectors return a full Queue contract implementation. followed
- [ ] Always register custom queue drivers in a service provider's boot() method, not in routes. followed
- [ ] Prefer lazy connections in custom queue drivers â€” defer TCP/HTTP connects inside connect(), not in the constructor. followed
- [ ] Never create a new connection per queue name. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always ensure custom connectors return a full Queue contract implementation. followed
- [ ] Always register custom queue drivers in a service provider's boot() method, not in routes. followed
- [ ] Prefer lazy connections in custom queue drivers â€” defer TCP/HTTP connects inside connect(), not in the constructor. followed
- [ ] Never create a new connection per queue name. followed

---

# Testing Checklist

- [ ] Custom connector returns a full Queue contract implementation
- [ ] All Queue contract methods implemented (push, pop, delete, release, size)
- [ ] Driver registered in service provider boot(), not in routes
- [ ] Connection configured in config/queue.php

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


