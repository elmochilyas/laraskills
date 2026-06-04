# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** custom-signature-validator
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `hash_equals()` used for comparison
- [ ] Failed validations logged for monitoring
- [ ] Key rotation supported via key ID in header
- [ ] Always Read Raw Body via getContent(), Not all()
- [ ] Compute Signature Over the Entire Raw Body, Not a Subset
- [ ] Fetch Secrets from Configuration or Vault, Never Hardcode
- [ ] Include Timestamp Check for Replay Prevention
- [ ] Log Failed Signature Attempts for Monitoring
- [ ] 401 returned on invalid signature
- [ ] Body retrieved via `$request->getContent()` (not JSON parsing)
- [ ] Constant-time comparison with `hash_equals()`
- [ ] Compare using constant-time comparison (`hash_equals()`)
- [ ] Create middleware class implementing signature validation
- [ ] Extract signature from request header

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Compare using constant-time comparison (`hash_equals()`)
- [ ] Create middleware class implementing signature validation
- [ ] Extract signature from request header
- [ ] Handle body-stream consumed by JSON middleware (use `getContent()`)
- [ ] Include timestamp validation for replay protection
- [ ] Recompute expected signature from raw request body
- [ ] Register middleware on webhook routes
- [ ] Return 401 on signature mismatch
- [ ] Always Read Raw Body via getContent(), Not all()
- [ ] Compute Signature Over the Entire Raw Body, Not a Subset
- [ ] Fetch Secrets from Configuration or Vault, Never Hardcode
- [ ] Include Timestamp Check for Replay Prevention

---

# Performance Checklist

- [ ] `hash_equals()` is constant-time but sub-millisecond
- [ ] HMAC computation is ~0.01ms
- [ ] No external calls needed for validation
- [ ] Raw body available from PHP's input stream

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Computing signature over enriched/modified body
- [ ] Hardcoding secrets in source code
- [ ] Not handling multiple signature headers during key rotation
- [ ] Using `$request->all()` which parses body (JSON encoding differs)
- [ ] Using `==` or `===` for signature comparison (timing attack)
- [ ] Always Read Raw Body via getContent(), Not all()
- [ ] Fetch Secrets from Configuration or Vault, Never Hardcode
- [ ] Include Timestamp Check for Replay Prevention

---

# Testing Checklist

- [ ] `hash_equals()` used for comparison
- [ ] 401 returned on invalid signature
- [ ] Body retrieved via `$request->getContent()` (not JSON parsing)
- [ ] Constant-time comparison with `hash_equals()`
- [ ] Custom middleware created for signature validation
- [ ] Failed validations logged for monitoring
- [ ] Key rotation supported via key ID in header
- [ ] Middleware registered on webhook routes only
- [ ] Raw body via `$request->getContent()` for signature computation
- [ ] Secret stored in config/vault, not hardcoded

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Signature Over Parsed Body (Re-encoding Mismatch)]
- [ ] [Non-Constant-Time Comparison (Timing Side-Channel)]
- [ ] [Signature Over Payload Subset (Truncation Mismatch)]
- [ ] [Single Secret Validation During Key Rotation]
- [ ] [No Timestamp Replay Protection]
- [ ] [Hardcoded Secrets in Source Code]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


