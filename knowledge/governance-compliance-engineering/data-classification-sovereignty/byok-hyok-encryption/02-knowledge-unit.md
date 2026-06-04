# BYOK / HYOK Encryption

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** data-classification-sovereignty
- **Knowledge Unit:** BYOK / HYOK Encryption
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

BYOK (Bring Your Own Key) and HYOK (Hold Your Own Key) encryption architectures give organizations sole control over encryption keys, ensuring that cloud providers cannot access encrypted data. For Laravel applications handling regulated data (financial, healthcare, government), BYOK/HYOK provides the highest level of data sovereignty and is often a compliance requirement for SOC 2, HIPAA, and GDPR.

---

## Core Concepts

- **BYOK (Bring Your Own Key):** Customer generates and imports their own encryption key into the provider's key management system (KMS). The provider can use the key for encryption operations but cannot export it.
- **HYOK (Hold Your Own Key):** Customer retains exclusive control of the key in their own HSM (Hardware Security Module). The provider never has access to the plaintext key; all encryption/decryption requires customer authorization.
- **Key hierarchy:** Data encrypted by data encryption keys (DEKs), which are encrypted by key encryption keys (KEKs), which are stored in the customer's HSM/KMS.
- **HSM (Hardware Security Module):** Tamper-resistant hardware that securely generates, stores, and manages cryptographic keys.
- **Key escrow:** Secure backup of keys to prevent data loss if primary keys are lost.
- **Key rotation:** Periodic replacement of encryption keys to limit cryptographic exposure.

---

## Mental Models

- **The Safe Deposit Box:** BYOK is like a bank safe deposit box. You bring your own lock (key) to secure your box in the bank's vault. The bank can't open your box without you. HYOK is like keeping your box at home — the bank has no access at all.
- **The Key Locker:** Your key encryption key (KEK) is the master key to a locker. Inside the locker are data encryption keys (DEKs) that actually encrypt your files. You control the master key; the system can use DEKs but can't get new ones without your master key.
- **The Envelope System:** Data is sealed in an envelope (encrypted with DEK). The envelope key is itself sealed in a box (encrypted with KEK). Only you have the box key (stored in your HSM).

---

## Internal Mechanics

BYOK: The customer generates a key in their HSM, exports it as a wrapped (encrypted) key, and imports it into the cloud KMS (AWS KMS, Azure Key Vault, GCP Cloud KMS). The cloud KMS unwraps and stores the key, making it available for encryption operations. The customer can audit key usage via cloud provider logs.

HYOK: The customer retains the key exclusively in their HSM. When the application needs to encrypt, it sends plaintext data to the customer's HSM service, which encrypts it and returns the ciphertext. Decryption follows the same pattern with a reverse flow. The cloud provider never sees the key.

In Laravel, encryption is typically handled via Laravel's custom encryption driver that delegates to the KMS/HSM API rather than using application-level keys.

---

## Patterns

**BYOK with Cloud KMS Pattern:** Generate key in on-premise HSM, import to AWS KMS/Azure Key Vault, use cloud KMS for encryption operations. Benefit: Cloud-native performance with customer-controlled key source. Tradeoff: Cloud provider still has access to use the key (though not export it).

**HYOK with External HSM Pattern:** Keep keys in customer-managed HSM; Laravel encrypts/decrypts via HSM API. Benefit: Maximum security — provider never has key access. Tradeoff: Encryption/decryption latency (HSM API calls), HSM operational overhead.

**Key Rotation Pattern:** Automatically rotate KEKs on schedule (annually, quarterly). Re-wrap DEKs under new KEKs without re-encrypting data. Benefit: Limits impact of key compromise. Tradeoff: Rotation requires careful orchestration to avoid data loss.

---

## Architectural Decisions

Choose BYOK when compliance requires customer-controlled key origin but cloud provider-managed encryption operations are acceptable. Choose HYOK when data sovereignty requires that the cloud provider never has access to unencrypted keys. Use HYOK only when the latency and operational overhead of external HSM calls are acceptable. Implement key escrow for disaster recovery — lost keys mean unrecoverable data. Design key rotation procedures that don't require re-encrypting all data.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete data sovereignty | HSM infrastructure and operational costs | 2-10x cost increase vs. cloud-managed encryption |
| BYOK: cloud-native encryption performance | Key import/export complexity | Additional 1-2ms per encryption operation |
| HYOK: provider never has key access | HSM API latency for each encryption | 10-100ms additional latency per encryption |
| Compliance with strict data sovereignty regulations | Key escrow and disaster recovery planning | Loss of keys means permanent data loss |
| Audit-ready key usage logs | Log analysis and monitoring overhead | Key usage monitoring infrastructure needed |

---

## Performance Considerations

HYOK encryption adds significant latency (10-100ms per operation) due to HSM API calls. Cache frequently encrypted values in application memory to reduce HSM calls. Batch encryption operations where possible. Consider using BYOK with envelope encryption — encrypt data locally with a cached DEK, only wrapping DEK with HYOK KEK. Network latency to HSM is a factor — co-locate HSM in the same region as the application. HSM throughput is limited — monitor usage and scale HSMs horizontally as needed.

---

## Production Considerations

Implement key usage monitoring and alerting for unusual patterns (possible key compromise). Test key rotation procedures in staging before applying to production. Establish a key escrow process — export wrapped keys to secure offline storage. Document disaster recovery procedures for key loss scenarios. Regularly audit key access logs. Implement key revocation procedures for compromise incidents. Ensure HSM is in a physically secure and environmentally controlled location.

---

## Common Mistakes

**Not testing key rotation** — untested rotation procedures fail during the actual rotation window. Test in staging annually.

**Storing keys in the same account/database as encrypted data** — defeats the purpose of BYOK/HYOK. Keys and encrypted data must be separate.

**No key escrow** — if the HSM fails and keys are lost, encrypted data is permanently inaccessible. Always maintain secure key backups.

**Underestimating latency impact** — HYOK adds noticeable latency to every encryption operation. Load test with realistic traffic patterns.

---

## Failure Modes

- **HSM failure:** Hardware malfunction prevents encryption/decryption. Implement HSM clustering for high availability. Fall back to read-only access to previously decrypted cached data.
- **Key compromise:** Unauthorized party gains access to KEK. Rotate compromised key immediately; re-encrypt all data under new key.
- **Key escrow loss:** Backup keys lost due to storage failure. Maintain redundant escrow in separate geographic locations.
- **Network partition between app and HSM:** Encryption/decryption unavailable. Implement graceful degradation with queued operations.

---

## Ecosystem Usage

Laravel applications implement BYOK/HYOK via custom encryption drivers. AWS KMS, Azure Key Vault, and GCP Cloud KMS provide BYOK support. For HYOK, services like Fortanix DSM, Thales CipherTrust, or on-premise HSMs (Gemalto, Utimaco) provide the key management infrastructure. Laravel's encryptable traits and custom casters can integrate with these services. The `laravel/vapor` environment supports KMS integration for BYOK scenarios.

---

## Related Knowledge Units

### Prerequisites
- Cryptography Fundamentals (symmetric/asymmetric encryption)
- Key Management Concepts (key hierarchy, wrapping, rotation)
- Cloud Provider KMS (AWS KMS, Azure Key Vault, GCP Cloud KMS)

### Related Topics
- Three-Tier Classification (which data needs BYOK/HYOK)
- Encryption at Rest patterns
- Data Sovereignty in Multi-Region Deployments

### Advanced Follow-up Topics
- Post-Quantum Cryptography Key Migration
- Confidential Computing with Enclaves
- Homomorphic Encryption for Regulated Data Processing

---

## Research Notes

BYOK/HYOK is primarily a compliance-driven architecture rather than a security improvement over cloud-managed keys. In both BYOK and cloud-managed models, the cloud provider has access to the key during encryption operations (except HYOK where the HSM is customer-exclusive). The distinction matters for data sovereignty regulations (some EU regulators require HYOK for certain data categories). The operational cost of HYOK is significant — organizations should evaluate whether BYOK satisfies their regulatory requirements before committing to HYOK infrastructure.
