# Encrypted Casts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Encrypted casts automatically encrypt attribute values when stored in the database and decrypt them on read, using Laravel's application encryption key (`APP_KEY`). The built-in variants — `encrypted`, `encrypted:array`, `encrypted:collection`, and `encrypted:object` — handle primitive values and JSON-serializable data transparently. Encryption is performed via Laravel's `Crypt` facade (AES-256-CBC or AES-256-GCM depending on configuration), ensuring data-at-rest protection for sensitive columns without application-level code changes.

## Core Concepts
- **`encrypted` cast:** Encrypts/decrypts a scalar value (string, integer, boolean) using the application cipher.
- **`encrypted:array` cast:** JSON-encodes the value to a string, then encrypts it on write. Decrypts and JSON-decodes on read, returning an array.
- **`encrypted:collection` cast:** Same as `encrypted:array` but returns a `Collection` instance on read.
- **`encrypted:object` cast:** Same as `encrypted:array` but returns a `stdClass` instance on read.
- **Application key dependency:** All encrypted casts depend on `APP_KEY` being set correctly. If the key changes, existing encrypted data cannot be decrypted.
- **No blind indexing:** Encrypted data is not searchable via `WHERE` clauses without special techniques (e.g., deterministic encryption or searchable hashes).
- **Column type:** Encrypted columns are typically `TEXT` or `BLOB` to accommodate the longer ciphertext.

## Mental Models
- **Transparent Encryption Tunnel:** Data passes through an encrypt-on-write, decrypt-on-read tunnel. The application works with plaintext; the database stores ciphertext.
- **Sealed Box:** The encrypted column is a sealed box — only the application with the correct `APP_KEY` can open it. Database administrators see only binary ciphertext.
- **Write-Only for Queries:** Encrypted columns cannot be used in `WHERE` clauses, `ORDER BY`, or `JOIN` conditions because the database cannot decrypt the values.

## Internal Mechanics
1. **Write path:** `Model::setAttribute()` → cast's `set()` method → `Crypt::encryptString($value)` (or `Crypt::encrypt(serialize($value))` for complex types) → stored as encrypted string in `$attributes`.
2. **Read path:** `Model::getAttribute()` → cast's `get()` method → `Crypt::decryptString($ciphertext)` → returns plaintext.
3. For `encrypted:array`, the value is first JSON-encoded before encryption (`Crypt::encrypt(json_encode($value))`) and JSON-decoded after decryption.
4. Laravel's `Crypt` uses the `encrypter` bound in the container (`\Illuminate\Encryption\Encrypter`), which reads `config('app.cipher')` and `config('app.key')`.
5. The default cipher is `AES-256-CBC` (Laravel 10+) or `AES-128-CBC` (older). The key is base64-decoded from `APP_KEY`.
6. Decryption failures throw `\Illuminate\Contracts\Encryption\DecryptException`.

## Patterns
- **PII Protection:** Cast PII columns (SSN, email, phone, address) as `encrypted` to meet GDPR/CCPA data-at-rest requirements.
- **Encrypted JSON for Preference Storage:** Use `encrypted:array` for user preferences that should not be readable in the database.
- **API Token Storage:** Store OAuth tokens, API keys, and secrets as `encrypted` to prevent credential leakage from database dumps.
- **Encrypted + Accessor for Masking:** Combine an `encrypted` cast with an accessor that masks the value (e.g., `****-****-****-1234` for credit card numbers) for display.

## Architectural Decisions
- **Decision:** Encrypt at the application layer, not the database layer.
  - **Rationale:** Database-level encryption (TDE) protects at rest but not from database administrators or backup leaks. Application-layer encryption ensures the database never sees plaintext.
- **Decision:** Use different encryption keys per model is not natively supported.
  - **Rationale:** Simplicity — all encrypted attributes share the application key. Per-model key management would complicate key rotation and storage.
- **Decision:** No built-in deterministic encryption for searchability.
  - **Rationale:** Deterministic encryption (same plaintext → same ciphertext) leaks patterns and weakens security. Laravel prioritizes security over queryability for encrypted data.
- **Decision:** Encrypted casts are one-way for queries.
  - **Rationale:** Simplicity and security. Searchable encryption (e.g., Blind Indexes) is left to packages or custom implementations.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Transparent encryption with zero application code changes | Unsearchable via WHERE/ORDER BY/JOIN | Must use non-encrypted columns for lookup; encrypt only sensitive data |
| AES-256-GCM provides authenticated encryption | ~2-5ms overhead per encrypt/decrypt operation | Benchmark before encrypting frequently accessed columns |
| Decryption failure is explicit (throws exception) | Key rotation requires re-encrypting all data | Implement a migration command for key rotation |
| Works with queue and serialization | Encrypted columns in serialized model data are double-encrypted | Normal — encrypted values remain encrypted in queues |

## Performance Considerations
- Each `Crypt::encryptString()` call takes ~1-3ms. A model with 5 encrypted attributes adds ~5-15ms to read/write operations.
- `encrypted:array`/`encrypted:collection` add JSON encoding/decoding overhead (~0.1ms) on top of encryption.
- Encryption overhead is CPU-bound. In Octane, the encrypter instance is reused, reducing object allocation overhead.
- For high-traffic endpoints reading encrypted columns, consider caching the decrypted values in Redis or using attribute caching (`shouldCache`). Note: the accessor would cache the decrypted value per model instance.
- Decryption is slower than encryption in most configurations due to authentication tag verification (GCM) or HMAC (CBC).

## Production Considerations
- **NEVER lose APP_KEY.** If `APP_KEY` changes, all encrypted data becomes permanently undecryptable. Back up `.env` or use a secrets manager.
- **Plan for key rotation.** Implement a command that reads all records, decrypts with old key, re-encrypts with new key. This requires downtime or a maintenance window.
- **Encrypted columns must be `TEXT` or `BLOB`.** Ciphertext is ~40% longer than plaintext. Ensure column types have sufficient capacity.
- **Encrypted data in logs/exceptions:** If an encrypted attribute is logged (e.g., via `context` in exception reporting), the ciphertext is logged, not the plaintext. This is acceptable, but plaintext should never appear in logs.
- **Encrypted data in database backups:** Backups contain ciphertext. This is the desired behavior — even if backup files leak, the data remains encrypted.
- **Testing with encrypted casts:** Use `Crypt::shouldReceive('encrypt')->andReturn('encrypted')` to mock encryption in tests.

## Common Mistakes
- **Encrypting primary keys or foreign keys:** Encrypted foreign keys make joins impossible. Never encrypt columns used in relationships or indexes.
- **Encrypting `created_at`/`updated_at`:** Timestamps lose meaning if encrypted. Only encrypt actual sensitive data.
- **Expecting to sort encrypted columns:** `ORDER BY encrypted_column` sorts by ciphertext, not plaintext. Sort in application memory after decryption.
- **Using `encrypted` cast on already-encrypted data:** Double-encrypting corrupts data. Ensure the cast is applied once.
- **Forgetting to update `$casts` after adding an encrypted column:** Uncast encrypted data appears as garbled ciphertext in PHP.
- **Encrypting too much data:** Every encrypted column adds query limitations and performance overhead. Encrypt only truly sensitive fields.

## Failure Modes
- **Decryption failure after key rotation:** If `APP_KEY` changes, `Crypt::decryptString()` throws `DecryptException`. Catch this in global exception handler and return a redacted value.
- **Data corruption from partial write:** If the encrypted string is truncated during database write, decryption fails with HMAC mismatch. Use atomic transactions to prevent partial writes.
- **Ciphertext too long for column:** If the plaintext exceeds the column's capacity after encryption overhead (typical overhead ~40-60 bytes), truncation occurs silently or throws. Ensure `TEXT` columns for all encrypted attributes.
- **PHP serialization mismatch:** `encrypted:array` uses `json_encode`/`json_decode`, not PHP serialization. Non-JSON-serializable values (e.g., `Carbon` instances, resources) fail. Serialize complex objects manually before storage.

## Ecosystem Usage
- **Laravel Nova:** Encrypted fields display as read-only masked values in Nova (Nova recognizes encrypted casts). Use a computed field to show decrypted values in a controlled view.
- **Laravel API Resources:** Encrypted attributes are decrypted during `toArray()`. Ensure API responses that include encrypted data have appropriate authentication.
- **Laravel LiveWire:** LiveWire's model hydration calls encrypted cast getters. The plaintext is sent to the browser — ensure the LiveWire component has proper authorization.
- **Laravel Passport / Sanctum:** Token storage uses encryption internally. The `encrypted` cast is not needed for Passport tokens; they are already encrypted.
- **Spatie / Laravel-Permission:** Role/permission models do not typically use encrypted casts, but user models with encrypted PII attributes are common.

## Related Knowledge Units

### Prerequisites
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — encrypted casts extend the same `$casts` mechanism with encryption pre/post-processing.
- [Laravel Encryption](../../../laravel-execution-lifecycle/application-bootstrap/encryption-configuration/02-knowledge-unit.md) — how `Crypt` and the encrypter are configured.

### Related Topics
- [Hashed Cast](../hashed-cast/02-knowledge-unit.md) — one-way hashing (not encryption) for passwords; distinct from two-way encryption.
- [Collection Casts](../collection-casts/02-knowledge-unit.md) — `AsEncryptedArrayObject`, `AsEncryptedCollection` provide collection-specific encryption.

### Advanced Follow-up Topics
- [Searchable Encryption Patterns](../../../laravel-core-application-engineering/security/searchable-encryption/02-knowledge-unit.md) — techniques for querying encrypted columns (Blind Indexes, deterministic encryption).
- [Key Rotation Strategies](../../../laravel-core-application-engineering/security/key-rotation/02-knowledge-unit.md) — rotating encryption keys without data loss.

## Research Notes
- `encrypted`, `encrypted:array`, `encrypted:collection`, `encrypted:object` are resolved to `\Illuminate\Database\Eloquent\Casts\AsEncryptedArrayObject`, `AsEncryptedCollection` and inline closures in `Model::resolveCaster()`.
- Laravel's encrypter uses `openssl_encrypt()` and `openssl_decrypt()` with HMAC-SHA256 for integrity checking (CBC mode) or GCM authentication tag.
- The `encrypted` cast does not support PHP 8.1's `readonly` property promotion for model attributes — casting is done at the Eloquent level, not the PHP property level.
- Future direction: Laravel may introduce key-per-model or key-per-column support, but as of 11.x, the single `APP_KEY` approach remains.
