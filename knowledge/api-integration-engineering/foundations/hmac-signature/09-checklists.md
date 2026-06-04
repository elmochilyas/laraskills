# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** hmac-signature
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `hash_equals()` used for all signature comparisons
- [ ] Key rotation implemented with grace period
- [ ] Replay window configured (default 300s)
- [ ] Always Use hash_equals() for Comparison
- [ ] Centralize Signing in a Dedicated Service
- [ ] Include Timestamp in Signature for Replay Protection
- [ ] Sign Full Request Body, Not Selected Fields
- [ ] Support Key Rotation with Key ID Prefix
- [ ] Auth failures logged for security monitoring
- [ ] Canonical request format documented and versioned
- [ ] Nonce tracking prevents replay attacks
- [ ] Build canonical request: method + path + body + timestamp + nonce
- [ ] Compute HMAC: `hash_hmac('sha256', $canonicalString, $secret)`
- [ ] Define HMAC signing scheme: algorithm, signature location (header), payload format

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Build canonical request: method + path + body + timestamp + nonce
- [ ] Compute HMAC: `hash_hmac('sha256', $canonicalString, $secret)`
- [ ] Define HMAC signing scheme: algorithm, signature location (header), payload format
- [ ] Implement nonce tracking for replay prevention
- [ ] Include timestamp in header for replay protection
- [ ] Log authentication failures for security monitoring
- [ ] On server: recompute HMAC from received request and compare
- [ ] Send signature in header: `X-Signature: {hmac}`
- [ ] Validate timestamp is within acceptable window (5 minutes)
- [ ] Always Use hash_equals() for Comparison
- [ ] Centralize Signing in a Dedicated Service
- [ ] Include Timestamp in Signature for Replay Protection

---

# Performance Checklist

- [ ] `hash_equals()` is constant-time but still sub-millisecond
- [ ] HMAC computation is negligible (~0.01ms) relative to HTTP round-trip
- [ ] No external network calls needed for verification
- [ ] Payload body reading for signing requires full buffer in memory

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not including timestamp in signature (replay attacks)
- [ ] Rotating keys without grace period for in-flight requests (verification failures)
- [ ] Signing selected parameters instead of complete body (parameter injection)
- [ ] Signing serialized form data instead of canonical representation
- [ ] Using loose comparison (`==`) for signature verification (timing attack)
- [ ] Always Use hash_equals() for Comparison

---

# Testing Checklist

- [ ] `hash_equals()` used for all signature comparisons
- [ ] Auth failures logged for security monitoring
- [ ] Canonical request format documented and versioned
- [ ] Key rotation implemented with grace period
- [ ] Nonce tracking prevents replay attacks
- [ ] Replay window configured (default 300s)
- [ ] Secrets stored in vault, never in source code
- [ ] Shared secret stored securely (not in version control)
- [ ] Signature comparison uses constant-time comparison
- [ ] Signature includes full request body

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Signing Selected Fields Instead of Full Request Body]
- [ ] [Loose Comparison (==/===) for Signature Verification]
- [ ] [Missing Timestamp in Signature (No Replay Protection)]
- [ ] [Key Rotation Without Grace Period for In-Flight Requests]
- [ ] [Ad-Hoc Signing Logic Duplicated Across Endpoints]

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


