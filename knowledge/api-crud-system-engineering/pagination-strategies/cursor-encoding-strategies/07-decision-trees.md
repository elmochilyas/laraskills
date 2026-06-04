# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Pagination Strategies
**Knowledge Unit:** Cursor Encoding Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Cursor Encoding Strategy Selection

---

## Decision Context

Choosing the cursor encoding approach — base64 JSON, encrypted, HMAC-signed, or binary — based on security requirements, debuggability needs, and performance constraints.

---

## Decision Criteria

* security
* performance
* maintainability
* architectural

---

## Decision Tree

Does the cursor contain sensitive data (PII, roles, authorization scope)?
├── YES → Encrypt the cursor (use Laravel Crypt or AES)
└── NO → Is the API public-facing where cursor tampering is a concern?
    ├── YES → Does response caching need to work with cursors?
    │   ├── YES → HMAC-sign the cursor (tamper-evident, cacheable)
    │   └── NO → Encrypt the cursor (tamper-proof, not cacheable)
    └── NO → Is debuggability a priority (internal API)?
        ├── YES → Base64 JSON (transparent, debuggable, Laravel default)
        └── NO → Is bandwidth constrained (mobile API)?
            ├── YES → Binary encoding (smallest payload, ~24 chars)
            └── NO → Base64 JSON (simplest, sufficient for most cases)

---

## Rationale

Base64 is encoding, not encryption. Sensitive data in plaintext cursors is a data leak. HMAC signing provides tamper detection without preventing caching. Encryption provides tamper-proofing but prevents caching and adds size. Binary encoding is fastest but least debuggable.

---

## Recommended Default

**Default:** Base64 JSON encoding (Laravel default) for internal APIs; HMAC-signed for public APIs
**Reason:** Most cursors contain only sort values already visible in responses; signing prevents tampering without sacrificing cacheability.

---

## Risks Of Wrong Choice

Plain base64 with sensitive data leaks PII. Unversioned cursors break on format change. Over-engineering (encrypting all cursors) prevents caching and bloats payloads without benefit.

---

## Related Rules

* Version Cursors From Day One
* Keep Cursors Opaque to Clients
* Never Encode Sensitive Data in Base64 Cursors

---

## Related Skills

* Encode Cursor Values as Opaque, Tamper-Evident Strings

---

## Cursor Versioning Decision

---

## Decision Context

Determining the cursor format versioning approach to allow future encoding changes without breaking existing pagination sessions.

---

## Decision Criteria

* maintainability
* architectural
* security

---

## Decision Tree

Is the API deployed to production with active clients?
├── YES → Include a version field ('v' => 1) in every cursor payload
└── NO → Is the cursor format likely to change before the first public release?
    ├── YES → Include version field from day one (no cost, future-proof)
    └── NO → Can all clients be updated simultaneously (internal API)?
        ├── YES → Versioning is optional but still recommended
        └── NO → Include version field from day one

---

## Rationale

Without a version field, changing the encoding strategy breaks all in-flight cursors, forcing clients to re-paginate from the start or experience errors. A version field enables coexistence of old and new formats during migration.

---

## Recommended Default

**Default:** Always include version field ('v' => 1) from day one
**Reason:** Negligible cost; enables future encoding changes without breaking clients.

---

## Risks Of Wrong Choice

Unversioned cursors make encoding format changes impossible without breaking all active pagination sessions; forces simultaneous client updates.

---

## Related Rules

* Version Cursors From Day One

---

## Related Skills

* Encode Cursor Values as Opaque, Tamper-Evident Strings
