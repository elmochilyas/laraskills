# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Column-Level RSA Encryption (eloquent-encryption) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Column-level encryption encrypts specific database fields individually rather than encrypting the entire database. `eloquent-encryption` (`RichardStyles/EloquentEncryption`) uses RSA key pairs to encrypt and decrypt model attributes transparently. Each encrypted attribute is automatically encrypted when saved and decrypted when read. The public key encrypts data; the private key decrypts it. RSA key rotation requires decrypting all data with the old key and re-encrypting with the new key. An alternative: `sealcraft` (`crumbls/sealcraft`) implements envelope encryption (DEK/KEK pattern) with cloud KMS providers.

---

## Core Concepts

- **RSA Encryption**: Asymmetric encryption — public key encrypts, private key decrypts. Suitable for column-level encryption where read/write patterns are intermittent.
- **Transparent Encryption**: The trait encrypts/decrypts model attributes automatically. Application code reads/writes plaintext; the package handles crypto.
- **Attribute Casting**: Encrypted attributes are defined in the model's `$casts` array using a custom cast.
- **Key Rotation**: Old private key decrypts existing data; new public key encrypts new data. Re-encrypt existing data by cycling through all records.
- **Envelope Encryption (Sealcraft)**: DEK (Data Encryption Key) encrypts data; KEK (Key Encryption Key) encrypts the DEK. KEK is stored in KMS. DEK can be rotated independently.

---

## When To Use

- Storing PII (personally identifiable information) that requires encryption at rest
- Compliance requirements (HIPAA, GDPR, PCI DSS) for specific data fields
- Protecting sensitive data from database-level access (DBAs, backup exposure)
- Fields where application-layer encryption is required (not just storage encryption)

## When NOT To Use

- Entire database encryption (use TDE or filesystem-level encryption)
- High-throughput fields that are queried frequently (encryption prevents indexing, LIKE queries)
- Data that needs to be searchable or sortable (encrypted fields cannot be indexed for search)
- When Laravel's built-in `Crypt` facade (symmetric encryption) is sufficient

---

## Best Practices

- **Encrypt Only Sensitive Fields**: Not all fields need encryption. Encrypt selectively — each encrypted field adds overhead.
- **Store Keys Separately**: RSA private keys must be stored outside the database (file system, Vault, KMS). Database compromise should not expose keys.
- **Plan Key Rotation**: RSA key rotation requires re-encrypting all existing data. Have a process for online re-encryption (batch job, low-traffic window).
- **Avoid Encrypted Primary Keys**: Encrypted primary keys prevent indexing and joins. Use separate encrypted columns for sensitive data.
- **Test Performance**: Encrypt/decrypt operations add latency. Benchmark before deploying to production.

---

## Architecture Guidelines

- Install `eloquent-encryption` package, publish config and migration
- Add `EncryptedAttribute` trait to models
- Define encrypted attributes in model's `$casts`: `'ssn' => 'encrypted'`
- Store RSA private key in server file (restricted permissions), Vault, or environment variable
- Store public key in application code or config (public key is not secret)
- Key rotation: batch job reads all records, decrypts with old key, encrypts with new key

---

## Performance Considerations

- RSA decrypt: ~1-5ms per field (2048-bit key). Multiple encrypted fields compound the cost.
- Encrypt on write, decrypt on read — read-heavy workloads feel the overhead.
- Cannot index encrypted columns for equality or range queries.
- Search over encrypted data requires application-level decryption and matching — slow for large datasets.
- Consider deterministic encryption for searchable fields (less secure but searchable).

---

## Security Considerations

- **Key Separation**: The RSA private key is the root of all encrypted data. Store it separately from the database and application code.
- **Key Rotation**: When the private key is compromised, all data encrypted with the corresponding public key must be re-encrypted with a new key.
- **Backup Encryption**: Database backups contain encrypted data — the private key is required to decrypt. Ensure key backups are separate from database backups.
- **Timing Attacks**: RSA decryption time varies slightly with input — consider constant-time implementations for high-security contexts.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Encrypting all columns | Over-engineering | Performance degradation; cannot query | Encrypt only sensitive fields (PII, credentials) |
| Storing private key in database | Convenience | DB compromise exposes encryption key | Store key in file system (600 permissions) or Vault |
| Not planning key rotation | Assuming one-time setup | Cannot rotate key when compromised | Document rotation process; automate re-encryption |
| Encrypting indexed/searchable fields | Ignoring limitations | Queries on encrypted fields are slow or impossible | Use separate plaintext columns for search; encrypt for storage |

---

## Anti-Patterns

- **RSA for large data volumes**: RSA is slower than symmetric encryption. For many encrypted fields, use AES-256 (Laravel Crypt facade) or envelope encryption.
- **Encrypted primary/foreign keys**: Breaks relationships and indexing
- **No key backup**: Losing the private key means permanent data loss

---

## Examples

**Model with encrypted attributes:**
```php
use RichardStyles\EloquentEncryption\EncryptedAttribute;

class User extends Model
{
    use EncryptedAttribute;

    protected $casts = [
        'ssn' => 'encrypted',
        'tax_id' => 'encrypted',
    ];
}
```

**Usage:**
```php
// Encrypt on save
$user->ssn = '123-45-6789'; // Automatically encrypted
$user->save();

// Decrypt on read
echo $user->ssn; // Automatically decrypted
```

**Key configuration:**
```php
// config/eloquent-encryption.php
return [
    'public_key' => storage_path('encryption/public.pem'),
    'private_key' => storage_path('encryption/private.pem'),
    'passphrase' => env('ENCRYPTION_KEY_PASSPHRASE'),
];
```

---

## Related Topics

- Envelope encryption (DEK/KEK with Sealcraft)
- Laravel Crypt facade (AES-256 symmetric encryption)
- Vault integration (Vault Transit for encryption-as-a-service)
- Key rotation

---

## AI Agent Notes

- Column-level encryption is for specific sensitive fields — not a replacement for database TDE.
- The RSA key management is the most critical and most commonly misconfigured aspect. Always check key storage location.
- For high-throughput or searchable fields, consider alternative approaches (application-level encryption with searchable hashes, or dedicated encryption service).

---

## Verification

- [ ] Only sensitive fields marked as encrypted (not all fields)
- [ ] RSA private key stored outside database (file system, Vault, or KMS)
- [ ] Key permissions restricted (600 for private key file)
- [ ] Key rotation process documented and tested
- [ ] Encrypted fields not used in WHERE clauses or indexes
- [ ] Search strategy for encrypted fields documented
- [ ] Performance benchmarked with realistic data volume
- [ ] Key backup stored separately from database backup
- [ ] Re-encryption batch job prepared (for key rotation)
