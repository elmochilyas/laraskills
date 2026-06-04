# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Serializes Models Trait
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `SerializesModels` trait present on the job/listener/mailable
- [ ] Null model guards in `handle()` method
- [ ] No loaded relations on serialized models
- [ ] Always guard against null models in your job's handle() method. followed
- [ ] Avoid passing models with loaded relations to jobs. followed
- [ ] Prefer passing model IDs instead of collections for collections > 100 items. followed
- [ ] Never modify restored models expecting the change to persist across retries. followed
- [ ] Never expect pivot attributes to persist through SerializesModels serialization. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always guard against null models in your job's handle() method. followed
- [ ] Avoid passing models with loaded relations to jobs. followed
- [ ] Prefer passing model IDs instead of collections for collections > 100 items. followed
- [ ] Never modify restored models expecting the change to persist across retries. followed
- [ ] Never expect pivot attributes to persist through SerializesModels serialization. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always guard against null models in your job's handle() method. followed
- [ ] Avoid passing models with loaded relations to jobs. followed
- [ ] Prefer passing model IDs instead of collections for collections > 100 items. followed
- [ ] Never modify restored models expecting the change to persist across retries. followed
- [ ] Never expect pivot attributes to persist through SerializesModels serialization. followed

---

# Testing Checklist

- [ ] `SerializesModels` trait present on the job/listener/mailable
- [ ] Null model guards in `handle()` method
- [ ] No loaded relations on serialized models
- [ ] Collections >100 items passed as IDs, not models

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


