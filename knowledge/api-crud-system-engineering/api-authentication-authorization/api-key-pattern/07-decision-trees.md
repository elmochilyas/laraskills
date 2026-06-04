# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** API Key Pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Dedicated api_keys table vs Sanctum personal_access_tokens
* SHA-256 vs bcrypt for key hashing
* Header vs URL parameter for key transmission

---

# Architecture-Level Decision Trees

---

## Dedicated api_keys Table vs Sanctum personal_access_tokens

---

## Decision Context

Where should API keys be stored? This decision arises during initial API key implementation when choosing the storage model.

---

## Decision Criteria

* architectural purity — separation of service vs user credentials
* implementation speed — using existing Sanctum table vs creating a new migration
* lifecycle semantics — environment scoping, service identity, rate limit contexts
* auditability — tracing key usage separately from user tokens

---

## Decision Tree

What credential type are you storing?
↓
Service-to-service credentials?
YES → Dedicated `api_keys` table
NO → User tokens?
    YES → Sanctum `personal_access_tokens`
    NO → Evaluate OAuth2 client credentials (Passport)

---

## Rationale

API keys identify services, not users. Mixing them in Sanctum's `personal_access_tokens` conflates service-to-service credentials with user credentials. A dedicated `api_keys` table allows environment scoping, separate rate limit contexts, and service-level audit trails. The prototyping exception exists only for speed during initial development.

---

## Recommended Default

**Default:** Dedicated `api_keys` table
**Reason:** Clean separation of concerns, proper environment scoping, auditable service identity, and avoids conflating permission models.

---

## Risks Of Wrong Choice

Using Sanctum's table: permission model confusion, no environment isolation, harder audit traceability, and permission changes requiring token regeneration.

---

## Related Rules

- Use Dedicated api_keys Table (from 05-rules.md)

---

## Related Skills

- Implement API Key Pattern (from 06-skills.md)
- Sanctum Token Auth (from 06-skills.md)

---

## SHA-256 vs bcrypt for Key Hashing

---

## Decision Context

What hashing algorithm should be used to store API keys securely? Arises when implementing the key storage layer.

---

## Decision Criteria

* security — resistance to brute-force if database is compromised
* performance — hashing overhead per authentication request
* key entropy — high-entropy random keys vs low-entropy user-chosen secrets
* infrastructure cost — CPU time for hash verification at scale

---

## Decision Tree

What type of credential are you hashing?
↓
High-entropy random API key (256+ bits)?
YES → SHA-256 (fast, sufficient for random keys)
NO → User-chosen secret or low-entropy key?
    YES → bcrypt (cost factor protects weak secrets)
    NO → SHA-256 (default for machine-generated keys)

---

## Rationale

SHA-256 is sufficient for high-entropy random keys (256+ bits) because brute-forcing the key space is computationally infeasible. bcrypt adds 10-50ms per verification with no additional security benefit for random keys. Low-entropy or user-chosen secrets require bcrypt's adaptive cost factor to slow down offline cracking.

---

## Recommended Default

**Default:** SHA-256
**Reason:** API keys are cryptographically random with 256+ bits of entropy, making bcrypt's cost factor unnecessary. SHA-256 adds negligible latency (<1ms) per request.

---

## Risks Of Wrong Choice

Using bcrypt: unnecessary 10-50ms latency per request on high-throughput APIs, increased CPU cost at scale. Using SHA-256 for user-chosen low-entropy keys: vulnerable to offline brute-force cracking.

---

## Related Rules

- Generate With 256-Bit Entropy Minimum (from 05-rules.md)
- Hash With SHA-256, Never Store Plain Text (from 05-rules.md)

---

## Related Skills

- Implement API Key Pattern (from 06-skills.md)

---

## Header vs URL Parameter for Key Transmission

---

## Decision Context

How should API clients transmit the API key in requests? Arises when defining the API key authentication protocol.

---

## Decision Criteria

* security — exposure in logs, referrer headers, and browser history
* client compatibility — ease of use for different client types
* caching behavior — URL-based keys cached by proxies and CDNs
* HTTP spec compliance — proper use of Authorization header

---

## Decision Tree

How is the API consumed?
↓
From browser-based client?
YES → Authorization header (prevents referrer leakage)
NO → Server-to-server with logging?
    YES → Authorization header (avoids log exposure)
    NO → Simple client that can't set custom headers?
        YES → X-API-Key header (not URL parameter)
        NO → Header transmission (always preferred)

---

## Rationale

URL query parameter transmission exposes API keys in server logs, browser history, referrer headers, and proxy caches. Header-only transmission (Authorization: Bearer or X-API-Key) avoids all these leak vectors. The spec mandates that credentials in URLs are a security risk.

---

## Recommended Default

**Default:** `Authorization: Bearer` header
**Reason:** Follows HTTP authentication standards, avoids URL logging exposure, prevents referrer header leakage, and is compatible with standard HTTP client libraries.

---

## Risks Of Wrong Choice

URL parameter transmission: keys leaked through proxy logs, browser history, referrer headers, and server access logs. Potential compliance violations for audit requirements.

---

## Related Rules

- Generate With 256-Bit Entropy Minimum (from 05-rules.md)
- Hash With SHA-256, Never Store Plain Text (from 05-rules.md)

---

## Related Skills

- Implement API Key Pattern (from 06-skills.md)
- API-Specific Middleware (from 06-skills.md)
