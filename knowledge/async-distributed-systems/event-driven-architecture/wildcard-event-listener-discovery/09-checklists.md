# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Event Driven Architecture
**Knowledge Unit:** Wildcard Event Listener Discovery
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Wildcard used for infrastructure only (logging, metrics, auditing)
- [ ] Handler fast and exception-safe â€” no external calls, no uncaught exceptions
- [ ] No event mutation in wildcard handler
- [ ] Always use wildcard listeners for infrastructure concerns only â€” never for business logic. followed
- [ ] Always keep wildcard listeners fast and exception-safe. followed
- [ ] Never use handle( $event) for business logic. followed
- [ ] Never mutate event state in wildcard listeners. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use wildcard listeners for infrastructure concerns only â€” never for business logic. followed
- [ ] Always keep wildcard listeners fast and exception-safe. followed
- [ ] Never use handle( $event) for business logic. followed
- [ ] Never mutate event state in wildcard listeners. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always use wildcard listeners for infrastructure concerns only â€” never for business logic. followed
- [ ] Always keep wildcard listeners fast and exception-safe. followed
- [ ] Never use handle( $event) for business logic. followed
- [ ] Never mutate event state in wildcard listeners. followed

---

# Testing Checklist

- [ ] Wildcard used for infrastructure only (logging, metrics, auditing)
- [ ] Handler fast and exception-safe â€” no external calls, no uncaught exceptions
- [ ] No event mutation in wildcard handler
- [ ] No event dispatch from wildcard handler (infinite loop check)

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


