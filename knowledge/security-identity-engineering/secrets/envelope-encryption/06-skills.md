# Skill: Implement Envelope Encryption (DEK/KEK) for Large Payload Encryption

## Purpose
Encrypt large payloads using envelope encryption with a Data Encryption Key (DEK) wrapped by a Key Encryption Key (KEK) stored in a KMS provider, enabling efficient key rotation without re-encrypting all data.

## When To Use
- Large-scale encryption where RSA per-field decryption is too slow
- Cloud-native applications using KMS providers (AWS KMS, GCP Cloud KMS, Azure Key Vault)
- Compliance requiring centralized key management
- Efficient re-keying without re-encrypting all data

## When NOT To Use
- Simple column-level encryption with few sensitive fields
- Applications without KMS provider access
- When latency of KMS HTTP calls is unacceptable (cache DEKs with TTL)

## Prerequisites
- `composer require crumbls/sealcraft`
- KMS provider configured (AWS KMS, GCP Cloud KMS, Azure Key Vault, or HashiCorp Vault Transit)
- KMS key ID or alias for the KEK

## Workflow
1. Install Sealcraft and configure KMS provider in `config/sealcraft.php`
2. Generate a new random DEK per encryption operation using `random_bytes(32)`
3. Encrypt payload with DEK using AES-256-GCM (authenticated encryption)
4. Encrypt DEK with KEK using the KMS provider
5. Store ciphertext, encrypted DEK, and IV together as a composite object
6. On read: decrypt DEK using KMS, then decrypt payload using DEK
7. Cache decrypted DEK in memory with TTL to avoid per-request KMS calls
8. For key rotation: rotate DEKs independently without KMS interaction; rotate KEK via KMS

## Validation Checklist
- [ ] Sealcraft installed and configured with KMS provider
- [ ] KEK stored in KMS (not in application code or config)
- [ ] DEK caching implemented (not per-field KMS call)
- [ ] Per-record DEK strategy used (not one DEK for all)
- [ ] KMS IAM policies restricted to application service role
- [ ] KMS audit logging enabled and monitored
- [ ] KEK deletion recovery enabled (prevent permanent data loss)
