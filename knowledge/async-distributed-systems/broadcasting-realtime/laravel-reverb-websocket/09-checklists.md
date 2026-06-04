# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Broadcasting Realtime
**Knowledge Unit:** Laravel Reverb Websocket
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Nginx proxy configured with `Upgrade` and `Connection` headers
- [ ] `proxy_read_timeout` set to 86400
- [ ] SSL certificate valid â€” WSS connections work
- [ ] Always set ulimit -n to at least max_connections  2 + 1000. followed
- [ ] Always run Reverb under Supervisor for process management. followed
- [ ] Always configure Redis pub/sub for multi-process Reverb deployments. followed
- [ ] Always set Nginx proxy_read_timeout to 86400 seconds for WebSocket connections. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always set ulimit -n to at least max_connections  2 + 1000. followed
- [ ] Always run Reverb under Supervisor for process management. followed
- [ ] Always configure Redis pub/sub for multi-process Reverb deployments. followed
- [ ] Always set Nginx proxy_read_timeout to 86400 seconds for WebSocket connections. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always set ulimit -n to at least max_connections  2 + 1000. followed
- [ ] Always run Reverb under Supervisor for process management. followed
- [ ] Always configure Redis pub/sub for multi-process Reverb deployments. followed
- [ ] Always set Nginx proxy_read_timeout to 86400 seconds for WebSocket connections. followed

---

# Testing Checklist

- [ ] Nginx proxy configured with `Upgrade` and `Connection` headers
- [ ] `proxy_read_timeout` set to 86400
- [ ] SSL certificate valid â€” WSS connections work
- [ ] Supervisor `minfds` set (not shell `ulimit`)

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


