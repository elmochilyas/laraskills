# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Failed Method Cleanup
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `failed()` overridden on classes needing cleanup
- [ ] Body is lightweight â€” no complex I/O
- [ ] Idempotent â€” safe to call multiple times
- [ ] Always keep failed() lightweight â€” avoid complex I/O or external calls. followed
- [ ] Always make failed() idempotent â€” it may be called multiple times. followed
- [ ] Prefer Queue::failing event for global concerns; failed() for job-specific concerns. followed
- [ ] Always call parent::failed($e) when overriding failed() in subclass jobs. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always keep failed() lightweight â€” avoid complex I/O or external calls. followed
- [ ] Always make failed() idempotent â€” it may be called multiple times. followed
- [ ] Prefer Queue::failing event for global concerns; failed() for job-specific concerns. followed
- [ ] Always call parent::failed($e) when overriding failed() in subclass jobs. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always keep failed() lightweight â€” avoid complex I/O or external calls. followed
- [ ] Always make failed() idempotent â€” it may be called multiple times. followed
- [ ] Prefer Queue::failing event for global concerns; failed() for job-specific concerns. followed
- [ ] Always call parent::failed($e) when overriding failed() in subclass jobs. followed

---

# Testing Checklist

- [ ] `failed()` overridden on classes needing cleanup
- [ ] Body is lightweight â€” no complex I/O
- [ ] Idempotent â€” safe to call multiple times
- [ ] `parent::failed($e)` called in subclasses

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


