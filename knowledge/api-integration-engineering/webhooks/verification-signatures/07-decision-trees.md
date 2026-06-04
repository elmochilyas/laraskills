# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** verification-signatures
**Generated:** 2026-06-03

---

# Decision Inventory

1. Signature Verification Strategy (Standard vs Custom)
2. Raw Body Access Strategy
3. Multi-Secret Rotation Strategy

---

# Architecture-Level Decision Trees

---

## Signature Verification Strategy

---

## Decision Context

Choosing between standard HMAC verification and custom verification.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the provider use standard HMAC-SHA256 with raw body signing?
↓
YES → Use Spatie's DefaultSignatureValidator with hash_equals()
  ↓
  Does the provider use a standard signature header name?
  ↓
  YES → Default config works; no custom validator needed
  NO → Configure header name in webhook config; still uses default validator
NO → Does the provider use a non-standard format (Stripe t=, GitHub sha256=)?
  ↓
  YES → Implement custom SignatureValidator with provider-specific parsing
  NO → Does the provider use basic auth or API key instead?
    ↓
    YES → Custom middleware for API key verification; not SignatureValidator
    NO → Implement custom authentication approach
  ↓
  Need to verify raw body (php://input) not re-encoded JSON?
  ↓
  YES → $request->getContent() for byte-exact body access
  NO → Always use raw body; JSON re-encoding breaks signatures

---

## Rationale

Standard HMAC providers need zero custom code — Spatie's default validator handles them. Non-standard providers need custom validators for provider-specific parsing. Raw body access is mandatory for correct signature computation.

---

## Recommended Default

**Default:** DefaultSignatureValidator for standard HMAC; custom validator per non-standard provider
**Reason:** Zero custom code for standard; correct parsing for non-standard

---

## Risks Of Wrong Choice

Using default validator for non-standard providers accepts invalid signatures silently. Custom validator without hash_equals() enables timing attacks. JSON re-encoding instead of raw body causes false verification failures.

---

## Related Rules

Always Verify Against Raw Request Body, Use hash_equals() for Comparison

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Raw Body Access Strategy

---

## Decision Context

Ensuring correct raw body access for signature verification.

---

## Decision Criteria

* security
* reliability

---

## Decision Tree

Does the code access the request body before signature verification?
↓
YES → Read raw body before any parsing; cache for subsequent access
  ↓
  Does the code use $request->input() or $request->all() first?
  ↓
  YES → These methods parse and encode differently; signature will fail
  NO → $request->getContent() preserves original byte sequence
NO → Is the webhook processed through middleware that reads the body?
  ↓
  YES → Register signature validator before body-reading middleware
  NO -> Standard middleware order is fine
  ↓
  Multiple signature verifications needed per request?
  ↓
  YES -> Cache raw body after first read; reuse for all verifications
  NO -> Single read is sufficient

---

## Rationale

Raw body access via $request->getContent() preserves the original byte sequence that the provider signed. Any parsing before signature verification alters the bytes and causes signature mismatch.

---

## Recommended Default

**Default:** $request->getContent() before any other body access
**Reason:** Preserves original signed bytes; prevents whitespace/key-order mismatches

---

## Risks Of Wrong Choice

$request->input() or $request->all() re-encodes JSON with different whitespace/key ordering, causing signature mismatch. Calling getContent() after a JSON parse returns empty.

---

## Related Rules

Always Verify Against Raw Request Body

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Multi-Secret Rotation Strategy

---

## Decision Context

Supporting zero-downtime signing secret rotation.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are secrets rotated on a regular schedule (quarterly)?
↓
YES → Support multiple active secrets with version prefix
  ↓
  Does the provider support signature version prefixes (v1=, v2=)?
  ↓
  YES -> Parse version from signature header; verify against corresponding secret
  NO -> Try active secrets sequentially; accept if any matches
NO → Is there need for emergency rotation (compromise)?
  ↓
  YES → Implement multi-secret support before rotation is needed
  NO → Single secret is acceptable with scheduled rotation only
  ↓
  Need to keep old secret active during rotation window?
  ↓
  YES -> Add new secret as valid; keep old until all subscribers rotated
  NO -> Replace secret immediately; brief verification failure window

---

## Rationale

Multi-secret rotation enables zero-downtime key rotation by accepting both old and new secrets during the transition period. Version-prefixed signatures make key selection deterministic.

---

## Recommended Default

**Default:** Support 2 simultaneous secrets with version prefix; old secret retired after 1 rotation cycle
**Reason:** Zero-downtime rotation; orderly transition; compromise recovery capability

---

## Risks Of Wrong Choice

Single-secret rotation causes brief verification failures during key update. No rotation schedule leaves old secrets exposed indefinitely. Sequential key testing allows timing-based key enumeration.

---

## Related Rules

Store Signing Secrets in Environment Variables, Support Multiple Signature Versions

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks
