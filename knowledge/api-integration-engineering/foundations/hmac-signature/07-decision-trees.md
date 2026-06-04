# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** hmac-signature
**Generated:** 2026-06-03

---

# Decision Inventory

1. HMAC Signing Implementation Strategy
2. Replay Prevention Strategy
3. Key Rotation Strategy

---

# Architecture-Level Decision Trees

---

## HMAC Signing Implementation Strategy

---

## Decision Context

Choosing how to implement HMAC request signing for API authentication.

---

## Decision Criteria

* security
* architectural
* maintainability

---

## Decision Tree

Is the signing for outgoing requests or incoming verification?
↓
OUTGOING → Implement signing middleware in Guzzle handler stack
  ↓
  Does the API require body signing or header-based?
  ↓
  BODY → Sign canonical request (method + URI + body hash + headers)
  HEADER → Sign static header value with timestamp
INCOMING → Implement verification middleware before route handler
  ↓
  Is raw body accessible (not parsed)?
  ↓
  YES → Use $request->getContent() for signature computation
  NO → Configure middleware to run before ParseBody middleware
  ↓
Use hash_equals() for comparison?
↓
YES → Constant-time comparison implemented correctly
NO → Timing attack vulnerability — must use hash_equals()

---

## Rationale

Outgoing signing authenticates requests to upstream APIs; incoming verification authenticates webhooks. Raw body access is critical for correct verification — re-serialized JSON may differ byte-by-byte.

---

## Recommended Default

**Default:** Centralized signing/verification service with hash_equals()
**Reason:** Consistent, testable, secure across all endpoints

---

## Risks Of Wrong Choice

Verifying against re-serialized body causes signature mismatches. Loose comparison (==) enables timing attacks.

---

## Related Rules

Use hash_equals() for all signature comparisons, Sign the full request body

---

## Related Skills

Implement HMAC Request Signing

---

## Replay Prevention Strategy

---

## Decision Context

Preventing intercepted signed requests from being replayed.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Is the channel HTTPS/TLS?
↓
YES → Replay risk reduced but still present at application level
  ↓
  Include timestamp in signed payload?
  ↓
  YES → Set tolerance window (default ±300s)
    ↓
    Implement nonce tracking?
    ↓
    YES → Check nonce in Redis cache with TTL = tolerance window
    NO → Timestamp-only protection; window-bound replay possible
  NO → No replay protection — attacker can replay indefinitely
NO → Must implement both timestamp + nonce + idempotency key

---

## Rationale

Timestamps bound the replay window. Nonces prevent replay within that window. TLS reduces interception risk but doesn't eliminate it — especially in multi-hop architectures.

---

## Recommended Default

**Default:** Timestamp (±300s) + nonce in Redis with 300s TTL
**Reason:** Pragmatic protection that prevents windowed replay without permanent storage

---

## Risks Of Wrong Choice

No timestamp means unbounded replay. No nonce means windowed replay is possible. Window too tight causes clock skew failures.

---

## Related Rules

Include timestamp in signature, Implement replay protection

---

## Related Skills

Implement HMAC Request Signing

---

## Key Rotation Strategy

---

## Decision Context

Rotating HMAC signing keys without disrupting in-flight requests.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are multiple keys supported simultaneously?
↓
YES → Use key ID prefix in signature header for key selection
  ↓
  Is there a grace period for key deactivation?
  ↓
  YES → Keep old key for verification during overlap window
  NO → Immediate switch risks rejecting in-flight signed requests
NO → Implement key rotation with versioned keys immediately
  ↓
  Are keys stored in a vault/secret manager?
  ↓
  YES → Automated rotation via vault API
  NO → Move keys to vault first; rotation without vault is manual

---

## Rationale

Multi-key support enables zero-downtime rotation: new key for signing, old key still accepted for verification during overlap. Key ID headers allow receivers to select the correct verification key.

---

## Recommended Default

**Default:** Versioned keys in vault with 24h grace overlap
**Reason:** Zero-downtime rotation with automated secret management

---

## Risks Of Wrong Choice

Single key rotation causes verification failures during key switch. No grace period breaks in-flight requests. Keys in source code are a security breach waiting to happen.

---

## Related Rules

Support key rotation via key ID prefix, Store secrets in vault

---

## Related Skills

Implement HMAC Request Signing
