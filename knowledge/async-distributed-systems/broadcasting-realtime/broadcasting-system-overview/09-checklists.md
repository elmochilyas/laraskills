# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Broadcasting Realtime
**Knowledge Unit:** Broadcasting System Overview
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `ShouldBroadcast` implemented on event class
- [ ] `broadcastOn()` returns correct channel type (private for user data)
- [ ] Payload minimal â€” IDs, not full model serializations
- [ ] Always keep broadcast event payloads minimal â€” send IDs, not full models. followed
- [ ] Prefer ShouldBroadcastNow for truly time-sensitive events. followed
- [ ] Never broadcast sensitive data on public channels. followed
- [ ] Always monitor the broadcast queue backlog. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always keep broadcast event payloads minimal â€” send IDs, not full models. followed
- [ ] Prefer ShouldBroadcastNow for truly time-sensitive events. followed
- [ ] Never broadcast sensitive data on public channels. followed
- [ ] Always monitor the broadcast queue backlog. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always keep broadcast event payloads minimal â€” send IDs, not full models. followed
- [ ] Prefer ShouldBroadcastNow for truly time-sensitive events. followed
- [ ] Never broadcast sensitive data on public channels. followed
- [ ] Always monitor the broadcast queue backlog. followed

---

# Testing Checklist

- [ ] `ShouldBroadcast` implemented on event class
- [ ] `broadcastOn()` returns correct channel type (private for user data)
- [ ] Payload minimal â€” IDs, not full model serializations
- [ ] `broadcastAs()` matches Echo `listen()` event name

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


