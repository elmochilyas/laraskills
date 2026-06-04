# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** custom-signature-validator
**Generated:** 2026-06-03

---

# Decision Inventory

1. Validator Implementation Strategy (Per-Provider vs Generic)
2. Signature Comparison Strategy (hash_equals vs ===)
3. Composite Validation Strategy (Signature + Timestamp + Nonce)

---

# Architecture-Level Decision Trees

---

## Validator Implementation Strategy

---

## Decision Context

Choosing between per-provider custom validators and a generic multi-provider validator.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does each provider use a different signature format?
↓
YES → Implement one SignatureValidator class per provider
  ↓
  Are there providers with similar signing schemes (e.g., HMAC-SHA256 variants)?
  ↓
  YES → Create base abstract validator; extend for provider-specific parsing
  NO → Fully independent validators per provider; no shared base needed
NO → Do providers share a common signing scheme?
  ↓
  YES → Single generic validator with per-provider configuration
  NO → Per-provider validators are required for provider-specific parsing
  ↓
  Need to test validators in isolation?
  ↓
  YES → Per-provider validators enable targeted unit tests per provider
  NO → Generic validator is sufficient but harder to test individually

---

## Rationale

Per-provider validators maintain separation of concerns, enabling provider-specific parsing and isolated testing. A single generic validator becomes complex as more providers with different schemes are added.

---

## Recommended Default

**Default:** One custom SignatureValidator class per provider with non-standard signing
**Reason:** Clean separation; provider-specific parsing; targeted unit tests

---

## Risks Of Wrong Choice

Generic validator becomes complex and brittle as provider count grows. Per-provider validators with nearly identical logic duplicate code unnecessarily.

---

## Related Rules

Implement One Validator Class Per Provider, Use hash_equals() Exclusively

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Signature Comparison Strategy

---

## Decision Context

Choosing the comparison method for cryptographic signatures.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Is the comparison between two HMAC/SHA hash strings?
↓
YES → Use hash_equals() exclusively; never use == or ===
  ↓
  Is the comparison between user-supplied and computed values?
  ↓
  YES → hash_equals() is mandatory; regular comparison leaks timing
  NO → hash_equals() still recommended; no performance penalty
NO → Is the comparison between non-cryptographic values (API key, token)?
  ↓
  YES → hash_equals() still recommended for constant-time comparison
  NO → Use strcmp() for non-sensitive string comparison
  ↓
  Need to support multiple valid signatures (key rotation)?
  ↓
  YES → Loop through active keys; use hash_equals() for each comparison
  NO → Single secret; hash_equals() with one comparison

---

## Rationale

hash_equals() provides constant-time comparison, preventing timing side-channel attacks that can leak the signature character by character through response timing variance.

---

## Recommended Default

**Default:** hash_equals() for all signature comparisons
**Reason:** Timing-safe; no performance downside; eliminates timing attack vector

---

## Risks Of Wrong Choice

=== or == comparison enables timing side-channel attacks, allowing attackers to brute-force the signature character by character. Performance difference is negligible.

---

## Related Rules

Use hash_equals() Exclusively

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Composite Validation Strategy

---

## Decision Context

Combining signature verification with timestamp and nonce checks for defense in depth.

---

## Decision Criteria

* security
* performance

---

## Decision Tree

Is the webhook for a financial or state-mutating operation?
↓
YES → Implement composite validation: timestamp + nonce + signature
  ↓
  Order of operations: validate cheapest checks first?
  ↓
  YES → Timestamp → Nonce → Signature (most to least performant)
  NO → Any order works; but timestamp-first rejects old requests cheaply
NO → Is the webhook for read-only or informational events?
  ↓
  YES → Signature-only validation is sufficient; timestamp and nonce optional
  NO → Composite validation recommended for defense in depth
  ↓
  Need to handle clock skew between servers?
  ↓
  YES → Set timestamp tolerance to 5 minutes; monitor NTP sync
  NO → 5-minute tolerance is standard; NTP sync still recommended
  ↓
  Need multi-secret rotation support?
  ↓
  YES → Composite validator checks multiple secrets; accept if any matches
  NO → Single secret validation is sufficient

---

## Rationale

Composite validation provides defense in depth: timestamp rejects old requests cheaply, nonce prevents replay within window, signature ensures authenticity. Ordering by computational cost rejects invalid requests early.

---

## Recommended Default

**Default:** Timestamp (5min window) → Nonce (Redis, 24h TTL) → Signature (hash_equals)
**Reason:** Defense in depth; early rejection of cheap-to-check invalid requests

---

## Risks Of Wrong Choice

Signature-only validation allows replay attacks. Timestamp-only allows replay within tolerance window. Nonce-only is bypassed if nonce store is unavailable.

---

## Related Rules

Access Raw Body via $request->getContent()

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks
