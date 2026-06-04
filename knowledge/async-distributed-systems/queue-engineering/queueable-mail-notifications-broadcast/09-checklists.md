# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** Queueable Mail Notifications Broadcast
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `Mail::queue()` used in all production mail paths
- [ ] Multi-channel notifications separated into individual classes
- [ ] `$timeout` set on mailables (30-60s)
- [ ] Never assume multiple notification channels create multiple jobs. followed
- [ ] Always set $timeout explicitly on queueable mailables to 30-60 seconds. followed
- [ ] Prefer ShouldBroadcastNow for user-facing real-time events. followed
- [ ] Always queue mail in production environments. followed
- [ ] Prefer separating notification channels into individual jobs for independent processing. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Never assume multiple notification channels create multiple jobs. followed
- [ ] Always set $timeout explicitly on queueable mailables to 30-60 seconds. followed
- [ ] Prefer ShouldBroadcastNow for user-facing real-time events. followed
- [ ] Always queue mail in production environments. followed
- [ ] Prefer separating notification channels into individual jobs for independent processing. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Never assume multiple notification channels create multiple jobs. followed
- [ ] Always set $timeout explicitly on queueable mailables to 30-60 seconds. followed
- [ ] Prefer ShouldBroadcastNow for user-facing real-time events. followed
- [ ] Always queue mail in production environments. followed
- [ ] Prefer separating notification channels into individual jobs for independent processing. followed

---

# Testing Checklist

- [ ] `Mail::queue()` used in all production mail paths
- [ ] Multi-channel notifications separated into individual classes
- [ ] `$timeout` set on mailables (30-60s)
- [ ] `ShouldBroadcastNow` used for user-facing real-time events

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


