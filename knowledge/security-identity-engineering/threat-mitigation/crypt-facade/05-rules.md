# Rules: Crypt Facade Encryption

## Use Crypt::encryptString() for Short Strings, Crypt::encrypt() for Arrays
---
## Category
Architecture
---
## Rule
Use `Crypt::encryptString()` for string values and `Crypt::encrypt()` for arrays/objects. Never use `serialize()` or `json_encode()` before encryption.
---
## Reason
`Crypt::encryptString()` is optimized for string encryption. `Crypt::encrypt()` handles arrays and objects by serializing them internally. Manual serialization before encryption introduces unnecessary complexity and potential serialization vulnerabilities (PHP object injection if deserializing untrusted data).
---
## Bad Example
```php
$encrypted = Crypt::encrypt(serialize($data)); // Double serialization
```
---
## Good Example
```php
$encrypted = Crypt::encrypt($data); // Array or object — serializes internally
```
---
## Exceptions
No common exceptions — use the appropriate method for the data type.
---
## Consequences Of Violation
Unnecessary complexity, potential serialization issues.
---

## Store the Encrypted IV Alongside Ciphertext
---
## Category
Architecture
---
## Rule
Do not separately manage initialization vectors (IVs). `Crypt::encrypt()` and `Crypt::encryptString()` handle IV generation and storage automatically within the encrypted payload.
---
## Reason
The encryption IV must be unique per encryption operation and stored alongside the ciphertext. Laravel's Crypt facade encodes the IV, ciphertext, and MAC in a single base64-encoded string. Storing or managing IVs separately is unnecessary and error-prone.
---
## Bad Example
```php
$iv = random_bytes(16);
$encrypted = openssl_encrypt($data, 'aes-256-cbc', $key, 0, $iv);
DB::table('secrets')->insert(['data' => $encrypted, 'iv' => $iv]); // Manual IV management
```
---
## Good Example
```php
$encrypted = Crypt::encryptString($data);
DB::table('secrets')->insert(['data' => $encrypted]); // IV handled automatically
```
---
## Exceptions
No common exceptions — Laravel handles IVs automatically.
---
## Consequences Of Violation
Unnecessary IV management, potential IV reuse or loss.
---

## Never Use Crypt for Password Hashing
---
## Category
Security
---
## Rule
Use `Hash::make()` or `bcrypt()` for password hashing, never `Crypt::encrypt()` or `Crypt::encryptString()`.
---
## Reason
Encryption is reversible — the original value can be recovered with the key. Password hashing is one-way (bcrypt/argon2id). If an attacker gains the encryption key, they can decrypt all stored passwords. Passwords must never be encryptable; they must be hashed.
---
## Bad Example
```php
$user->password = Crypt::encryptString($request->password); // Reversible — can be decrypted
```
---
## Good Example
```php
$user->password = Hash::make($request->password); // One-way hash — cannot be reversed
```
---
## Exceptions
No common exceptions — passwords must always be hashed, never encrypted.
---
## Consequences Of Violation
Mass password compromise if encryption key is stolen.
---

## Set APP_KEY to a Secure 32-Byte Random String
---
## Category
Security
---
## Rule
Ensure `APP_KEY` is a base64-encoded 32-byte random string generated via `php artisan key:generate`. Never use a predictable or short key.
---
## Reason
`APP_KEY` is the encryption key for all Crypt operations. A predictable key (e.g., `base64:AAAAAAAAAAAAAAAAAAAAAA==`) means anyone can decrypt encrypted data. A 32-byte key provides 256-bit AES security. `key:generate` produces a cryptographically secure random key.
---
## Bad Example
```dotenv
APP_KEY=SomeRandomString # Too short, not random enough
```
---
## Good Example
```dotenv
APP_KEY=base64:AbCdEf1234567890AbCdEf1234567890AbCdEf1234567890AbCdEf12==
```
---
## Exceptions
No common exceptions — a secure APP_KEY is mandatory.
---
## Consequences Of Violation
All encrypted data is decryptable by anyone who knows the weak APP_KEY.
---

## Rotate APP_KEY Only Through a Migration Script
---
## Category
Security
---
## Rule
Never change `APP_KEY` without re-encrypting all existing encrypted data. Use a custom command that decrypts with the old key and re-encrypts with the new one.
---
## Reason
Changing `APP_KEY` without re-encrypting renders all existing encrypted data permanently undecryptable. The Crypt facade has no built-in key rotation support. A manual migration script that reads, decrypts, re-encrypts, and writes data is required.
---
## Bad Example
```bash
# Changed APP_KEY in .env — all encrypted data now unrecoverable
```
---
## Good Example
```php
// Artisan command for key rotation
$records = EncryptedModel::all();
foreach ($records as $record) {
    $decrypted = Crypt::decryptString($record->encrypted_field); // Uses old key
    // Update .env with new key, clear config
    $record->encrypted_field = Crypt::encryptString($decrypted); // Uses new key
    $record->save();
}
```
---
## Exceptions
No common exceptions — key rotation requires data migration.
---
## Consequences Of Violation
Permanent data loss — encrypted data cannot be decrypted.
---

## Use Crypt for Sensitive Data at Rest Only
---
## Category
Architecture
---
## Rule
Reserve `Crypt` encryption for sensitive data stored in the database (PII, API tokens, payment credentials). Do not encrypt non-sensitive data.
---
## Reason
Encryption adds computational overhead and complexity (key management, rotation, searchability). Applying encryption unnecessarily to non-sensitive data (user preferences, display names) wastes resources and complicates search and reporting.
---
## Bad Example
```php
$user->display_name = Crypt::encryptString($request->display_name); // Unnecessary — display names are public
```
---
## Good Example
```php
$user->ssn_last_four = Crypt::encryptString($request->ssn_last_four); // Sensitive — needs encryption
$user->display_name = $request->display_name; // Non-sensitive — no encryption
```
---
## Exceptions
No common exceptions — encrypt only data that requires encryption.
---
## Consequences Of Violation
Unnecessary complexity, reduced query performance, harder debugging.
---

## Use Envelope Encryption for Large Payloads
---
## Category
Architecture
---
## Rule
For data exceeding the Crypt facade's practical payload limit (~several KB), implement envelope encryption: generate a random DEK, encrypt the payload with the DEK using `openssl_encrypt`, encrypt the DEK with `Crypt::encrypt()`, and store both.
---
## Reason
The Crypt facade is optimized for relatively small payloads (strings, arrays). Very large payloads (files, large JSON blobs) may hit serialization limits and are better handled with envelope encryption, where only the DEK is encrypted with the APP_KEY.
---
## Bad Example
```php
$encrypted = Crypt::encryptString($largeFileContent); // May hit serialization limits
```
---
## Good Example
```php
$dek = random_bytes(32);
$ciphertext = openssl_encrypt($plaintext, 'aes-256-cbc', $dek, 0, $iv);
$encryptedDek = Crypt::encrypt($dek); // Only the DEK uses Crypt
// Store $ciphertext, $iv, and $encryptedDek
```
---
## Exceptions
Small payloads (< 1 KB) — standard Crypt usage is sufficient.
---
## Consequences Of Violation
Serialization errors, performance issues with large payloads.
