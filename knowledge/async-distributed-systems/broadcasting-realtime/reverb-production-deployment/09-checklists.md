# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Broadcasting Realtime
**Knowledge Unit:** Reverb Production Deployment
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Nginx WebSocket proxy configured with Upgrade headers
- [ ] `proxy_read_timeout` = 86400
- [ ] SSL valid â€” WSS connections succeed
- [ ] Always proxy Reverb through Nginx â€” never expose it directly. followed
- [ ] Never perform blocking I/O in Reverb event handlers. followed
- [ ] Always set file descriptor limits via Supervisor's minfds setting, not shell ulimit. followed
- [ ] Always monitor Reverb RSS memory â€” it should stabilize, not grow. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always proxy Reverb through Nginx â€” never expose it directly. followed
- [ ] Never perform blocking I/O in Reverb event handlers. followed
- [ ] Always set file descriptor limits via Supervisor's minfds setting, not shell ulimit. followed
- [ ] Always monitor Reverb RSS memory â€” it should stabilize, not grow. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always proxy Reverb through Nginx â€” never expose it directly. followed
- [ ] Never perform blocking I/O in Reverb event handlers. followed
- [ ] Always set file descriptor limits via Supervisor's minfds setting, not shell ulimit. followed
- [ ] Always monitor Reverb RSS memory â€” it should stabilize, not grow. followed

---

# Testing Checklist

- [ ] Nginx WebSocket proxy configured with Upgrade headers
- [ ] `proxy_read_timeout` = 86400
- [ ] SSL valid â€” WSS connections succeed
- [ ] Supervisor managing Reverb with `autorestart=true`

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


