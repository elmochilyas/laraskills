# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Job Lifecycle State Machine
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Job state identified correctly (queued, reserved, processing, failed)
- [ ] `release()` calls include a delay (no tight retry loops)
- [ ] `delete()` and `release()` not both called in error handlers
- [ ] Always provide a delay when calling $this->release(). followed
- [ ] Never call both delete() and release() in the same error handler. followed
- [ ] Prefer draining the queue before changing $tries configuration. followed
- [ ] Always remember that failed jobs are terminal â€” they don't auto-retry. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always provide a delay when calling $this->release(). followed
- [ ] Never call both delete() and release() in the same error handler. followed
- [ ] Prefer draining the queue before changing $tries configuration. followed
- [ ] Always remember that failed jobs are terminal â€” they don't auto-retry. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always provide a delay when calling $this->release(). followed
- [ ] Never call both delete() and release() in the same error handler. followed
- [ ] Prefer draining the queue before changing $tries configuration. followed
- [ ] Always remember that failed jobs are terminal â€” they don't auto-retry. followed

---

# Testing Checklist

- [ ] Job state identified correctly (queued, reserved, processing, failed)
- [ ] `release()` calls include a delay (no tight retry loops)
- [ ] `delete()` and `release()` not both called in error handlers
- [ ] `$tries` and `$maxExceptions` correctly configured

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


