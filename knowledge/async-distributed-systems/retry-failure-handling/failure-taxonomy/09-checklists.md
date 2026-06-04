# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Failure Taxonomy
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Exception types mapped to correct response
- [ ] Rate limits use `release()` not exceptions
- [ ] Permanent errors use `fail()` not exceptions
- [ ] Always map exception types to their appropriate retry behavior. followed
- [ ] Prefer $this->fail() for known unrecoverable conditions. followed
- [ ] Never throw an exception when release() is the appropriate response. followed
- [ ] Always monitor the release ratio vs success rate. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always map exception types to their appropriate retry behavior. followed
- [ ] Prefer $this->fail() for known unrecoverable conditions. followed
- [ ] Never throw an exception when release() is the appropriate response. followed
- [ ] Always monitor the release ratio vs success rate. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always map exception types to their appropriate retry behavior. followed
- [ ] Prefer $this->fail() for known unrecoverable conditions. followed
- [ ] Never throw an exception when release() is the appropriate response. followed
- [ ] Always monitor the release ratio vs success rate. followed

---

# Testing Checklist

- [ ] Exception types mapped to correct response
- [ ] Rate limits use `release()` not exceptions
- [ ] Permanent errors use `fail()` not exceptions
- [ ] Release doesn't consume retry attempts

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


