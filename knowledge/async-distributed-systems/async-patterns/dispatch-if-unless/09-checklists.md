# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Async Patterns
**Knowledge Unit:** Dispatch If Unless
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Condition evaluated at dispatch time (not inside job)
- [ ] Explicit comparison used (`=== true`) â€” no falsy edge cases
- [ ] Null return guarded when chaining
- [ ] Prefer dispatchIf over wrapping dispatch in an if statement. followed
- [ ] Avoid placing side-effect-heavy expressions in the condition parameter. followed
- [ ] Always evaluate the condition in the caller process (HTTP request), not inside the job. followed
- [ ] Prefer dispatchUnless when the condition is naturally negative. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer dispatchIf over wrapping dispatch in an if statement. followed
- [ ] Avoid placing side-effect-heavy expressions in the condition parameter. followed
- [ ] Always evaluate the condition in the caller process (HTTP request), not inside the job. followed
- [ ] Prefer dispatchUnless when the condition is naturally negative. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer dispatchIf over wrapping dispatch in an if statement. followed
- [ ] Avoid placing side-effect-heavy expressions in the condition parameter. followed
- [ ] Always evaluate the condition in the caller process (HTTP request), not inside the job. followed
- [ ] Prefer dispatchUnless when the condition is naturally negative. followed

---

# Testing Checklist

- [ ] Condition evaluated at dispatch time (not inside job)
- [ ] Explicit comparison used (`=== true`) â€” no falsy edge cases
- [ ] Null return guarded when chaining
- [ ] Dispatch skips logged for unexpected conditions

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


