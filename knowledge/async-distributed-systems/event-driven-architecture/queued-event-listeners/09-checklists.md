# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Event Driven Architecture
**Knowledge Unit:** Queued Event Listeners
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `ShouldQueue` implemented on listener
- [ ] `$tries` set to finite number (or `retryUntil()` defined)
- [ ] `SerializesModels` added if event has Eloquent models
- [ ] Always set $tries on queued event listeners. followed
- [ ] Always add SerializesModels to queued listeners handling events with Eloquent models. followed
- [ ] Never include non-serializable objects (closures, resources) in event properties. followed
- [ ] Always test queued listeners directly, not through Event::fake(). followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set $tries on queued event listeners. followed
- [ ] Always add SerializesModels to queued listeners handling events with Eloquent models. followed
- [ ] Never include non-serializable objects (closures, resources) in event properties. followed
- [ ] Always test queued listeners directly, not through Event::fake(). followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set $tries on queued event listeners. followed
- [ ] Always add SerializesModels to queued listeners handling events with Eloquent models. followed
- [ ] Never include non-serializable objects (closures, resources) in event properties. followed
- [ ] Always test queued listeners directly, not through Event::fake(). followed

---

# Testing Checklist

- [ ] `ShouldQueue` implemented on listener
- [ ] `$tries` set to finite number (or `retryUntil()` defined)
- [ ] `SerializesModels` added if event has Eloquent models
- [ ] Event properties serializable (no closures, resources)

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


