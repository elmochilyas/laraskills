# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** standard-webhooks-spec
**Generated:** 2026-06-03

---

# Decision Inventory

1. Webhook Format Strategy (Standard vs Custom)
2. Signing Algorithm Selection (HMAC-SHA256 vs Ed25519)
3. Retry Schedule Strategy

---

# Architecture-Level Decision Trees

---

## Webhook Format Strategy

---

## Decision Context

Choosing between Standard Webhooks format and custom webhook format.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are webhooks sent to external subscribers or received from modern providers?
↓
YES → Use Standard Webhooks format for interoperability
  ↓
  Do subscribers expect custom legacy format?
  ↓
  YES → Dual-run: Standard format + legacy format during migration
  NO → Standard format is future-proof and portable
NO → Are webhooks purely internal within the same organization?
  ↓
  YES → Custom format is acceptable; Standard adds overhead without benefit
  NO → Standard Webhooks recommended for any external consumption
  ↓
  Need to migrate from legacy format?
  ↓
  YES → Parallel operation: send both formats; retire legacy when all subscribers migrate
  NO → Standard format from day one is the simplest path

---

## Rationale

Standard Webhooks specification provides interoperable format with defined signing, idempotency, and retry. For external webhooks, it eliminates custom implementation per provider.

---

## Recommended Default

**Default:** Standard Webhooks format for all outgoing webhooks
**Reason:** Interoperable; portable between gateways; supported by reference implementations

---

## Risks Of Wrong Choice

Custom format requires subscribers to implement custom verification. Non-standard format prevents easy migration to gateway services.

---

## Related Rules

Adopt Standard Webhooks for All Outgoing Webhooks

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Signing Algorithm Selection

---

## Decision Context

Choosing between symmetric (HMAC-SHA256) and asymmetric (Ed25519) signing.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the subscriber able to securely store a shared secret?
↓
YES → Use HMAC-SHA256 (simpler, faster, widely supported)
  ↓
  Need the subscriber to independently verify without sharing secret?
  ↓
  NO → HMAC-SHA256 is the standard choice
  YES → Consider Ed25519 for third-party verification scenarios
NO → Use Ed25519 asymmetric signing (subscriber only needs public key)
  ↓
  Is the subscriber a third party that shouldn't share secrets?
  ↓
  YES → Ed25519 enables subscriber-side verification without shared secret
  NO → HMAC-SHA256 is sufficient and simpler
  ↓
  Need to support key rotation without re-sharing secrets?
  ↓
  YES → Ed25519: rotate private key; subscribers keep same public key
  NO → HMAC-SHA256 supports multi-secret rotation via signature versioning

---

## Rationale

HMAC-SHA256 is the Standard Webhooks default — simple, fast, and well-supported. Ed25519 is preferred when subscribers can't securely store shared secrets or when independent verification is needed.

---

## Recommended Default

**Default:** HMAC-SHA256 symmetric signing for most cases
**Reason:** Standard Webhooks default; simpler key management; faster verification

---

## Risks Of Wrong Choice

HMAC-SHA256 requires all subscribers to securely store the shared secret. Ed25519 adds complexity for cases where HMAC would suffice.

---

## Related Rules
Use Symmetric HMAC-SHA256 for Most Cases; Ed25519 for Third-Party Verification

---

## Related Skills
Build Custom Signature Validators for Incoming Webhooks

---

## Retry Schedule Strategy

---

## Decision Context

Choosing the retry schedule for Standard Webhooks delivery.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the webhook critical (payment, account change)?
↓
YES → Use full Standard Webhooks retry schedule: 5s → 5m → 30m → 2h → 5h → 10h → 14h → 20h → 24h
  ↓
  Need to deliver within a shorter SLA?
  ↓
  YES → Shortened schedule: 5s → 30s → 2m → 5m → 15m → 30m → 1h → 2h
  NO → Standard schedule provides ~3 day total delivery window
NO → Is the webhook informational (analytics, logging)?
  ↓
  YES → Minimal schedule: 5s → 30s → 5m → 30m → 2h (5 attempts)
  NO → Standard schedule with 9 attempts covers most use cases
  ↓
  Idempotency store TTL matches retry schedule?
  ↓
  YES → TTL = max(retry window) + buffer = 24h for standard schedule
  NO → Short TTL allows duplicate processing on late retries

---

## Rationale

Standard retry schedule provides at-least-once delivery over a 3-day window. Shortened schedule matches tighter SLAs. Idempotency TTL must cover the full retry horizon.

---

## Recommended Default

**Default:** Standard 9-step retry schedule with 24h idempotency TTL
**Reason:** Maximum delivery reliability within standard retry window

---

## Risks Of Wrong Choice

Too-short retry schedule misses delivery opportunities during extended outages. Too-long schedule keeps webhooks in pending state for days. Idempotency TTL shorter than retry window allows duplicates.

---

## Related Rules
Implement Idempotency Store with 24h TTL

---

## Related Skills
Implement Exponential Backoff for Webhook Delivery Retries
