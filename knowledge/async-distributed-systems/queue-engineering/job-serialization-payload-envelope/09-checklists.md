# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Job Serialization Payload Envelope
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Job constructors use IDs, not full model instances
- [ ] Payload contains only necessary data fields
- [ ] No loaded relations serialized in payload
- [ ] Always pass model IDs instead of full Eloquent models to jobs. followed
- [ ] Always keep job payloads minimal â€” only pass data the job actually needs. followed
- [ ] Avoid closures for complex or reusable jobs. followed
- [ ] Never modify job properties after the constructor. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always pass model IDs instead of full Eloquent models to jobs. followed
- [ ] Always keep job payloads minimal â€” only pass data the job actually needs. followed
- [ ] Avoid closures for complex or reusable jobs. followed
- [ ] Never modify job properties after the constructor. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always pass model IDs instead of full Eloquent models to jobs. followed
- [ ] Always keep job payloads minimal â€” only pass data the job actually needs. followed
- [ ] Avoid closures for complex or reusable jobs. followed
- [ ] Never modify job properties after the constructor. followed

---

# Testing Checklist

- [ ] Job constructors use IDs, not full model instances
- [ ] Payload contains only necessary data fields
- [ ] No loaded relations serialized in payload
- [ ] Complex jobs use class jobs, not closures

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


