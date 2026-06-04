# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Broadcasting Realtime
**Knowledge Unit:** Channel Types
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Channel type matches data sensitivity (private for user data)
- [ ] Auth callbacks in `routes/channels.php`
- [ ] Presence callbacks return `['id' => ..., 'name' => ...]` not `true`
- [ ] Always use private channels for user-specific data. followed
- [ ] Always return user data array from presence channel auth callbacks, not true. followed
- [ ] Always keep channel auth callbacks fast â€” avoid database queries and slow I/O. followed
- [ ] Always register channel auth callbacks in routes/channels.php, not web.php or api.php. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always use private channels for user-specific data. followed
- [ ] Always return user data array from presence channel auth callbacks, not true. followed
- [ ] Always keep channel auth callbacks fast â€” avoid database queries and slow I/O. followed
- [ ] Always register channel auth callbacks in routes/channels.php, not web.php or api.php. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always use private channels for user-specific data. followed
- [ ] Always return user data array from presence channel auth callbacks, not true. followed
- [ ] Always keep channel auth callbacks fast â€” avoid database queries and slow I/O. followed
- [ ] Always register channel auth callbacks in routes/channels.php, not web.php or api.php. followed

---

# Testing Checklist

- [ ] Channel type matches data sensitivity (private for user data)
- [ ] Auth callbacks in `routes/channels.php`
- [ ] Presence callbacks return `['id' => ..., 'name' => ...]` not `true`
- [ ] Auth callbacks fast â€” no DB queries (cached)

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


