# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** replay-attack-prevention
**Generated:** 2026-06-03

---

# Decision Inventory

1. Replay Prevention Mechanism (Timestamp vs Nonce vs Both)
2. Timestamp Tolerance Configuration
3. Nonce Storage Strategy

---

# Architecture-Level Decision Trees

---

## Replay Prevention Mechanism

---

## Decision Context

Choosing the appropriate combination of replay prevention mechanisms.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Does the webhook trigger financial or state-mutating operations?
↓
YES → Implement both timestamp validation AND nonce deduplication
  ↓
  Does the provider include a unique event ID in the payload?
  ↓
  YES → Use provider event ID as nonce; scoped by provider name
  NO → Generate nonce from signature header; risk of collision
NO → Is the webhook read-only or informational?
  ↓
  YES → Signature-only validation is sufficient; replay has no side effects
  NO → Both mechanisms needed for defense in depth
  ↓
  Is the application behind a trusted network (VPN)?
  ↓
  YES → Nonce-only may be sufficient within trusted boundaries
  NO → Both timestamp and nonce required for internet-facing endpoints

---

## Rationale

Timestamp validation rejects old requests cheaply but allows replay within the tolerance window. Nonce deduplication prevents replay within the window but requires storage. Together they provide complete replay protection.

---

## Recommended Default

**Default:** Timestamp validation (5min window) + Redis-backed nonce (24h TTL)
**Reason:** Defense in depth; cheap timestamp check filters most replays; nonce catches windowed attacks

---

## Risks Of Wrong Choice

Timestamp-only allows replay within the tolerance window (e.g., same webhook replayed 4 times within 5 minutes). Nonce-only is bypassed if the nonce store is unavailable or if the attacker sends the replay before the original is stored.

---

## Related Rules

Combine Timestamp + Nonce for Defense in Depth, Validate Timestamp Before Nonce and Signature

---

## Related Skills

Prevent Incoming Webhook Replay Attacks

---

## Timestamp Tolerance Configuration

---

## Decision Context

Setting the acceptable time window for webhook timestamp validation.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are the application servers and provider servers NTP-synchronized?
↓
YES → Set tolerance to 5 minutes (standard industry default)
  ↓
  Does the provider recommend a specific tolerance?
  ↓
  YES → Use provider's recommended tolerance when documented
  NO → 5 minutes is safe for NTP-synchronized systems
NO → Is clock skew a known issue between systems?
  ↓
  YES → Increase tolerance to 15 minutes; investigate NTP sync
  NO → Start with 5 minutes; monitor for false rejections
  ↓
  Need tighter security for sensitive operations?
  ↓
  YES → Reduce tolerance to 1 minute with strict NTP requirements
  NO → Standard 5-minute tolerance balances security and reliability

---

## Rationale

5-minute tolerance is the industry standard used by Stripe, GitHub, and Standard Webhooks. It's long enough to accommodate NTP clock skew and network delay, short enough to limit the replay window.

---

## Recommended Default

**Default:** 5-minute timestamp tolerance
**Reason:** Industry standard; accommodates NTP skew; limits replay window

---

## Risks Of Wrong Choice

Too short tolerance causes false rejections from clock skew (minutes of NTP drift are common). Too long tolerance expands the replay attack window unnecessarily.

---

## Related Rules

Validate Timestamp Before Nonce and Signature

---

## Related Skills

Prevent Incoming Webhook Replay Attacks

---

## Nonce Storage Strategy

---

## Decision Context

Choosing where and how to store nonces for deduplication.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is Redis available in the production environment?
↓
YES → Use Redis for nonce store with TTL (automatic expiry)
  ↓
  Need nonce durability across Redis restarts?
  ↓
  YES → Add database unique constraint as durability fallback
  NO → Redis-only is sufficient; loss of nonces causes temporary vulnerability only
NO → Use database table with scheduled cleanup job
  ↓
  Is the database table expected to grow large (>1M rows)?
  ↓
  YES → Partition by provider; index by (provider, webhook_id); monthly cleanup
  NO → Simple table with unique constraint and daily cleanup is sufficient
  ↓
  Need to scope nonces by provider?
  ↓
  YES -> Cache key: webhook:{provider}:{event_id}
  NO -> Nonce collisions possible across providers; always scope

---

## Rationale

Redis provides O(1) nonce check with automatic TTL expiry, making it ideal for high-throughput deduplication. Database unique constraints provide durability guarantees but require explicit cleanup.

---

## Recommended Default

**Default:** Redis-backed nonce store with 24h TTL + database unique constraint for durability
**Reason:** Performance of Redis; durability of database; defense in depth

---

## Risks Of Wrong Choice

Redis-only nonce store loses deduplication state on restart, allowing replays until new state accumulates. Database-only nonce store requires cleanup jobs and is slower for high-throughput scenarios.

---

## Related Rules

Use Redis-Backed Nonce Store with TTL, Scope Nonces by Provider

---

## Related Skills

Prevent Incoming Webhook Replay Attacks
