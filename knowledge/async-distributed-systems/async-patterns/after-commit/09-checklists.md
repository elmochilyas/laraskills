# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Async Patterns
**Knowledge Unit:** After Commit
**Generated:** 2026-06-03
**Based on:** 05-rules.md, 08-anti-patterns.md
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 06-skills.md)

---

# Quick Checklist

- [ ] Always use afterCommit when the job depends on data written in the current transaction. followed
- [ ] Prefer setting the queue connection's after_commit to true globally. followed
- [ ] Always understand that afterCommit dispatches immediately when no transaction is active. followed
- [ ] Always validate data before the transaction â€” don't validate inside the transaction with queued jobs. followed
- [ ] Dispatching Jobs Without afterCommit â€” Race Conditions on Uncommitted Data prevented
- [ ] Defaulting to afterCommit = false Globally â€” Forgotten Transactional Safety prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use afterCommit when the job depends on data written in the current transaction. followed
- [ ] Prefer setting the queue connection's after_commit to true globally. followed
- [ ] Always understand that afterCommit dispatches immediately when no transaction is active. followed
- [ ] Always validate data before the transaction â€” don't validate inside the transaction with queued jobs. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Dispatching Jobs Without afterCommit â€” Race Conditions on Uncommitted Data prevented
- [ ] Defaulting to afterCommit = false Globally â€” Forgotten Transactional Safety prevented
- [ ] Misunderstanding afterCommit Behavior Outside Transactions prevented
- [ ] Validating Data Inside the Transaction After Dispatch prevented
- [ ] Wrapping Single Queries in Transactions Just to Use afterCommit prevented
- [ ] Mixing afterCommit and Non-afterCommit Jobs in Same Transaction prevented
- [ ] Always use afterCommit when the job depends on data written in the current transaction. followed
- [ ] Prefer setting the queue connection's after_commit to true globally. followed
- [ ] Always understand that afterCommit dispatches immediately when no transaction is active. followed
- [ ] Always validate data before the transaction â€” don't validate inside the transaction with queued jobs. followed

---

# Testing Checklist

- [ ] Test coverage meets requirements

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Dispatching Jobs Without afterCommit â€” Race Conditions on Uncommitted Data prevented
- [ ] Defaulting to afterCommit = false Globally â€” Forgotten Transactional Safety prevented
- [ ] Misunderstanding afterCommit Behavior Outside Transactions prevented
- [ ] Validating Data Inside the Transaction After Dispatch prevented
- [ ] Wrapping Single Queries in Transactions Just to Use afterCommit prevented
- [ ] Mixing afterCommit and Non-afterCommit Jobs in Same Transaction prevented
- [ ] Assuming All Dispatching Needs afterCommit prevented
- [ ] Not Documenting afterCommit Decisions prevented

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


