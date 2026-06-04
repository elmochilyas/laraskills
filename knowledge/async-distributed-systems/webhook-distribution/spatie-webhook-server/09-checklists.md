# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** Spatie Webhook Server
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Webhook profile created with event name, serializer, queue config
- [ ] Secrets stored in env vars, not hardcoded
- [ ] `retry_until` configured for delivery deadline
- [ ] Always validate the webhook signature on every incoming request. followed
- [ ] Always store webhook secrets in encrypted env vars or a secret manager. followed
- [ ] Always queue webhook processing â€” never process in the request handler. followed
- [ ] Always return HTTP 200 immediately before dispatching the queued job. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always validate the webhook signature on every incoming request. followed
- [ ] Always store webhook secrets in encrypted env vars or a secret manager. followed
- [ ] Always queue webhook processing â€” never process in the request handler. followed
- [ ] Always return HTTP 200 immediately before dispatching the queued job. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always validate the webhook signature on every incoming request. followed
- [ ] Always store webhook secrets in encrypted env vars or a secret manager. followed
- [ ] Always queue webhook processing â€” never process in the request handler. followed
- [ ] Always return HTTP 200 immediately before dispatching the queued job. followed

---

# Testing Checklist

- [ ] Webhook profile created with event name, serializer, queue config
- [ ] Secrets stored in env vars, not hardcoded
- [ ] `retry_until` configured for delivery deadline
- [ ] Queue config (connection, queue) set on profile

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


