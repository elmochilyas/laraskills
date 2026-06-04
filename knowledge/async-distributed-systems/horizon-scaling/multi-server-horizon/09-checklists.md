# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** Multi Server Horizon
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Same config deployed across all servers (symmetric default)
- [ ] Redis `maxclients` >= total workers + headroom across all servers
- [ ] Deployment script terminates Horizon on ALL servers sequentially
- [ ] Prefer using the same supervisor config on all servers. followed
- [ ] Always monitor the total Redis connection count from all Horizon servers. followed
- [ ] Always run horizon:terminate across ALL servers during deployments. followed
- [ ] Always expect each server's auto-balancer to operate independently. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Prefer using the same supervisor config on all servers. followed
- [ ] Always monitor the total Redis connection count from all Horizon servers. followed
- [ ] Always run horizon:terminate across ALL servers during deployments. followed
- [ ] Always expect each server's auto-balancer to operate independently. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Prefer using the same supervisor config on all servers. followed
- [ ] Always monitor the total Redis connection count from all Horizon servers. followed
- [ ] Always run horizon:terminate across ALL servers during deployments. followed
- [ ] Always expect each server's auto-balancer to operate independently. followed

---

# Testing Checklist

- [ ] Same config deployed across all servers (symmetric default)
- [ ] Redis `maxclients` >= total workers + headroom across all servers
- [ ] Deployment script terminates Horizon on ALL servers sequentially
- [ ] Auto-balancing expected per-server (not global)

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


