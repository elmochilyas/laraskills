# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Envelope Encryption (DEK/KEK) with Sealcraft |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Emerging |

---

## Overview

Envelope encryption is a cryptographic pattern that wraps a Data Encryption Key (DEK) with a Key Encryption Key (KEK). The DEK encrypts the actual data (symmetric, fast). The KEK encrypts the DEK (asymmetric or KMS-based, slow). The encrypted DEK is stored alongside the encrypted data. To decrypt: decrypt the DEK using the KEK, then decrypt the data using the DEK. The `sealcraft` package (`crumbls/sealcraft`) implements this pattern for Laravel with support for AWS KMS, GCP Cloud KMS, Azure Key Vault, and HashiCorp Vault Transit as KEK providers. This enables key rotation at the DEK level without re-encrypting all data.

---

## Core Concepts

- **DEK (Data Encryption Key)**: Symmetric key that encrypts actual data. Generated per encryption operation (or per record). Fast (AES-256).
- **KEK (Key Encryption Key)**: Master key stored in a KMS. Encrypts DEKs. Slow but highly secure.
- **Encrypted DEK**: The DEK encrypted by the KEK, stored alongside the ciphertext. Without the KEK, the DEK is unrecoverable.
- **KMS Provider**: External service that holds the KEK — AWS KMS, GCP Cloud KMS, Azure Key Vault, HashiCorp Vault Transit.
- **DEK Rotation**: Generate a new DEK and re-encrypt data. The KEK remains the same — no KMS interaction needed for data re-encryption.
- **KEK Rotation**: Change the master key in the KMS. Requires re-wrapping all DEKs with the new KEK (but does NOT require re-encrypting all data).

---

## When To Use

- Large-scale encryption where RSA per-field decryption is too slow
- Cloud-native applications using KMS providers for key management
- Compliance requiring centralized key management (audit trail, key rotation policies)
- Applications needing efficient re-keying without re-encrypting all data

## When NOT To Use

- Simple column-level encryption with few sensitive fields (eloquent-encryption RSA is sufficient)
- Applications without KMS provider access (DEK/KEK without KMS adds complexity without benefit)
- When latency of KMS HTTP calls is unacceptable (cache DEKs with TTL)

---

## Best Practices

- **Cache DEKs in Memory**: KEK decryption requires a KMS HTTP call. Cache the plaintext DEK with TTL to avoid per-request KMS calls.
- **Separate DEK Per Record**: Each record (or encryption operation) gets its own DEK. Limits the impact of a DEK compromise to one record.
- **KEK Rotation**: Rotate KEK per KMS provider policy (typically yearly). DEK rotation can be on a different schedule (monthly or on-demand).
- **Audit KMS Usage**: Monitor KMS API calls for unexpected decryption requests — potential data breach indicator.
- **Regional KEK**: If using multi-region deployment, ensure KEK is accessible from all regions or use region-specific KEKs.

---

## Architecture Guidelines

- Install `crumbls/sealcraft` via Composer
- Configure KMS provider in `config/sealcraft.php`
- Define which fields are envelope-encrypted via custom casts
- Each encrypted field stores: `base64(ciphertext) || . || base64(encrypted_dek)`
- KEK is never stored in the application — only referenced by KMS key ID/alias

---

## Performance Considerations

- KEK decrypt: one KMS HTTP call per unique DEK — 10-100ms
- DEK encrypt (data): AES-256 — ~0.1ms per field
- DEK cache in memory: subsequent reads of same record skip KMS call
- Batch processing: decrypt DEK once, process many records
- KMS API rate limits: monitor and implement retry/backoff

---

## Security Considerations

- **KMS Access Control**: The KEK in KMS must have strict IAM policies — only the application's service role can use it.
- **DEK in Memory**: The plaintext DEK exists in application memory. Secure memory dumps, avoid logging.
- **KMS Audit Trail**: KMS provides an audit log of all key usage — monitor for unauthorized decryption requests.
- **KEK Deletion**: If the KEK is deleted from KMS, all data encrypted under it is permanently unrecoverable. Enable KMS key deletion recovery.
- **Region Lock**: If KEK is in a specific region, application in other regions cannot decrypt without cross-region KMS access.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not caching DEKs | KMS call per field per request | 100ms+ added to every encrypted field read | Cache DEK in memory with TTL |
| One DEK for all records | Simplicity | DEK compromise exposes all data | Per-record or per-batch DEK |
| No KMS fallback | KMS becomes single point of failure | Application outage when KMS is down | Cache DEKs to survive KMS downtime |
| KEK in wrong region | Regional deployment oversight | Cross-region latency or KMS access denied | Use multi-region KMS keys |
| Not auditing KMS usage | Missing security monitoring | Unauthorized decryption goes undetected | Monitor KMS API calls |

---

## Anti-Patterns

- **Storing KEK alongside application code**: The KEK belongs in KMS — never in the application repository
- **Per-request KMS calls without caching**: Guarantees latency and rate limit issues
- **Using envelope encryption for non-sensitive data**: Adds unnecessary complexity and latency

---

## Examples

**Sealcraft configuration:**
```php
// config/sealcraft.php
return [
    'default' => env('SEALCRAFT_PROVIDER', 'aws'),

    'providers' => [
        'aws' => [
            'key_id' => env('AWS_KMS_KEY_ID'),
            'region' => env('AWS_KMS_REGION', 'us-east-1'),
        ],
    ],
];
```

**Using envelope encryption:**
```php
// Model cast definition
protected $casts = [
    'encrypted_field' => 'envelope:encrypted',
];

// The field value is stored as:
// "base64(ciphertext).base64(encrypted_dek)"
```

---

## Related Topics

- Column-level RSA encryption (eloquent-encryption)
- Laravel Crypt facade (AES-256 symmetric encryption)
- Vault integration (Vault Transit)
- Key rotation

---

## AI Agent Notes

- Envelope encryption is emerging in the Laravel ecosystem. The `sealcraft` package is the primary implementation but has limited adoption.
- DEK caching is essential for performance — without it, every encrypted field read requires a KMS HTTP call.
- For projects already using AWS KMS, GCP Cloud KMS, or Azure Key Vault, Sealcraft provides native integration.

---

## Verification

- [ ] Sealcraft installed and configured with KMS provider
- [ ] KEK stored in KMS (not in application code or config)
- [ ] DEK caching implemented (not per-field KMS call)
- [ ] Per-record DEK strategy used (not one DEK for all)
- [ ] KMS IAM policies restricted to application service role
- [ ] KMS audit logging enabled and monitored
- [ ] KEK deletion recovery enabled (prevent permanent data loss)
- [ ] Multi-region KEK strategy documented (if multi-region deployment)
- [ ] KMS rate limit handling implemented (retry/backoff)
- [ ] Fallback plan for KMS downtime
