# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Tries Max Exceptions Retry Until
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `$tries` set explicitly on every job class
- [ ] `$maxExceptions â‰¤ $tries` (if both set)
- [ ] `retryUntil()` returns valid Carbon when used
- [ ] Always set $tries explicitly on every job class. followed
- [ ] Prefer retryUntil() over $tries for external API calls. followed
- [ ] Always keep $maxExceptions â‰¤ $tries. followed
- [ ] Never set $tries to null without defining retryUntil(). followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set $tries explicitly on every job class. followed
- [ ] Prefer retryUntil() over $tries for external API calls. followed
- [ ] Always keep $maxExceptions â‰¤ $tries. followed
- [ ] Never set $tries to null without defining retryUntil(). followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set $tries explicitly on every job class. followed
- [ ] Prefer retryUntil() over $tries for external API calls. followed
- [ ] Always keep $maxExceptions â‰¤ $tries. followed
- [ ] Never set $tries to null without defining retryUntil(). followed

---

# Testing Checklist

- [ ] `$tries` set explicitly on every job class
- [ ] `$maxExceptions â‰¤ $tries` (if both set)
- [ ] `retryUntil()` returns valid Carbon when used
- [ ] Not leaving `$tries = null` without time-based cutoff

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


