# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Signed Request Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* HMAC vs bearer token for M2M authentication
* Timestamp window size for replay protection
* Nonce storage strategy (Redis vs database)

---

# Architecture-Level Decision Trees

---

## HMAC vs Bearer Token for M2M Authentication

---

## Decision Context

Should M2M communication use HMAC-signed requests or bearer tokens (API keys/Sanctum)? Arises when designing service-to-service authentication.

---

## Decision Criteria

* integrity — HMAC verifies request body hasn't been modified
* replay protection — HMAC with nonce + timestamp prevents replay; bearer tokens do not
* implementation complexity — HMAC requires signing logic on both sides
* client compatibility — bearer tokens are simpler for clients

---

## Decision Tree

Does the M2M communication need request integrity (body cannot be modified in transit)?
↓
YES → Use HMAC signed request pattern
NO → Is replay protection needed beyond TLS?
    YES → Use HMAC signed request pattern (nonce + timestamp)
    NO → Use bearer tokens (API keys or Sanctum) — simpler

---

## Rationale

Bearer tokens authenticate the caller but do not verify request integrity or prevent replay. HMAC-signed requests authenticate AND verify integrity AND prevent replay (via nonce + timestamp). However, HMAC requires shared secrets and signing logic on both sides, increasing complexity.

---

## Recommended Default

**Default:** Bearer tokens (API keys) for internal M2M; HMAC for webhooks and external integrations
**Reason:** Internal M2M over TLS with trusted networks rarely needs integrity/replay protection. Webhooks pass through untrusted networks and need HMAC verification.

---

## Risks Of Wrong Choice

Bearer tokens for webhooks: Stripe/GitHub payloads cannot be verified for authenticity, leading to processing fake events. HMAC for all internal M2M: unnecessary complexity, key distribution overhead.

---

## Related Rules

- Always Use hash_equals() for Signature Comparison (from 05-rules.md)

---

## Related Skills

- Implement Signed Request Pattern (from 06-skills.md)

---

## Timestamp Window Size for Replay Protection

---

## Decision Context

What timestamp tolerance window should be allowed for signed requests? Arises when configuring signed request validation middleware.

---

## Decision Criteria

* security — smaller window reduces replay attack opportunity
* reliability — larger window accommodates clock skew and network delays
* client types — mobile vs server-side clock accuracy
* delivery guarantees — async delivery may have unpredictable delays

---

## Decision Tree

Is the consumer a server-side application with NTP-synced clocks?
↓
YES → ±5 minute window (standard, balances security and reliability)
NO → Mobile or IoT device with potentially inaccurate clocks?
    YES → ±15 minute window (accommodates clock drift)
    NO → Unknown clock accuracy → ±5 minute window (start with standard)

---

## Rationale

Server-side NTP-synced clocks typically have millisecond accuracy, so ±5 minutes is generous enough for legitimate network delay. Mobile and IoT devices may have significant clock drift, requiring a larger window. Windows larger than 15 minutes create meaningful replay attack opportunities.

---

## Recommended Default

**Default:** ±5 minutes
**Reason:** Industry standard (used by Stripe, AWS, GitHub). Accommodates network delays and minor clock skew while limiting replay window.

---

## Risks Of Wrong Choice

Window too small (<1 minute): legitimate requests rejected due to normal clock skew. Window too large (>15 minutes): replay attacks possible within that window, nonce cache must retain entries longer.

---

## Related Rules

- Enforce a 5-Minute Maximum Timestamp Window (from 05-rules.md)

---

## Related Skills

- Implement Signed Request Pattern (from 06-skills.md)

---

## Nonce Storage Strategy — Redis vs Database

---

## Decision Context

Where should used nonces be stored for replay protection? Arises when implementing signed request nonce deduplication.

---

## Decision Criteria

* performance — sub-millisecond lookup required per request
* TTL — nonces automatically expire after the timestamp window
* distribution — shared cache needed across application servers
* durability — nonce loss allows replay (acceptable after TTL expiry)

---

## Decision Tree

Is Redis available as a cache backend?
↓
YES → Use Redis SET NX with TTL = timestamp window (best performance)
NO → Use database table with `created_at` index and periodic cleanup
    → Only acceptable for low-throughput APIs (<100 req/s)

---

## Rationale

Redis SET NX with automatic TTL is ideal for nonce deduplication — atomic, auto-expiring, and sub-millisecond. Database-based nonce storage adds latency, requires manual cleanup, and creates contention under load.

---

## Recommended Default

**Default:** Redis with SET NX and TTL equal to timestamp window
**Reason:** Atomic deduplication, automatic expiration, sub-millisecond performance, distributed compatibility.

---

## Risks Of Wrong Choice

Database storage: table bloat without cleanup, slow lookups, primary key contention. No nonce at all: replay attack defeats signed request security entirely.

---

## Related Rules

- Include Method, URI, Body Hash, Timestamp, and Nonce in Signature (from 05-rules.md)

---

## Related Skills

- Implement Signed Request Pattern (from 06-skills.md)
