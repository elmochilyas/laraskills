# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Column-Level RSA Encryption (eloquent-encryption)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Column-Level vs Crypt Facade vs Envelope Encryption | Encryption approach granularity | architectural, performance |
| 2 | RSA vs AES Key Type | Asymmetric vs symmetric column encryption | security, operational |

---

# Architecture-Level Decision Trees

---

## Column-Level vs Crypt Facade vs Envelope Encryption

---

## Decision Context

Choosing between column-level encryption (eloquent-encryption), the Crypt facade (AES-256), or envelope encryption (DEK/KEK with Sealcraft) for sensitive data at rest.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

What is the data volume?
↓
Single fields (SSN, tax ID) → Column-level encryption (eloquent-encryption or encrypted cast)
Multiple fields per record → Crypt facade (symmetric per-field) or envelope encryption
Large payloads (KB+) → Envelope encryption (DEK encrypts data, KEK encrypts DEK)

Is per-attribute key separation needed?
↓
YES → Column-level encryption with RSA key pairs (each attribute potentially different key)
NO → Crypt facade (single APP_KEY for all encrypted data)

Is the data searchable?
↓
YES → Not suitable for standard column encryption. Use searchable hashes or deterministic encryption.
NO → Column-level encryption or Crypt facade

What is the compliance requirement?
↓
HIPAA, PCI DSS → Column-level encryption recommended (explicit field-level controls)
GDPR → Either approach acceptable (encrypt PII at rest)

Is key rotation a regular requirement?
↓
YES → Envelope encryption (rotate KEK only, DEKs re-wrapped — no data re-encryption)
NO → Column-level or Crypt facade (simple setup)

---

## Rationale

Column-level encryption is for specific sensitive fields where per-attribute key management is needed. The Crypt facade is simpler (one key for everything) but less granular. Envelope encryption is for large payloads or frequent key rotation (rotate the KEK without re-encrypting data). For most applications with a few sensitive fields, the `encrypted` cast (Crypt facade) is the simplest and most maintainable approach.

---

## Recommended Default

**Default:** Laravel's built-in `encrypted` cast (Crypt facade) for most column encryption needs; eloquent-encryption only when RSA key separation is explicitly required; envelope encryption for large payloads or frequent rotation
**Reason:** The built-in `encrypted` cast uses the APP_KEY (symmetric AES-256) — simpler, faster, and no additional package dependencies. Column-level RSA encryption adds key management complexity that is rarely justified. Envelope encryption is specialized for large payloads.

---

## Risks Of Wrong Choice

- Column-level RSA for high-throughput fields: slow decrypt (1-5ms per RSA decrypt)
- Crypt facade when per-attribute key separation needed: all attributes share one key
- Envelope encryption for small fields: over-engineered
- No encryption at all: plaintext PII in database

---

## Related Rules

- Mark Encrypted Columns in `$casts` as `'encrypted'` (05-rules.md)
- Encrypt Only Truly Sensitive Columns (05-rules.md)
- Ensure Encrypted Column Size Accommodates Ciphertext (05-rules.md)

---

## Related Skills

- Encrypt Database Columns Transparently with eloquent-encryption (06-skills.md)

---

## RSA vs AES Key Type

---

## Decision Context

Whether to use RSA (asymmetric) or AES (symmetric) for column-level encryption keys.

---

## Decision Criteria

* security
* operational

---

## Decision Tree

Is key separation per-application or per-service required?
↓
YES → RSA (different key pairs for different applications/services)
NO → AES (single key shared across the application)

Is the encrypted data shared between multiple applications?
↓
YES → RSA (share public key for encryption, keep private key per app)
NO → AES (single APP_KEY, internal only)

Is performance a critical factor?
↓
YES → AES (much faster encrypt/decrypt than RSA)
NO → RSA acceptable (1-5ms per decrypt)

Is there an existing PKI infrastructure?
↓
YES → RSA may integrate naturally (use existing certificate authority)
NO → AES is simpler (generate key, no PKI management)

What is the data volume per field?
↓
Small (< 256 bytes) → RSA or AES both work
Large (> 256 bytes) → AES or hybrid (RSA encrypts AES key, AES encrypts data)

---

## Rationale

AES is significantly faster than RSA for encryption/decryption and is simpler to manage (a single key). RSA is justified when different applications need separate read/write capabilities (share public key for encryption, keep private key for decryption) or when an existing PKI is in place. For most applications, AES (via the `encrypted` cast or Crypt facade) is the better choice.

---

## Recommended Default

**Default:** AES-256 (via Laravel's `encrypted` cast) for most column encryption; RSA only when asymmetric key distribution is required
**Reason:** AES is faster, simpler, and supported natively by Laravel. RSA introduces key pair generation, PKI management, and slower encryption/decryption. RSA's advantage (asymmetric key sharing) is rarely needed for application-level column encryption.

---

## Risks Of Wrong Choice

- RSA for all encrypted fields: unnecessary performance overhead (1-5ms per field)
- AES for cross-application sharing: must share APP_KEY across apps (security risk)
- RSA with weak key (1024-bit): can be factored, data exposed
- AES key reused across environments: development can decrypt production data

---

## Related Rules

- Mark Encrypted Columns in `$casts` as `'encrypted'` (05-rules.md)
- Never Log or Dump Encrypted Column Values (05-rules.md)
- Test Encryption Round-Trip in Feature Tests (05-rules.md)

---

## Related Skills

- Encrypt Database Columns Transparently with eloquent-encryption (06-skills.md)
