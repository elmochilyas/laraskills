# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Async Patterns
**Knowledge Unit:** Defer Pattern
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Total batch time < 1 second
- [ ] Callbacks idempotent
- [ ] `cancel()` called in exception/error handlers
- [ ] Prefer defer() for tasks that must run after response but don't need durability. followed
- [ ] Never use defer() for operations that must survive a PHP crash. followed
- [ ] Always keep deferred callbacks fast â€” under 1 second. followed
- [ ] Prefer defer() over dispatchAfterResponse() for new code. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer defer() for tasks that must run after response but don't need durability. followed
- [ ] Never use defer() for operations that must survive a PHP crash. followed
- [ ] Always keep deferred callbacks fast â€” under 1 second. followed
- [ ] Prefer defer() over dispatchAfterResponse() for new code. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer defer() for tasks that must run after response but don't need durability. followed
- [ ] Never use defer() for operations that must survive a PHP crash. followed
- [ ] Always keep deferred callbacks fast â€” under 1 second. followed
- [ ] Prefer defer() over dispatchAfterResponse() for new code. followed

---

# Testing Checklist

- [ ] Total batch time < 1 second
- [ ] Callbacks idempotent
- [ ] `cancel()` called in exception/error handlers
- [ ] Logging at batch start/end

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


