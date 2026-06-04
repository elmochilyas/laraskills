# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Should Queue Contract
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Job classes always implement `ShouldQueue`
- [ ] Sync callers use `dispatchSync()`, not interface removal
- [ ] Queued listeners use `SerializesModels` trait
- [ ] Always implement ShouldQueue on job classes â€” use dispatchSync() for sync cases instead of removing the interface. followed
- [ ] Always add the SerializesModels trait to queued event listeners. followed
- [ ] Never use Mail::send() in production. followed
- [ ] Never conditionally remove ShouldQueue to make a job synchronous. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always implement ShouldQueue on job classes â€” use dispatchSync() for sync cases instead of removing the interface. followed
- [ ] Always add the SerializesModels trait to queued event listeners. followed
- [ ] Never use Mail::send() in production. followed
- [ ] Never conditionally remove ShouldQueue to make a job synchronous. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always implement ShouldQueue on job classes â€” use dispatchSync() for sync cases instead of removing the interface. followed
- [ ] Always add the SerializesModels trait to queued event listeners. followed
- [ ] Never use Mail::send() in production. followed
- [ ] Never conditionally remove ShouldQueue to make a job synchronous. followed

---

# Testing Checklist

- [ ] Job classes always implement `ShouldQueue`
- [ ] Sync callers use `dispatchSync()`, not interface removal
- [ ] Queued listeners use `SerializesModels` trait
- [ ] `Mail::queue()` used in production (not `Mail::send()`)

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


