# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** replay-attack-prevention
**Generated:** 2026-06-03

---

# Decision Inventory

1. Prevention Layer Strategy (Timestamp vs Nonce vs Idempotency vs Full Stack)
2. Timestamp Tolerance Configuration
3. Duplicate Event Response Strategy

---

# Architecture-Level Decision Trees

---

## Prevention Layer Strategy

---

## Decision Context

Choosing which replay prevention techniques to implement and in what order.

---

## Decision Criteria

* event criticality
* provider capabilities
* compliance requirements
* performance budget

---

## Decision Tree

Is the webhook processing financial or account-changing (payments, SSO)?
↓
YES → Implement full prevention stack: timestamp + nonce + idempotency + signature
  ↓
  Prevention stack order:
  1. Check timestamp tolerance (reject expired → fast, no storage needed)
  2. Verify HMAC signature with timestamp in signed content (cryptographic proof)
  3. Check nonce uniqueness in cache (prevents replay within tolerance window)
  4. Check idempotency key (prevents duplicate processing across retries)
  NO → Payment-critical but provider supports idempotency keys natively?
    ↓
    YES → Timestamp + idempotency key only (nonce overhead unnecessary)
    NO → Full stack required for compliance
NO → Is at-least-once processing acceptable (read-only notifications)?
  ↓
  YES → Timestamp tolerance only (simplest, lowest overhead)
    ↓
    Risk of replay within tolerance window?
    ↓
    YES → Add idempotency key if provider supplies unique event ID
    NO → Timestamp-only acceptable for low-risk events
  NO → Timestamp + idempotency (no nonce — balance of security and complexity)
↓
  Provider includes timestamp in signed content?
  ↓
  YES → Signature verification implicitly validates timestamp (cryptographic binding)
  NO → Must check timestamp independently after signature verification
↓
  Nonce tracking storage?
  ↓
  Redis → Fast (1ms), auto-expiry with TTL matching tolerance window
  Database → Slower (5-10ms), manual cleanup needed
  Cache → Fastest but volatile — nonce lost on cache flush

---

## Rationale

Full stack provides defense-in-depth against replay attacks — each layer catches what the previous misses. Timestamp check is fastest and filters expired replays instantly. Nonce prevents replay within tolerance window. Idempotency prevents duplicate processing of legitimate retries.

---

## Recommended Default

**Default:** Full stack (timestamp + nonce + idempotency + signature) for financial/account webhooks; timestamp + idempotency for standard webhooks; timestamp-only for read-only notifications
**Reason:** Appropriate security depth for each event tier without over-engineering for low-risk events

---

## Risks Of Wrong Choice

Timestamp-only allows replay within tolerance window. No idempotency means retry storms cause duplicate processing. Nonce without timestamp fails open — attacker can replay expired events with valid nonces.

---

## Related Rules/Skills

* 03-webhooks: custom-signature-validator (signature with timestamp binding)
* 04-resilience: idempotency (idempotency key patterns)

---

---

## Timestamp Tolerance Configuration

---

## Decision Context

Setting the acceptable time window for webhook timestamp validity.

---

## Decision Criteria

* clock skew tolerance
* replay risk tolerance
* network delay
* provider behavior

---

## Decision Tree

Are webhook senders distributed across multiple data centers?
↓
YES → Allow wider tolerance to accommodate clock skew (±5 minutes)
  ↓
  Payment webhooks have tighter tolerance requirement?
  ↓
  YES → ±2 minutes for payment webhooks; ±5 minutes for standard
  NO → ±5 minutes uniform across all webhooks
NO → Single-region sender, known clock sync → ±1 minute sufficient
  ↓
  Provider sends exact timestamp in signature header?
  ↓
  YES → Signed timestamp cannot be tampered — tolerance is for drift only
  NO → Tolerance must account for both drift AND potential tampering
  ↓
  Use ±5 minutes as safety net
↓
  Tolerance too wide risk?
  ↓
  >15 minutes → Wide replay window possible
  >5 minutes → Moderate risk
  <2 minutes → Frequent false positives from clock drift
↓
  Implementation approach?
  ↓
  Absolute: reject if |now - timestamp| > tolerance
  Relative: reject if timestamp < now - tolerance (no future tolerance)
  ↓
  Future tolerance needed?
  ↓
  YES (standard) → Allow up to 30s in future for sender clock ahead
  NO → Only past timestamps valid (stricter security)

---

## Rationale

Tolerance must balance clock drift (which is real) with replay risk. ±5 minutes is the industry standard (Stripe, Svix, Standard Webhooks spec). Payment webhooks benefit from tighter tolerance. Future tolerance limited to 30s prevents future-timestamp replays.

---

## Recommended Default

**Default:** ±5 minutes tolerance for standard webhooks; ±2 minutes for payment webhooks; 30s future tolerance
**Reason:** Accommodates typical clock skew while limiting replay window; tighter for critical events

---

## Risks Of Wrong Choice

Too tight causes false rejections from legitimate clock skew. Too wide creates large replay window. No future tolerance rejects legitimate events from senders with slightly fast clocks.

---

## Related Rules/Skills

* 03-webhooks: custom-signature-validator (signature + timestamp binding)
* 03-webhooks: incoming/verification-signatures (verification middleware)

---

---

## Duplicate Event Response Strategy

---

## Decision Context

Determining HTTP response behavior when a previously-processed event is received again.

---

## Decision Criteria

* idempotency semantics
* provider expectations
* logging requirements
* debugging needs

---

## Decision Tree

Is the event a duplicate of a previously processed event?
↓
YES → Has it been fully processed (not a retry of a failed processing)?
  ↓
  Fully processed → Return 200 OK (idempotent response)
    ↓
  Include duplicate detection metadata in response?
  ↓
  YES → Log: event ID, original processing time, duplicate note
  NO → Silent 200 — no indication of dedup in response
  Still processing or failed → Let provider retry naturally based on status
↓
  Provider's expectation for duplicate response?
  ↓
  Expects 200 OK for duplicates (Stripe, GitHub) → Return 200
  Expects 409 Conflict (some providers want explicit duplicate signal) → Return 409
  Unknown → 200 OK is safe default for most providers
↓
  Log duplicate events for monitoring?
  ↓
  YES → Log with event ID, duplicate count, time since original
    ↓
    High duplicate rate indicates provider retry storm?
    ↓
    YES → Alert on duplicate rate >10% — provider retry behavior concerning
    NO → Log only, no alert
  NO → No duplicate logging — blind to retry patterns
↓
  Idempotency key handling on duplicate?
  ↓
  Same idempotency key → Return same response as original (true idempotency)
  Different idempotency key for same event → Treat as separate event or conflict
  Return cached response if stored for idempotency key

---

## Rationale

200 OK response is standard for idempotent webhook endpoints — providers treat duplicate success as acceptable. Returning the same response for the same idempotency key provides true idempotency. Duplicate rate monitoring reveals provider retry storms.

---

## Recommended Default

**Default:** 200 OK for all duplicates, log event ID + duplicate count, alert on >10% duplicate rate
**Reason:** Complies with provider expectations, provides monitoring, prevents alert fatigue on normal retries

---

## Risks Of Wrong Choice

409 Conflict confuses providers expecting 200 OK. Silent 200 with no logging blinds teams to retry storms. Returning different responses for same idempotency key breaks idempotency contract.

---

## Related Rules/Skills

* 04-resilience: idempotency (idempotency key patterns and response caching)
* 04-resilience: retry-strategies (provider retry behavior analysis)
