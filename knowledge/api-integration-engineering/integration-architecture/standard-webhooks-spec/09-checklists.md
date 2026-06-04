# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** standard-webhooks-spec
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] 5-minute timestamp tolerance configured
- [ ] Idempotency store with 24h TTL implemented
- [ ] Migration plan from legacy format documented
- [ ] Implement 24h Idempotency Store TTL
- [ ] Set 5-Minute Timestamp Tolerance for Replay Protection
- [ ] Support Multiple Signature Versions for Key Rotation
- [ ] Use Constant-Time Comparison for Signature Verification
- [ ] Use Standard Webhooks for All Outgoing Webhooks
- [ ] `X-Webhook-Id` included for idempotency
- [ ] `X-Webhook-Timestamp` included for replay protection
- [ ] Libraries/SDKs used for spec compliance where available
- [ ] Follow Standard Webhooks spec for payload format
- [ ] Generate and verify `v1` scheme signatures
- [ ] Handle webhook lifecycle: retry, idempotency, expiration

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Follow Standard Webhooks spec for payload format
- [ ] Generate and verify `v1` scheme signatures
- [ ] Handle webhook lifecycle: retry, idempotency, expiration
- [ ] Implement signature generation: HMAC-SHA256 with `X-Webhook-Signature`
- [ ] Implement spec-compliant verification on receiver
- [ ] Include `X-Webhook-Id` for idempotency and deduplication
- [ ] Include `X-Webhook-Timestamp` for replay protection
- [ ] Use existing SDKs or libraries for spec compliance
- [ ] Implement 24h Idempotency Store TTL
- [ ] Set 5-Minute Timestamp Tolerance for Replay Protection
- [ ] Support Multiple Signature Versions for Key Rotation
- [ ] Use Constant-Time Comparison for Signature Verification

---

# Performance Checklist

- [ ] Ed25519 signing: ~2ms (negligible)
- [ ] HMAC-SHA256 signing: <1ms per webhook
- [ ] Idempotency store lookup (Redis): ~5ms
- [ ] Verification using constant-time comparison: ~1ms

---

# Security Checklist

- [ ] Constant-time comparison (`hash_equals`) mandatory for verification
- [ ] Store secrets with `whsec_`/`whsk_` prefix for scheme identification
- [ ] Support multiple signatures for zero-downtime key rotation
- [ ] Timestamp tolerance: too tight causes clock skew issues; too loose weakens replay protection
- [ ] Verify against exact raw payload, not re-serialized JSON

---

# Reliability Checklist

- [ ] Custom verification instead of reference libraries (subtle bugs)
- [ ] Not handling key rotation (single signature instead of list)
- [ ] Not using constant-time comparison (timing attack vulnerability)
- [ ] Timestamp tolerance too tight (<60s) or too loose (>600s)
- [ ] Verifying re-serialized JSON instead of exact payload received

---

# Testing Checklist

- [ ] `X-Webhook-Id` included for idempotency
- [ ] `X-Webhook-Timestamp` included for replay protection
- [ ] 5-minute timestamp tolerance configured
- [ ] Idempotency store with 24h TTL implemented
- [ ] Libraries/SDKs used for spec compliance where available
- [ ] Migration plan from legacy format documented
- [ ] Multi-signature header parsing for key rotation
- [ ] Outgoing webhooks signed with Standard Webhooks format
- [ ] Payload format follows Standard Webhooks spec
- [ ] Reference verification library used for incoming

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Custom Verification Implementation Instead of Reference Libraries]
- [ ] [Verification Against Re-Serialized JSON Instead of Raw Payload]
- [ ] [Single Secret Per Subscriber Without Rotation Support]
- [ ] [Timestamp Tolerance Too Tight or Too Loose]
- [ ] [No Idempotency Store for Duplicate Detection]

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


