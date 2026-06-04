# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Laravel Crypt Facade (AES-256-CBC/GCM)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Cipher Mode Selection | AES-256-CBC vs AES-256-GCM | security, compatibility |
| 2 | Encryption Granularity | Crypt facade vs column-level vs envelope encryption | architectural, performance |
| 3 | Key Rotation Strategy | How to rotate APP_KEY without data loss | operational |

---

# Architecture-Level Decision Trees

---

## Cipher Mode Selection

---

## Decision Context

Choosing between AES-256-CBC (with HMAC) and AES-256-GCM for Laravel Crypt encryption.

---

## Decision Criteria

* security
* compatibility

---

## Decision Tree

Does the PHP environment support AES-256-GCM (PHP 7.1+ with openssl)?
↓
YES → Prefer GCM (authenticated encryption in one operation, slightly faster)
NO → Fall back to CBC + HMAC (requires PHP 7.1+ openssl; may have trust store issues)

Is backward compatibility with existing CBC-encrypted data needed?
↓
YES → Stay on CBC (cannot mix modes for the same encrypted payload)
NO → GCM is the modern choice

Does the application need to share encrypted data with other systems?
↓
YES → Verify they support the same cipher mode (CBC is more widely supported)
NO → GCM for internal-only encryption

Is there an existing codebase already using CBC?
↓
YES → Continue with CBC unless a full data migration is planned
NO → Start with GCM (new applications)

---

## Rationale

AES-256-GCM provides authenticated encryption (confidentiality + integrity) in a single operation, making it simpler and slightly faster than CBC + separate HMAC. CBC is still secure when combined with Laravel's HMAC wrapper. GCM is preferred for new applications. CBC should be maintained for backward compatibility with existing encrypted data.

---

## Recommended Default

**Default:** AES-256-GCM for new applications; AES-256-CBC for existing applications with existing encrypted data
**Reason:** GCM is simpler (no separate HMAC), slightly faster, and provides the same security guarantees. CBC with HMAC is equally secure but requires more overhead. Existing encrypted data cannot be transparently migrated between modes.

---

## Risks Of Wrong Choice

- CBC when GCM available: slightly slower, HMAC overhead, correct but suboptimal
- GCM when systems expect CBC: incompatible encrypted payloads
- CBC with weak HMAC: tampering undetected (Laravel handles this correctly)
- No cipher configured: Laravel defaults to CBC (safe default)

---

## Related Rules

- Use `Crypt::encryptString()` for Short Strings, `Crypt::encrypt()` for Arrays (05-rules.md)
- Set APP_KEY to a Secure 32-Byte Random String (05-rules.md)

---

## Related Skills

- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)

---

## Encryption Granularity

---

## Decision Context

Choosing the encryption approach — Crypt facade (whole-payload), column-level model encryption, or envelope encryption (DEK/KEK).

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

What is the data size?
↓
Small string/array (< 1 KB) → Crypt facade (simple, built-in)
Large payload (> 1 KB, up to several MB) → Envelope encryption (DEK for payload, Crypt for DEK)
File-level data (MB+) → File encryption tools (not Crypt facade)

Is per-attribute key separation needed (different encryption keys for different columns)?
↓
YES → Column-level encryption (eloquent-encryption, sealcraft)
NO → Crypt facade sufficient (single APP_KEY for all data)

Does the encrypted data need to be searchable?
↓
YES → Deterministic encryption or searchable encryption (neither possible with Crypt facade alone)
NO → Crypt facade sufficient (encrypted data is opaque)

Is this for data at rest in the database?
↓
YES → Crypt facade or column-level encryption
NO → Other encryption tools may be appropriate

---

## Rationale

The Crypt facade is the right choice for most application-level encryption — encrypting strings, arrays, and small payloads at rest. Column-level encryption adds key separation (each attribute potentially has different keys) but adds complexity. Envelope encryption is for payloads that exceed the Crypt facade's practical size limits. For files, use purpose-built file encryption.

---

## Recommended Default

**Default:** Crypt facade for small sensitive data payloads (< 1 KB); column-level encryption only when per-attribute key separation is required; envelope encryption for larger payloads
**Reason:** The Crypt facade is the simplest and most maintainable approach for typical encrypted data (tokens, PII, credentials). Column-level encryption should only be introduced when the requirement for different keys per attribute is explicit. Envelope encryption is a specialized solution for large payloads.

---

## Risks Of Wrong Choice

- Crypt facade for large payloads: serialization errors, performance issues
- Column-level encryption when not needed: unnecessary complexity, key management overhead
- Envelope encryption for small data: over-engineering, more moving parts
- File encryption with Crypt facade: unwieldy; use file encryption tools instead

---

## Related Rules

- Use `Crypt::encryptString()` for Short Strings, `Crypt::encrypt()` for Arrays (05-rules.md)
- Use Envelope Encryption for Large Payloads (05-rules.md)
- Use Crypt for Sensitive Data at Rest Only (05-rules.md)

---

## Related Skills

- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)

---

## Key Rotation Strategy

---

## Decision Context

How to rotate the APP_KEY without losing access to existing encrypted data.

---

## Decision Criteria

* operational

---

## Decision Tree

Is there existing encrypted data in the database?
↓
YES → Rotation requires a migration script (decrypt with old key, re-encrypt with new key)
NO → Simple rotation (change APP_KEY, no data to migrate)

Can the application tolerate downtime for key rotation?
↓
YES → Online migration (script decrypts/re-encrypts while app is down or in maintenance mode)
NO → Zero-downtime migration (dual-write strategy: read old, write new)

Does the application have multiple services sharing the same encrypted data?
↓
YES → Coordinate rotation across all services (all must switch together)
NO → Single-application rotation (simpler)

Is there a compliance requirement for key rotation frequency?
↓
YES → Schedule regular rotation windows (quarterly, annually) with migration scripts
NO → Rotate only when key compromise is suspected or personnel changes

---

## Rationale

APP_KEY rotation is destructive — all existing encrypted data becomes undecryptable with the new key. A migration script must decrypt all encrypted values with the old key, then re-encrypt with the new key. This is an offline or low-traffic operation. For zero-downtime, implement a dual-read strategy (try new key first, fall back to old key) while migrating data in the background.

---

## Recommended Default

**Default:** Rotate APP_KEY only when necessary (key compromise, personnel departure, compliance); execute a migration script to re-encrypt all data; use maintenance mode during rotation for safety
**Reason:** Key rotation is a high-risk operation — mistakes cause permanent data loss. Rotating only when necessary minimizes risk exposure. The migration script should be tested on a staging environment with production-like data volume.

---

## Risks Of Wrong Choice

- Rotating without migration: all encrypted data becomes permanently inaccessible
- Manual rotation via .env edit: easy to forget re-encryption step
- Frequent rotation: high operational overhead, multiple migration scripts
- Never rotating: compromised key undetected, all encrypted data exposed

---

## Related Rules

- Rotate APP_KEY Only Through a Migration Script (05-rules.md)
- Set APP_KEY to a Secure 32-Byte Random String (05-rules.md)

---

## Related Skills

- Encrypt and Decrypt Data Using Laravel's Crypt Facade (06-skills.md)
