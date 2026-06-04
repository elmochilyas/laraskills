# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** webhook-verification
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Failed verification events trigger security alerting
- [ ] No sensitive data (secrets, full signatures) in verification events
- [ ] Projector tracks verification failure rates per provider
- [ ] Ensure Replay Produces Identical Results
- [ ] Include Verification Metadata, Not Secrets
- [ ] Record Verification Event Before Processing
- [ ] Trigger Security Alerting on Failed Verification
- [ ] Use Projectors for Verification Failure Monitoring
- [ ] `hash_equals()` used for constant-time comparison
- [ ] 401 returned on failure
- [ ] Multiple signatures handled for key rotation
- [ ] Compare with `hash_equals()` for timing-safe comparison
- [ ] Compute expected signature using shared secret
- [ ] Extract raw request body via `$request->getContent()`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Compare with `hash_equals()` for timing-safe comparison
- [ ] Compute expected signature using shared secret
- [ ] Extract raw request body via `$request->getContent()`
- [ ] Handle multiple signatures for key rotation
- [ ] Identify provider's signature algorithm and header location
- [ ] Return 401 on verification failure, log for monitoring
- [ ] Test with valid and forged payloads
- [ ] Validate timestamp alongside signature for replay protection
- [ ] Ensure Replay Produces Identical Results
- [ ] Include Verification Metadata, Not Secrets
- [ ] Record Verification Event Before Processing
- [ ] Trigger Security Alerting on Failed Verification

---

# Performance Checklist

- [ ] Event store queries for forensic analysis are infrequent; no production impact
- [ ] Projector updates for verification metrics run asynchronously
- [ ] Verification events add ~5ms to the verification path

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Ensure Replay Produces Identical Results

---

# Testing Checklist

- [ ] `hash_equals()` used for constant-time comparison
- [ ] 401 returned on failure
- [ ] Failed verification events trigger security alerting
- [ ] Multiple signatures handled for key rotation
- [ ] No sensitive data (secrets, full signatures) in verification events
- [ ] Projector tracks verification failure rates per provider
- [ ] Provider's signature algorithm identified and implemented
- [ ] Raw body retrieved via `getContent()` (not JSON parsed)
- [ ] Replay of verification events produces identical results
- [ ] Timestamp validated alongside signature

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Verification Returning Boolean Instead of Emitting Events]
- [ ] [Storing Secrets or Full Signatures in Verification Events]
- [ ] [Silently Skipping Verification for "Internal" Webhooks]
- [ ] [Not Recording Replay Detection Events]
- [ ] [No Verification Failure Metrics or Alerting]

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


