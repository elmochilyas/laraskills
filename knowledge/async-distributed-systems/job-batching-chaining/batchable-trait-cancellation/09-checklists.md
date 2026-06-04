# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Job Batching Chaining
**Knowledge Unit:** Batchable Trait Cancellation
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `SkipIfBatchCancelled` middleware applied in `middleware()` method
- [ ] `return` after `bail()` calls (or use middleware)
- [ ] Mid-execution cancellation check for long jobs
- [ ] Prefer SkipIfBatchCancelled middleware over manual bail() checks. followed
- [ ] Always return immediately after calling $this->bail(). followed
- [ ] Always check cancellation mid-execution for very long batch jobs. followed
- [ ] Never assume cancellation stops already-queued jobs. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer SkipIfBatchCancelled middleware over manual bail() checks. followed
- [ ] Always return immediately after calling $this->bail(). followed
- [ ] Always check cancellation mid-execution for very long batch jobs. followed
- [ ] Never assume cancellation stops already-queued jobs. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer SkipIfBatchCancelled middleware over manual bail() checks. followed
- [ ] Always return immediately after calling $this->bail(). followed
- [ ] Always check cancellation mid-execution for very long batch jobs. followed
- [ ] Never assume cancellation stops already-queued jobs. followed

---

# Testing Checklist

- [ ] `SkipIfBatchCancelled` middleware applied in `middleware()` method
- [ ] `return` after `bail()` calls (or use middleware)
- [ ] Mid-execution cancellation check for long jobs
- [ ] `$this->batch()` guarded with null check

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


