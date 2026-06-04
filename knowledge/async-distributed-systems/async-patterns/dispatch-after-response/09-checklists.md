# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Async Patterns
**Knowledge Unit:** Dispatch After Response
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Job does NOT implement `ShouldQueue`
- [ ] Execution time < 1 second
- [ ] Timeout guards inside the job
- [ ] Prefer dispatchAfterResponse for non-critical tasks that should not delay the HTTP response. followed
- [ ] Never use dispatchAfterResponse for work that must survive a PHP crash. followed
- [ ] Prefer dispatchAfterResponse for side effects that the user needs to see happen immediately. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer dispatchAfterResponse for non-critical tasks that should not delay the HTTP response. followed
- [ ] Never use dispatchAfterResponse for work that must survive a PHP crash. followed
- [ ] Prefer dispatchAfterResponse for side effects that the user needs to see happen immediately. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer dispatchAfterResponse for non-critical tasks that should not delay the HTTP response. followed
- [ ] Never use dispatchAfterResponse for work that must survive a PHP crash. followed
- [ ] Prefer dispatchAfterResponse for side effects that the user needs to see happen immediately. followed

---

# Testing Checklist

- [ ] Job does NOT implement `ShouldQueue`
- [ ] Execution time < 1 second
- [ ] Timeout guards inside the job
- [ ] Logging at start and end

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


