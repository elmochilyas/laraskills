# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** custom-signature-validator
**Generated:** 2026-06-03

---

# Decision Inventory

1. Signature Algorithm and Header Strategy
2. Key Management and Rotation Strategy
3. Validation Failure Handling Strategy

---

# Architecture-Level Decision Trees

---

## Signature Algorithm and Header Strategy

---

## Decision Context

Choosing the algorithm and header parsing approach for custom webhook signature validation.

---

## Decision Criteria

* provider requirements
* security level
* key rotation support
* compatibility

---

## Decision Tree

Does the provider specify a signature algorithm?
↓
YES → Implement provider's specified algorithm exactly
  ↓
  Algorithm is HMAC-SHA256?
  ↓
  YES → Standard HMAC-SHA256 with raw body and shared secret
  NO → HMAC-SHA512 or other variant?
    ↓
    Implement provider-specific algorithm — use Hash::mac() or hash_hmac()
    Pay attention to body encoding (raw bytes vs base64)
NO → Implementing custom signature scheme?
  ↓
  Choose algorithm:
  HMAC-SHA256 → Best balance of security and performance (~0.01ms)
  HMAC-SHA512 → More secure, slightly slower — overkill for webhooks
↓
  Header format parsing strategy?
  ↓
  Single header with all params: `X-Signature: t=123,v1=abc123`
  Multiple headers: `X-Signature-Timestamp: 123` + `X-Signature: abc123`
  Simple: `X-Signature: abc123` (no metadata in header)
  ↓
  Parse header to extract signature value, timestamp, key version
  Support multiple signature values for key rotation (v1=abc,v2=def)
↓
  Body source for signature computation?
  ↓
  Raw body → `$request->getContent()` — preserves exact byte sequence
  Parsed body re-encoded → Risky — JSON encoding may differ between systems
  Always use raw body (never $request->all())

---

## Rationale

Provider-specified algorithm must be implemented exactly — deviations cause validation failures. HMAC-SHA256 is the industry standard for webhook signatures. Raw body access via getContent() ensures byte-for-byte matching with provider's computation.

---

## Recommended Default

**Default:** HMAC-SHA256 with raw body via `$request->getContent()`, single header with `t=timestamp,v1=signature, v2=signature` format for key rotation support
**Reason:** Industry standard, fast, supports key rotation, works with most providers

---

## Risks Of Wrong Choice

Wrong algorithm causes all validations to fail silently. Using parsed body instead of raw causes intermittent validation failures due to encoding differences. No key rotation support requires secret changes to be deployed atomically.

---

## Related Rules/Skills

* 03-webhooks: incoming/verification-signatures (signature verification patterns)
* 03-webhooks: replay-attack-prevention (timestamp inclusion in signature)

---

---

## Key Management and Rotation Strategy

---

## Decision Context

Managing webhook signing secrets with support for rotation.

---

## Decision Criteria

* secret storage
* rotation frequency
* zero-downtime requirements
* compliance

---

## Decision Tree

Single provider or multiple providers with different secrets?
↓
Single → One secret per provider; configure via config/services.php
Multiple → Per-provider secret mapping; validate against correct secret
↓
  Secret storage source?
  ↓
  .env + config → Simple, but requires deploy on rotation
  Vault (HashiCorp, AWS Secrets Manager) → Rotation without deploy
    ↓
    Vault available in environment?
    ↓
    YES → Use Vault for zero-downtime secret rotation
    NO → .env + config with deploy-based rotation schedule
↓
  Key rotation strategy?
  ↓
  Dual-key mode → Support both old and new signatures during transition
  Single-key mode → Accept only current secret; rotation requires cutover
  ↓
  Dual-key implementation:
  Store secrets as array: `secrets => ['v1' => 'old_secret', 'v2' => 'new_secret']`
  Accept signature valid against any active key
  After rotation window, remove old key
↓
  Rotation schedule?
  ↓
  Regular (quarterly) → Calendar-based rotation with dual-key overlap
  Incident-driven → Rotate immediately on suspected secret compromise
  Never → Risk of long-standing secret exposure
↓
  Secret validation input format?
  ↓
  Key ID in header (`kid` or prefix) → Select correct secret
  No key ID → Try all active secrets until match (more expensive but compatible)

---

## Rationale

Per-provider secrets limit blast radius of a single secret compromise. Dual-key mode enables zero-downtime rotation by accepting both old and new signatures during transition. Key ID in header avoids brute-forcing across all active secrets.

---

## Recommended Default

**Default:** .env + config storage, dual-key rotation with key ID header, quarterly rotation schedule
**Reason:** Simple to implement, zero-downtime rotation, good security posture without Vault infrastructure

---

## Risks Of Wrong Choice

Single-key mode forces downtime during rotation. No rotation leaves secrets exposed indefinitely. Hardcoded secrets in source code are a compliance violation. No key ID requires testing all keys on every validation.

---

## Related Rules/Skills

* 03-webhooks: incoming/receiving-endpoints (secret configuration per provider)
* 03-webhooks: replay-attack-prevention (timestamp as additional security layer)

---

---

## Validation Failure Handling Strategy

---

## Decision Context

Determining behavior when webhook signature validation fails.

---

## Decision Criteria

* security posture
* debugging needs
* compliance requirements
* provider behavior

---

## Decision Tree

Is the signature missing entirely?
↓
YES → Reject with 401 — no valid signature = treat as unauthenticated
  ↓
  Log the attempt for security monitoring?
  ↓
  YES → Log: source IP, endpoint, timestamp, missing signature header
  NO → Silent rejection — no forensic trail of attack attempts
NO → Is the signature present but invalid (mismatch)?
  ↓
  YES → Return 401 immediately — do not reveal which part was invalid
    ↓
  Log validation failure details (without exposing secret)?
  ↓
  YES → Log: event ID, expected vs received (truncated), timestamp
    ↓
    Send alert on repeated failures from same source?
    ↓
    YES → Rate-limit failed validation logging to prevent log flooding
    NO → Log each failure individually (risk of log storage overflow)
  NO → Log only generic "validation failed" — no forensic detail
↓
  Expired timestamp (valid signature but outside tolerance)?
  ↓
  YES → Return 401 — expired signatures are replay attempts
    ↓
    Tolerance window exceeded by seconds vs hours?
    ↓
    Seconds (clock skew) → Accept with warning log
    >5 minutes → Likely replay attack — reject, log, alert
  NO → Standard validation success → process webhook
↓
  Deployment with rotation in progress?
  ↓
  YES → Accept both old and new secrets for transition period
  NO → Single current secret only

---

## Rationale

Immediate 401 with minimal information prevents attackers from learning validation details. Logging failures provides forensic trail for incident response. Distinguishing clock skew from replay attack prevents false positives on legitimate traffic.

---

## Recommended Default

**Default:** 401 on missing/invalid/expired signature; log source IP, event ID, timestamp with rate limiting; alert on >5 failed validations from same source in 5 minutes
**Reason:** Maximizes security while maintaining forensic visibility and preventing log abuse

---

## Risks Of Wrong Choice

Revealing validation details helps attackers craft bypass attempts. No logging makes incident investigation impossible. Silent rejection of expired timestamps allows replay window exploitation.

---

## Related Rules/Skills

* 03-webhooks: incoming/receiving-endpoints (endpoint-level security)
* 03-webhooks: replay-attack-prevention (timestamp tolerance and nonce tracking)
