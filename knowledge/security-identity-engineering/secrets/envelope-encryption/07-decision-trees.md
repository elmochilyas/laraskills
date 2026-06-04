# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Envelope Encryption (DEK/KEK) with Sealcraft
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Envelope vs Symmetric vs Asymmetric | Encryption pattern for large payloads | architectural, performance |
| 2 | KMS Provider Selection | Cloud KMS provider choice | operational, vendor |
| 3 | DEK Rotation Strategy | How often to rotate data encryption keys | security, operational |

---

# Architecture-Level Decision Trees

---

## Envelope vs Symmetric vs Asymmetric

---

## Decision Context

Choosing between envelope encryption (DEK/KEK with KMS), symmetric encryption (Crypt facade), or asymmetric encryption (eloquent-encryption RSA) for encrypted data.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

What is the payload size?
↓
Large (> 1 KB, documents, JSON blobs) → Envelope encryption (DEK encrypts data, KEK encrypts DEK)
Small (< 1 KB, single fields) → Symmetric (Crypt facade) or Asymmetric (RSA for column-level)

Is key rotation without data re-encryption required?
↓
YES → Envelope encryption (rotate KEK, re-wrap DEKs — no data re-encryption)
NO → Symmetric or Asymmetric (data must be decrypted/re-encrypted on key rotation)

Is a cloud KMS provider available (AWS KMS, GCP Cloud KMS, Azure Key Vault)?
↓
YES → Envelope encryption (leverage KMS for KEK management)
NO → Evaluate: without KMS, envelope encryption adds complexity without the key management benefit

What is the throughput requirement?
↓
High (100+ encrypted reads/sec) → Symmetric (Crypt facade) or envelope with DEK caching
Low (< 10 encrypted reads/sec) → Any approach acceptable

Is centralized key management and audit required?
↓
YES → Envelope encryption with KMS (audit trail for KEK usage)
NO → Symmetric or Asymmetric (simpler)

---

## Rationale

Envelope encryption is the most flexible pattern — it supports large payloads, efficient key rotation (rotate KEK without re-encrypting data), and centralized KMS key management. However, it requires a KMS provider and DEK caching for performance. Symmetric encryption (Crypt facade) is simpler and faster for small payloads. Asymmetric (RSA) is for column-level encryption where key separation is needed.

---

## Recommended Default

**Default:** Crypt facade (symmetric AES-256) for small payloads; envelope encryption for payloads > 1 KB or when frequent key rotation without data re-encryption is required
**Reason:** The Crypt facade is simpler and faster for typical encrypted data (tokens, PII strings). Envelope encryption adds KMS dependency, DEK caching, and composite storage complexity — only justified when payload size or rotation requirements demand it.

---

## Risks Of Wrong Choice

- Envelope encryption for small fields: unnecessary complexity, KMS latency per field
- Crypt facade for large payloads: performance bottleneck, serialization limits
- RSA for high-throughput fields: slow decrypt (1-5ms per field)
- No encryption at all: plaintext exposure

---

## Related Rules

- Use Envelope Encryption for Payloads > 1 KB (05-rules.md)
- Generate a New DEK for Each Encryption Operation (05-rules.md)
- Store DEK, IV, and Ciphertext Together as a Composite Object (05-rules.md)

---

## Related Skills

- Implement Envelope Encryption (DEK/KEK) for Large Payload Encryption (06-skills.md)

---

## KMS Provider Selection

---

## Decision Context

Choosing the cloud KMS provider for the KEK — AWS KMS, GCP Cloud KMS, Azure Key Vault, or HashiCorp Vault Transit.

---

## Decision Criteria

* operational
* vendor

---

## Decision Tree

Which cloud provider is the application deployed on?
↓
AWS → AWS KMS (native integration, IAM policies, CloudTrail audit)
GCP → GCP Cloud KMS (native integration, IAM, Cloud Audit Logs)
Azure → Azure Key Vault (native integration, RBAC, diagnostic logs)
Multi-cloud or on-prem → HashiCorp Vault Transit (provider-agnostic)

Is there an existing KMS in use?
↓
YES → Use existing KMS (consistent key management, avoid multi-provider complexity)
NO → Use the deployment cloud's native KMS (best integration)

Are there compliance requirements for key storage location?
↓
YES → Verify KMS provider supports the required region/compliance (AWS GovCloud, Azure Government, etc.)
NO → Use the deployment region's KMS

What is the budget for KMS operations?
↓
Low → Consider KMS cost per operation (HashiCorp Vault may be cheaper for high volume)
Flexible → Cloud KMS (AWS/GCP/Azure — pay per operation)

Is there an existing HashiCorp Vault deployment?
↓
YES → Vault Transit (use existing infrastructure, consistent auth)
NO → Cloud KMS (less operational overhead)

---

## Rationale

The KMS provider should match the deployment cloud for best integration (IAM, audit, cost). AWS KMS is the most mature with the broadest feature set. GCP Cloud KMS is strong for GCP-native apps. Azure Key Vault integrates well with Azure AD. HashiCorp Vault Transit is the best multi-cloud/on-prem option. Existing KMS infrastructure should be preferred to avoid multi-provider complexity.

---

## Recommended Default

**Default:** Cloud provider's native KMS (AWS KMS for AWS, GCP Cloud KMS for GCP, Azure Key Vault for Azure); HashiCorp Vault Transit for multi-cloud or on-prem
**Reason:** Native KMS provides the best IAM integration, audit logging, and latency. HashiCorp Vault is ideal when Vault is already deployed or when cloud-agnostic key management is needed.

---

## Risks Of Wrong Choice

- Cross-region KMS: latency and potential access denied errors
- KMS without IAM restrictions: any service can decrypt (broad blast radius)
- No KMS key deletion recovery: accidental deletion = permanent data loss
- KMS rate limits without backoff: application failures under load

---

## Related Rules

- Protect the Master Key (APP_KEY) Separately (05-rules.md)
- Use Authenticated Encryption (AES-GCM or AES-CBC + HMAC) (05-rules.md)

---

## Related Skills

- Implement Envelope Encryption (DEK/KEK) for Large Payload Encryption (06-skills.md)

---

## DEK Rotation Strategy

---

## Decision Context

How often to rotate Data Encryption Keys and whether to re-encrypt data.

---

## Decision Criteria

* security
* operational

---

## Decision Tree

Is the KEK being rotated (compliance requirement)?
↓
YES → Re-wrap all DEKs with new KEK (no data re-encryption needed)
NO → Evaluate DEK rotation frequency

Is there a compliance requirement for DEK rotation?
↓
YES → Rotate DEKs monthly (or per compliance requirement), re-encrypt data
NO → Rotate DEKs annually or on-demand (compromise)

Is per-record DEK used?
↓
YES → Rotating DEK: generate new DEK, re-encrypt that record only (simple)
NO → One DEK for all records: rotation requires re-encrypting all data (costly)

Was there a security incident or key compromise?
↓
YES → Immediate DEK rotation for all affected records
NO → Scheduled rotation

What is the data volume?
↓
Low (thousands of records) → Full re-encryption feasible for each rotation
High (millions of records) → Per-record DEK with lazy rotation (re-encrypt on next write)

---

## Rationale

DEK rotation frequency balances security (more frequent = less data exposed if compromised) with operational cost (re-encrypting data). Per-record DEKs make rotation much cheaper — only the affected record needs re-encryption. The big advantage of envelope encryption is that KEK rotation (the most common compliance requirement) requires only re-wrapping DEKs, not re-encrypting data.

---

## Recommended Default

**Default:** Per-record DEKs; rotate DEKs annually (or on compromise); re-wrap DEKs on KEK rotation (no data re-encryption)
**Reason:** Per-record DEKs minimize the blast radius of a DEK compromise. Annual DEK rotation is a reasonable security baseline. KEK rotation is the primary compliance control and is inexpensive with envelope encryption (re-wrap only).

---

## Risks Of Wrong Choice

- One DEK for all records: compromise exposes all data, rotation requires full re-encryption
- Never rotating DEKs: compromised DEK gives permanent access
- Rotating DEKs too frequently: operational overhead, performance impact
- Re-encrypting data for KEK rotation: unnecessary (re-wrap DEKs instead)

---

## Related Rules

- Generate a New DEK for Each Encryption Operation (05-rules.md)
- Limit the Lifetime of DEKs in Memory (05-rules.md)

---

## Related Skills

- Implement Envelope Encryption (DEK/KEK) for Large Payload Encryption (06-skills.md)
