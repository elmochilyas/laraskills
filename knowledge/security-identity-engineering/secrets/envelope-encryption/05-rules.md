# Rules: Envelope Encryption

## Use Envelope Encryption for Payloads > 1 KB
---
## Category
Architecture
---
## Rule
Implement envelope encryption for individual payloads exceeding approximately 1 KB. For smaller payloads, use the standard Laravel `Crypt` facade directly.
---
## Reason
The Laravel `Crypt` facade is convenient for small data but processes the entire payload with `APP_KEY`. Large payloads (documents, images, large JSON blobs) are more efficiently handled with envelope encryption: generate a random data encryption key (DEK), encrypt the payload with the DEK, and encrypt only the DEK with `Crypt::encrypt()`. This avoids performance bottlenecks and key management issues.
---
## Bad Example
```php
$encrypted = Crypt::encryptString($largeDocument); // Performance issue with large payloads
```
---
## Good Example
```php
$dek = random_bytes(32);
$iv = random_bytes(16);
$ciphertext = openssl_encrypt($plaintext, 'aes-256-cbc', $dek, 0, $iv);
$encryptedDek = Crypt::encrypt($dek); // Only the DEK uses Crypt
// Store $ciphertext, $iv, $encryptedDek together
```
---
## Exceptions
Payloads under 1 KB — standard Crypt usage is sufficient.
---
## Consequences Of Violation
Performance degradation with large encrypted payloads.
---

## Generate a New DEK for Each Encryption Operation
---
## Category
Security
---
## Rule
Generate a new random DEK using `random_bytes(32)` for every encryption operation. Never reuse a DEK across multiple payloads.
---
## Reason
If a DEK is reused across multiple payloads and one payload is compromised with the DEK, all payloads encrypted with that DEK are decryptable. Per-payload DEKs limit the blast radius — a compromised DEK exposes only one payload.
---
## Bad Example
```php
$dek = base64_decode(env('STATIC_DEK')); // Same DEK for all payloads
```
---
## Good Example
```php
$dek = random_bytes(32); // Unique per encryption
```
---
## Exceptions
No common exceptions — DEKs must be unique per encryption operation.
---
## Consequences Of Violation
Multiple payloads exposed if a reused DEK is compromised.
---

## Store DEK, IV, and Ciphertext Together as a Composite Object
---
## Category
Architecture
---
## Rule
Store the encrypted DEK, IV, and ciphertext together in a single database column or file. Use a JSON structure or a simple concatenation format.
---
## Reason
Each ciphertext requires its DEK (wrapped by the master key) and IV to decrypt. Storing these separately creates synchronization problems — the ciphertext may exist but the DEK may be lost. Storing them together ensures atomicity and simplifies decryption logic.
---
## Bad Example
```php
// DEK stored in a separate table — synchronization risk
DB::table('envelope_keys')->insert(['dek' => $encryptedDek]);
DB::table('documents')->insert(['ciphertext' => $ciphertext]);
```
---
## Good Example
```php
// All components stored together
$record = Document::create([
    'encrypted_data' => json_encode([
        'ciphertext' => base64_encode($ciphertext),
        'iv' => base64_encode($iv),
        'dek' => base64_encode($encryptedDek),
    ]),
]);
```
---
## Exceptions
No common exceptions — store encrypted components together for atomicity.
---
## Consequences Of Violation
Lost DEK or IV, permanently undecryptable data.
---

## Protect the Master Key (APP_KEY) Separately
---
## Category
Security
---
## Rule
Store the master key outside the application filesystem (secrets manager, environment variable). The master key is the most sensitive credential — it decrypts all DEKs.
---
## Reason
In envelope encryption, the master key protects all DEKs. If the master key is compromised, all encrypted data is compromised. Storing it in a secrets manager (Vault, AWS Secrets Manager) with access auditing and rotation is far more secure than a file in the application directory.
---
## Bad Example
```dotenv
APP_KEY=base64:... # Master key in .env file
```
---
## Good Example
```php
// Master key loaded from secrets manager
$masterKey = Vault::secret('encryption/master-key')->get();
config(['app.key' => $masterKey]);
```
---
## Exceptions
No common exceptions — master key requires the highest level of protection.
---
## Consequences Of Violation
All encrypted data compromised if master key is stolen.
---

## Use Authenticated Encryption (AES-GCM or AES-CBC + HMAC)
---
## Category
Security
---
## Rule
Use authenticated encryption modes (AES-256-GCM) for envelope encryption. If using AES-256-CBC, compute and append an HMAC-SHA256 tag.
---
## Reason
Unauthenticated encryption (AES-CBC without MAC) is vulnerable to padding oracle attacks. An attacker can modify the ciphertext and observe error responses to decrypt the data byte-by-byte. Authenticated encryption ensures both confidentiality and integrity.
---
## Bad Example
```php
$ciphertext = openssl_encrypt($plaintext, 'aes-256-cbc', $dek, 0, $iv);
// No MAC — vulnerable to padding oracle attack
```
---
## Good Example
```php
$ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $dek, 0, $iv, $tag);
// GCM provides authentication — no separate MAC needed
// Store $ciphertext, $iv, $tag together
```
---
## Exceptions
No common exceptions — authenticated encryption is required for all encrypted data.
---
## Consequences Of Violation
Padding oracle vulnerability, ciphertext malleability.
---

## Limit the Lifetime of DEKs in Memory
---
## Category
Security
---
## Rule
Unset the plaintext DEK from variables after use. Use `sodium_memzero()` or `sodium` operations when available.
---
## Reason
The DEK exists in plaintext in memory during encryption/decryption. If the application crashes or is dumped for debugging, the DEK may be visible in memory dumps. Clearing it after use reduces the window of exposure.
---
## Bad Example
```php
$dek = random_bytes(32);
// $dek remains in memory until function scope ends or garbage collection
```
---
## Good Example
```php
$dek = random_bytes(32);
// Use DEK for encryption/decryption
$ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $dek, 0, $iv, $tag);
// Clear from memory
sodium_memzero($dek);
```
---
## Exceptions
No common exceptions — minimizing DEK lifetime is a security best practice.
---
## Consequences Of Violation
DEK exposed in memory dumps or error backtraces.
