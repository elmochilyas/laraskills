# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Job Faking Testing
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `Queue::fake()` called before action, not after
- [ ] Callback assertions used for data-specific matching
- [ ] Queue routing verified with `assertPushedOn()`
- [ ] Always call Queue::fake() before the action under test. followed
- [ ] Prefer callback assertions over class-name-only assertions for precise job matching. followed
- [ ] Never test job logic with Queue::fake() active. followed
- [ ] Always use Bus::fake() to test batches and chains. followed
- [ ] Always clean up fakes between tests in setUp() or tearDown(). followed
- [ ] Prefer assertPushedOn('queue', Job::class) over assertPushed(Job::class) when queue routing matters. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always call Queue::fake() before the action under test. followed
- [ ] Prefer callback assertions over class-name-only assertions for precise job matching. followed
- [ ] Never test job logic with Queue::fake() active. followed
- [ ] Always use Bus::fake() to test batches and chains. followed
- [ ] Always clean up fakes between tests in setUp() or tearDown(). followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always call Queue::fake() before the action under test. followed
- [ ] Prefer callback assertions over class-name-only assertions for precise job matching. followed
- [ ] Never test job logic with Queue::fake() active. followed
- [ ] Always use Bus::fake() to test batches and chains. followed
- [ ] Always clean up fakes between tests in setUp() or tearDown(). followed
- [ ] Prefer assertPushedOn('queue', Job::class) over assertPushed(Job::class) when queue routing matters. followed

---

# Testing Checklist

- [ ] `Queue::fake()` called before action, not after
- [ ] Callback assertions used for data-specific matching
- [ ] Queue routing verified with `assertPushedOn()`
- [ ] `Bus::fake()` used for batch/chain assertions

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


