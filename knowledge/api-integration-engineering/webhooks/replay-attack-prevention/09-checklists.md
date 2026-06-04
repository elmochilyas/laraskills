# Metadata

**Domain:** api-integration-engineering
**Subdomain:** webhooks
**Knowledge Unit:** replay-attack-prevention
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Duplicate processing prevented (200 response both times)
- [ ] Idempotency key checked before processing
- [ ] Nonce tracking for replay within tolerance window
- [ ] Always Combine Timestamp Tolerance with Idempotency Keys
- [ ] Include Timestamp and Nonce in HMAC Signature Calculation
- [ ] Log All Replay Detection Events for Security Auditing
- [ ] Reject Expired Timestamps Before Signature Verification
- [ ] Track Nonces in Cache with TTL Matching Timestamp Window
- [ ] 200 returned for duplicates (idempotent)
- [ ] Cache used for nonce storage with appropriate TTL
- [ ] Duplicate attempts logged
- [ ] Implement nonce tracking: store nonce from header in cache, reject duplicates
- [ ] Log duplicate/replay attempts for security monitoring
- [ ] Require timestamp in webhook header: `X-Webhook-Timestamp`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Implement nonce tracking: store nonce from header in cache, reject duplicates
- [ ] Log duplicate/replay attempts for security monitoring
- [ ] Require timestamp in webhook header: `X-Webhook-Timestamp`
- [ ] Return 200 on duplicate to avoid confusion (idempotent acknowledgment)
- [ ] Use `$request->header('X-Webhook-Timestamp')` to check for replay
- [ ] Use cache with TTL equal to the timestamp window for nonce storage
- [ ] Validate timestamp is within acceptable window (e.g., 5 minutes)
- [ ] Verify signature including timestamp in HMAC computation
- [ ] Always Combine Timestamp Tolerance with Idempotency Keys
- [ ] Include Timestamp and Nonce in HMAC Signature Calculation
- [ ] Log All Replay Detection Events for Security Auditing
- [ ] Reject Expired Timestamps Before Signature Verification

---

# Performance Checklist

- [ ] Idempotency check via primary key or unique index
- [ ] No additional network calls beyond cache/DB
- [ ] Nonce cache lookup via Redis ~1ms
- [ ] Timestamp check is sub-millisecond

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Case-sensitive idempotency key comparison
- [ ] Not clearing nonces after TTL (unbounded growth)
- [ ] Not handling idempotency key collisions from different events
- [ ] Relying only on idempotency keys without timestamp tolerance
- [ ] Using too large a timestamp window (>15 minutes)
- [ ] Always Combine Timestamp Tolerance with Idempotency Keys

---

# Testing Checklist

- [ ] 200 returned for duplicates (idempotent)
- [ ] Cache used for nonce storage with appropriate TTL
- [ ] Duplicate attempts logged
- [ ] Duplicate processing prevented (200 response both times)
- [ ] Idempotency key checked before processing
- [ ] Nonce tracking for replay within tolerance window
- [ ] Nonce tracking prevents duplicate processing
- [ ] Replay attempts logged for monitoring
- [ ] Signature includes timestamp in HMAC
- [ ] Timestamp included in HMAC signature payload

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Idempotency Keys Without Timestamp Tolerance]
- [ ] [Timestamp Tolerance Without Idempotency Keys]
- [ ] [Overly Large Timestamp Window (>15 Minutes)]
- [ ] [Timestamp Check After Signature Verification]
- [ ] [Nonce Cache with No TTL (Unbounded Growth)]
- [ ] [Silent Rejection Without Logging]

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


