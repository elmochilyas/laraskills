# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Job Batching Chaining
**Knowledge Unit:** Allow Failures Behavior
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `allowFailures()` paired with `catch()` callback
- [ ] `then()` not used to detect partial failure (mutually exclusive with catch)
- [ ] `failedJobs` checked in `finally()` if failure-aware cleanup needed
- [ ] Always pair allowFailures() with a catch() callback. followed
- [ ] Never assume allowFailures() prevents chain abort within a batch. followed
- [ ] Always check $batch->failedJobs in finally() for failure-aware decisions. followed
- [ ] Never assume then() fires when some jobs have failed. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always pair allowFailures() with a catch() callback. followed
- [ ] Never assume allowFailures() prevents chain abort within a batch. followed
- [ ] Always check $batch->failedJobs in finally() for failure-aware decisions. followed
- [ ] Never assume then() fires when some jobs have failed. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always pair allowFailures() with a catch() callback. followed
- [ ] Never assume allowFailures() prevents chain abort within a batch. followed
- [ ] Always check $batch->failedJobs in finally() for failure-aware decisions. followed
- [ ] Never assume then() fires when some jobs have failed. followed

---

# Testing Checklist

- [ ] `allowFailures()` paired with `catch()` callback
- [ ] `then()` not used to detect partial failure (mutually exclusive with catch)
- [ ] `failedJobs` checked in `finally()` if failure-aware cleanup needed
- [ ] Not assuming allowFailures prevents chain abort in batch-of-chains

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


