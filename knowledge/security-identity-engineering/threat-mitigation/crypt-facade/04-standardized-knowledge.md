# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Laravel Crypt Facade (AES-256-CBC/GCM) |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Laravel's `Crypt` facade provides symmetric encryption using AES-256-CBC (default) or AES-256-GCM. The encryption key is the application's `APP_KEY`. `Crypt::encryptString()` encrypts a value; `Crypt::decryptString()` decrypts it. The facade handles initialization vector (IV) generation, message authentication (HMAC for CBC, built-in auth tag for GCM), and serialization (JSON). Encrypted values are safe for storage in databases, cookies, or URLs. Key rotation requires decrypting and re-encrypting all stored values.

---

## Core Concepts

- **AES-256-CBC**: Symmetric block cipher with Cipher Block Chaining mode. Requires HMAC for integrity (Laravel uses SHA-256 HMAC as an authenticated encryption wrapper).
- **AES-256-GCM**: Galois/Counter Mode — provides authenticated encryption (confidentiality + integrity) in a single operation. Available in newer PHP versions.
- **`Crypt::encryptString($value)`**: Encrypts a string. Returns a base64-encoded payload containing the ciphertext, IV, HMAC (CBC), and auth tag (GCM).
- **`Crypt::decryptString($payload)`**: Decrypts the payload. Throws `DecryptException` on failure (wrong key, tampered data, corrupted payload).
- **Serialization**: `Crypt::encrypt()` supports arrays and objects (JSON serialized before encryption). `Crypt::encryptString()` is for raw strings.
- **APP_KEY Dependency**: The encryption key is the application's `APP_KEY` from `.env`. Rotating `APP_KEY` invalidates all existing encrypted data.

---

## When To Use

- Encrypting data at rest in the database (session data, cookies, API tokens)
- Encrypting sensitive data in transit between services (queue payloads, signed URLs)
- Protecting stored credentials (service passwords, OAuth tokens)
- Any symmetric encryption need within the same application

## When NOT To Use

- Column-level encryption for individual model attributes (use eloquent-encryption or sealcraft for key separation)
- Data that needs to be shared across applications (different APP_KEY = different encryption)
- Large data volumes (encryption adds ~20% overhead to stored data)
- Data that needs to be searchable or indexable (encrypted data is opaque)

---

## Best Practices

- **Use `encryptString()` for Strings, `encrypt()` for Arrays/Objects**: Match the method to the data type. Avoid unnecessary serialization.
- **Store APP_KEY Securely**: The APP_KEY is the master encryption key. If compromised, all encrypted data is exposed. Rotate only with a plan.
- **Handle Decryption Failures**: Wrap decrypt calls in try-catch. `DecryptException` indicates tampered data or wrong key — log it.
- **GCM Over CBC**: When available, use AES-256-GCM for authenticated encryption without separate HMAC. Check PHP openssl support.

---

## Architecture Guidelines

- `Crypt::encryptString($value)` for raw strings stored in database columns
- `Crypt::encrypt($value)` for structured data (arrays, objects) — JSON serialized
- Encrypted values are safe for URLs (base64 encodes without URL-unsafe characters)
- Key rotation: decrypt all values with old key → re-encrypt with new key
- Cache key in memory after first use — don't read APP_KEY on every encrypt/decrypt

---

## Performance Considerations

- Encrypt/decrypt: ~0.1-2ms per operation depending on data size and algorithm
- AES-256-GCM is slightly faster than AES-256-CBC + HMAC
- Large payloads (1MB+) take proportionally longer — avoid encrypting large binary data
- No network overhead — all operations are local

---

## Security Considerations

- **APP_KEY is the Root of Trust**: All encryption security depends on APP_KEY secrecy. Store in environment variable, restrict file permissions.
- **Tamper Detection**: HMAC (CBC) or auth tag (GCM) detects tampering. `DecryptException` on tampered data.
- **Key Rotation Invalidates Everything**: Changing APP_KEY makes all existing encrypted data unreadable. Plan rotation windows carefully.
- **No Authentication Without Crypt**: The Crypt facade is for encryption+integrity. For hashing (one-way), use `Hash` facade.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using Crypt for one-way hashing | Confusing encryption with hashing | Data can be decrypted; not suitable for passwords | Use `Hash::make()` for passwords |
| Ignoring DecryptException | Assuming data is clean | Silent data corruption goes undetected | Catch exceptions; log decryption failures |
| Same APP_KEY across environments | Copying .env | Dev can decrypt production data | Generate unique APP_KEY per environment |
| Encrypting with CBC and assuming GCM | Mixing cipher modes | Backward compatibility issues if cipher changes | Use GCM when supported; document cipher choice |
| Storing encrypted data in VARCHAR without length | Default column too short | Payload truncated; data lost | Use TEXT or LONGTEXT for encrypted values |

---

## Anti-Patterns

- **Storing APP_KEY in version control**: Exposes the master encryption key
- **Using Crypt for file encryption**: Encrypted files are unwieldy — use file-level encryption tools
- **Encrypting data that doesn't need encryption**: Adds overhead without benefit
- **Rolling your own encryption with openssl**: Use the Crypt facade — it handles IV, HMAC, serialization correctly

---

## Examples

**Basic encryption:**
```php
use Illuminate\Support\Facades\Crypt;

// Encrypt
$encrypted = Crypt::encryptString('Sensitive value');
// eyJpdiI6Ik1RPT0iLCJ2YWx1ZSI6Ik5RPT0iLCJtYWMiOiJI...

// Decrypt
try {
    $decrypted = Crypt::decryptString($encrypted);
} catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
    // Handle tampered data or wrong key
}
```

**Encrypting structured data:**
```php
$userData = [
    'ssn' => '123-45-6789',
    'dob' => '1990-01-01',
];

$encrypted = Crypt::encrypt($userData);
// Store $encrypted in database

$decrypted = Crypt::decrypt($encrypted);
// ['ssn' => '123-45-6789', 'dob' => '1990-01-01']
```

**Custom cipher configuration:**
```php
// config/app.php
'cipher' => 'AES-256-GCM', // or 'AES-256-CBC'
```

---

## Related Topics

- .env management and APP_KEY
- Column-level RSA encryption (eloquent-encryption)
- Envelope encryption (DEK/KEK with Sealcraft)
- Hash facade (Bcrypt hashing)

---

## AI Agent Notes

- The Crypt facade is the primary symmetric encryption tool. Its security depends entirely on APP_KEY secrecy.
- For column-level model encryption, eloquent-encryption or sealcraft provide better key separation.
- Catch `DecryptException` on every decrypt call — uncaught exceptions can reveal internal state.

---

## Verification

- [ ] APP_KEY generated via `php artisan key:generate` (not manually created)
- [ ] Unique APP_KEY per environment
- [ ] `DecryptException` caught on all decrypt operations
- [ ] GCM cipher preferred over CBC when available
- [ ] Encrypted data stored in TEXT/LONGTEXT column (not VARCHAR without length)
- [ ] No sensitive data encrypted unnecessarily
- [ ] Key rotation plan documented (if needed)
- [ ] Crypt used for two-way encryption (not hashing passwords)
