# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** webhook-replay-attack-prevention
**Generated:** 2026-06-03

---

# Decision Inventory

* Signature Verification vs IP Whitelisting for Webhook Security
* Replay Attack Prevention Strategy

---

# Architecture-Level Decision Trees

---

## Signature Verification vs IP Whitelisting for Webhook Security

---

### Decision Context

Whether to verify webhook authenticity via signature verification or IP whitelisting.

---

### Decision Criteria

* Security requirements
* Sender IP stability
* Implementation complexity tolerance
* Key management capability

---

### Decision Tree

Sender provides signature (HMAC, RSA)?
YES → Use signature verification — cryptographic proof of authenticity
NO → Sender has stable, predictable IP range?
    YES → IP whitelisting is acceptable for lower-security contexts
NO → Need defense-in-depth?
    YES → Both — signature verification + IP whitelisting
NO → Default?
    YES → Use signature verification — standard webhook security

---

### Rationale

Signature verification provides cryptographic proof that the webhook came from the claimed sender and hasn't been tampered with. IP whitelisting is simpler but less secure (IP spoofing, sender IP changes). Signature verification is the industry standard.

---

### Recommended Default

**Default:** Implement signature verification for all incoming webhooks; use IP whitelisting as additional defense
**Reason:** Signature verification prevents tampering and impersonation. IP whitelisting adds network-level filtering. Both together provide defense in depth.

---

### Risks Of Wrong Choice

- IP whitelisting only: IP spoofing, sender changes IP without notice
- No signature: cannot verify webhook authenticity
- Signature without timestamp check: vulnerable to replay attacks
- Weak secret management: signing key leaked

---

### Related Rules

- implement-webhook-replay-attack-prevention

---

### Related Skills

- Configure Webhook Replay Attack Prevention

---

## Replay Attack Prevention Strategy

---

### Decision Context

How to prevent replay attacks where a captured webhook request is resent.

---

### Decision Criteria

* Webhook payload sensitivity
* Idempotency capability
* Network security context

---

### Decision Tree

Webhook causes state-changing actions (payment, refund)?
YES → Implement nonce/timestamp check — prevent replay of state-changing operations
NO → Webhook is informational (status update, notification)?
    YES → Idempotency key is sufficient — duplicate is harmless
NO → Idempotent processing already implemented?
    YES → Replay prevention is optional — idempotency handles duplicates
NO → Default?
    YES → Implement timestamp + signature (valid within 5-minute window) + idempotency key

---

### Rationale

Replay attacks resend a valid webhook request to trigger the same action multiple times. Prevention combines: timestamp validation (reject old requests), nonce tracking (reject duplicates), and idempotency (safe processing of duplicates).

---

### Recommended Default

**Default:** Timestamp validation (reject >5 minute skew) + signature verification + idempotent processing
**Reason:** Three-layer defense. Timestamp prevents old replays, signature ensures authenticity, idempotency handles any remaining duplicates safely.

---

### Risks Of Wrong Choice

- No timestamp check: old captured requests can be replayed indefinitely
- No idempotency: successful replay causes duplicate side effects
- Too-wide timestamp window: increases replay window
- Too-narrow timestamp window: legitimate delayed deliveries rejected

---

### Related Rules

- implement-webhook-replay-attack-prevention

---

### Related Skills

- Configure Webhook Replay Attack Prevention
