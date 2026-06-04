# Metadata

**Domain:** async-distributed-systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** Webhook Replay Attack Prevention
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Sender includes `Timestamp` in payload
- [ ] HMAC covers `timestamp + nonce + payload_body` (not payload alone)
- [ ] Receiver checks `|now - timestamp| < tolerance` (5 min)
- [ ] Always include a timestamp and nonce in the webhook signature payload. followed
- [ ] Always reject webhooks with timestamps older than a threshold (typically 5 minutes). followed
- [ ] Prefer implementing idempotency keys for critical webhook operations. followed
- [ ] Always use HMAC-SHA256 or stronger for webhook signatures. followed

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Always include a timestamp and nonce in the webhook signature payload. followed
- [ ] Always reject webhooks with timestamps older than a threshold (typically 5 minutes). followed
- [ ] Prefer implementing idempotency keys for critical webhook operations. followed
- [ ] Always use HMAC-SHA256 or stronger for webhook signatures. followed

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Always include a timestamp and nonce in the webhook signature payload. followed
- [ ] Always reject webhooks with timestamps older than a threshold (typically 5 minutes). followed
- [ ] Prefer implementing idempotency keys for critical webhook operations. followed
- [ ] Always use HMAC-SHA256 or stronger for webhook signatures. followed

---

# Testing Checklist

- [ ] Sender includes `Timestamp` in payload
- [ ] HMAC covers `timestamp + nonce + payload_body` (not payload alone)
- [ ] Receiver checks `|now - timestamp| < tolerance` (5 min)
- [ ] Receiver recomputes and validates HMAC

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


