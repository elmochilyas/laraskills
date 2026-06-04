# Skill: Encrypt and Decrypt Data Using Laravel's Crypt Facade

## Purpose
Use `Crypt::encrypt()` and `Crypt::decrypt()` for application-level encryption of sensitive data using AES-256 authenticated encryption via the `APP_KEY`.

## When To Use
- Encrypting sensitive strings before database storage (tokens, API keys, PII)
- Storing encrypted configuration values
- Protecting data at rest from database-level access
- Small payloads (under ~1 KB) requiring encryption

## When NOT To Use
- Large payloads (use envelope encryption with DEK/KEK)
- Entire database encryption (use TDE)
- Searchable encrypted data (encrypted fields cannot be indexed or queried with LIKE)
- When separate encryption keys per tenant are needed (use column-level encryption)

## Prerequisites
- Valid `APP_KEY` in `.env`
- `Crypt` facade available

## Workflow
1. Encrypt data: `$encrypted = Crypt::encryptString($plaintext)` for strings
2. Encrypt arrays: `$encrypted = Crypt::encrypt($arrayData)`
3. Decrypt: `$plaintext = Crypt::decryptString($encrypted)` or `Crypt::decrypt($encrypted)`
4. Store encrypted values in database — they are base64-encoded strings
5. Never decrypt in Blade templates (decrypt in controller/service layer)
6. Handle decryption failures: catch `DecryptException`
7. On `APP_KEY` rotation: decrypt all existing data with old key, re-encrypt with new key

## Validation Checklist
- [ ] `APP_KEY` is a secure 32-byte base64-encoded string
- [ ] Encrypted data stored as-is (no manual unserialization of encrypted payload)
- [ ] `DecryptException` handled when data cannot be decrypted
- [ ] Encrypted fields never used in WHERE clauses or indexes
- [ ] Key rotation plan documented if `APP_KEY` changes
