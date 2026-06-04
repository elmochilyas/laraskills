# Decomposition: HMAC-SHA256 Webhook Signature Generation and Verification

## Topic Overview
HMAC-SHA256 is the dominant mechanism for webhook payload authentication, used by Stripe, GitHub, Slack, and the Standard Webhooks specification. It employs a shared secret to produce a cryptographic signature that verifies payload integrity and authenticity. The pattern requires raw-body signing, timing-safe comparison, support for multiple signature versions during key rotation, and defense against replay attacks through timestamp binding.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k003-hmac-signature/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### HMAC-SHA256 Webhook Signature Generation and Verification
- **Purpose:** HMAC-SHA256 is the dominant mechanism for webhook payload authentication, used by Stripe, GitHub, Slack, and the Standard Webhooks specification. It employs a shared secret to produce a cryptographic signature that verifies payload integrity and authenticity. The pattern requires raw-body signing, timing-safe comparison, support for multiple signature versions during key rotation, and defense against replay attacks through timestamp binding.
- **Difficulty:** Intermediate
- **Dependencies:** K011, K021, K022, K035

## Dependency Graph
**Depends on:**
- K011
- K021
- K022
- K035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- HMAC (Hash-Based Message Authentication Code) combines a cryptographic hash with a shared secret key
- SHA-256 provides 256-bit (32-byte) output regardless of input size
- hash_hmac('sha256', $payload, $secret)
- Timing-safe comparison via `hash_equals($expected, $actual)` prevents side-channel attacks
- Raw request body must be signed (not parsed/re-encoded JSON which may differ)
- Signature prefix versions (`v1,`, `v2,`) enable zero-downtime key rotation

**Out of scope:**
- K011 topics covered in their respective KUs
- K021 topics covered in their respective KUs
- K022 topics covered in their respective KUs
- K035 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization