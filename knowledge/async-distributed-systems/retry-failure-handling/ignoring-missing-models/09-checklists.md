# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Retry Failure Handling
**Knowledge Unit:** Ignoring Missing Models
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `ShouldDeleteMissing` trait applied where model deletion is expected
- [ ] Logging in `failed()` when model is missing
- [ ] Null guards in `handle()` for re-fetched data
- [ ] Always use ShouldDeleteMissing or deleteWhenMissingModels for jobs where model deletion is expected before processing. followed
- [ ] Always log when ShouldDeleteMissing deletes a job. followed
- [ ] Always add null guards in handle() even when using ShouldDeleteMissing. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use ShouldDeleteMissing or deleteWhenMissingModels for jobs where model deletion is expected before processing. followed
- [ ] Always log when ShouldDeleteMissing deletes a job. followed
- [ ] Always add null guards in handle() even when using ShouldDeleteMissing. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always use ShouldDeleteMissing or deleteWhenMissingModels for jobs where model deletion is expected before processing. followed
- [ ] Always log when ShouldDeleteMissing deletes a job. followed
- [ ] Always add null guards in handle() even when using ShouldDeleteMissing. followed

---

# Testing Checklist

- [ ] `ShouldDeleteMissing` trait applied where model deletion is expected
- [ ] Logging in `failed()` when model is missing
- [ ] Null guards in `handle()` for re-fetched data
- [ ] `findOrFail()` not used for models that may be deleted

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


