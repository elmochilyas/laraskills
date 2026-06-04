# Skill: Encrypt Database Columns Transparently with eloquent-encryption

## Purpose
Apply column-level RSA encryption to specific model attributes using `eloquent-encryption` for transparent encrypt-on-save and decrypt-on-read of sensitive fields like PII.

## When To Use
- Storing PII (personally identifiable information) requiring encryption at rest
- Compliance requirements (HIPAA, GDPR, PCI DSS) for specific data fields
- Protecting sensitive data from database-level access (DBAs, backup exposure)
- Fields where application-layer encryption is needed beyond storage encryption

## When NOT To Use
- Entire database encryption (use TDE or filesystem-level encryption)
- High-throughput fields queried frequently (encryption prevents indexing, LIKE)
- Large payloads (use envelope encryption with DEK/KEK instead)
- Searchable encrypted data (encrypted fields cannot be indexed)

## Prerequisites
- `composer require richardstyles/eloquent-encryption` (or similar)
- RSA key pair generated (public + private)
- Key storage strategy (filesystem, KMS, secrets manager)

## Workflow
1. Install eloquent-encryption and publish config
2. Generate RSA key pair (public for encryption, private for decryption)
3. Store keys securely — never in version control
4. Add `Encryptable` trait to model
5. Define encrypted attributes in model's `$encryptable` array
6. Encrypted attributes are automatically encrypted on save, decrypted on read
7. For key rotation: decrypt all records with old private key, re-encrypt with new public key
8. Never query or index encrypted columns in WHERE clauses

## Validation Checklist
- [ ] RSA keys generated and stored securely (not in version control)
- [ ] `Encryptable` trait added to models with sensitive fields
- [ ] Encrypted attributes listed in `$encryptable` array
- [ ] Encrypted columns not used in WHERE or LIKE queries
- [ ] Key rotation procedure documented
- [ ] Private key access restricted to application only
