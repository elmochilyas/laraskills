# Anti-Patterns: Envelope Encryption (DEK/KEK) with Sealcraft

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Envelope Encryption (DEK/KEK) with Sealcraft |
| Audience | Architects, Senior Developers, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SV-01 | Per-Request KMS Calls Without DEK Caching | Critical | High | Low |
| AP-SV-02 | Single DEK for All Records | High | Medium | High |
| AP-SV-03 | KEK Stored Alongside Application Code | Critical | Medium | Low |
| AP-SV-04 | Unauthenticated Encryption (AES-CBC Without MAC) | Critical | Low | Medium |
| AP-SV-05 | Envelope Encryption for Small Non-Sensitive Fields | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **No KMS Fallback Strategy**: Application crashes when KMS is unreachable — no DEK cache fallback
- **No KMS Audit Monitoring**: KMS decryption requests not monitored — unauthorized access goes undetected
- **Regional KEK Lock-In**: Multi-region deployment with single-region KEK — cross-region latency and access errors

---

## 1. Per-Request KMS Calls Without DEK Caching

### Category
Performance · Security

### Description
Making a KMS HTTP round-trip on every encrypted field read instead of caching the decrypted DEK in memory with a TTL, causing 50-100ms added latency per request and KMS rate limiting.

### Why It Happens
Developers implement envelope encryption by calling the KMS decrypt API directly in the model accessor or cast. The package documentation shows the basic encrypt/decrypt flow without emphasizing caching. Teams deploy to production and discover the latency only under load. The KMS call feels like part of "doing encryption" — not an optimization that can be deferred.

### Warning Signs
- Response time for any request involving encrypted data is 100ms+ higher than expected
- KMS API costs are unexpectedly high (linear with request count)
- Application hits KMS rate limits during traffic spikes
- Model accessor or cast contains inline KMS decrypt call without cache check

### Why Harmful
Each KMS HTTP call takes 10-100ms — this latency is added to every request that reads encrypted data. For list endpoints returning 20 encrypted records, this means 2+ seconds of KMS latency. KMS also has rate limits; sustained high call volume triggers throttling, causing application errors. The cost of KMS operations scales linearly with traffic, making this pattern expensive at scale. Caching the DEK reduces this to a single KMS call per TTL period.

### Real-World Consequences
- API endpoint retrieving 50 encrypted records takes 5+ seconds (50 KMS calls × 100ms)
- Production incident: KMS rate limit reached, all encrypted data reads fail with 503 errors
- Monthly KMS bill is unexpectedly high (thousands of dollars for decrypt operations)
- Load test fails because KMS cannot scale with application traffic

### Preferred Alternative
Cache decrypted DEKs in memory with a TTL matching the KMS key's rotation policy:
```php
$dek = cache()->remember('dek:' . $recordIdentifier, 3600, function () use ($kms, $encryptedDek) {
    return $kms->decrypt($encryptedDek); // One KMS call per cache period
});
$plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $dek, 0, $iv, $tag);
```

### Refactoring Strategy
1. Identify all code paths that call KMS decrypt per encrypted field read
2. Extract KMS decrypt into a cached repository layer
3. Configure cache TTL based on DEK rotation schedule (default: 1 hour)
4. Implement cache warming for frequently accessed records
5. Add KMS call count monitoring to verify reduction

### Detection Checklist
- [ ] Search for KMS API calls in model casts, accessors, and services
- [ ] Count KMS decrypt calls per typical API request vs encrypted fields
- [ ] Check KMS CloudWatch/CloudLogs for decrypt operation count vs traffic
- [ ] Review response time percentiles — is encrypted data access correlated with latency spikes?

### Related Rules/Skills/Trees
- Protect the Master Key (APP_KEY) Separately (05-rules.md)
- Limit the Lifetime of DEKs in Memory (05-rules.md)
- Implement Envelope Encryption for Large Payload Encryption (06-skills.md)

---

## 2. Single DEK for All Records

### Category
Security · Architecture

### Description
Using one Data Encryption Key (DEK) to encrypt all records instead of generating a unique DEK per record or per encryption operation, creating a single point of compromise for the entire dataset.

### Why It Happens
Generating a new DEK per record adds storage overhead (each record must store its encrypted DEK) and complexity to the encryption flow. Teams optimize for simplicity: one DEK stored in a config file or environment variable, used for all encryption operations. The security benefit of per-record DEKs is not immediately visible in development.

### Warning Signs
- All encrypted records use the same encrypted DEK (same base64 string in the composite storage)
- DEK stored in a single configuration value (`.env`, config file) rather than per-record
- Compromising one record's DEK decrypts all records
- Key rotation requires re-encrypting the entire dataset because one DEK covers everything

### Why Harmful
If the single DEK is compromised (memory dump, side-channel attack, insider threat), every encrypted record in the database is decryptable. The blast radius is the entire dataset. Per-record DEKs limit the impact to a single record. Additionally, rotating keys with a single DEK requires re-encrypting every record — a costly full-table scan. With per-record DEKs, only the compromised record's DEK needs rotation.

### Real-World Consequences
- Server memory dump compromised — single DEK gives attacker access to all encrypted data
- Compliance audit identifies single-DEK pattern as a finding: "insufficient key diversification"
- After security incident, team must re-encrypt the entire 10M-record database (days of processing)
- CISO requires immediate remediation — emergency project to implement per-record DEKs

### Preferred Alternative
Generate a unique DEK for each encryption operation and store it alongside the ciphertext:
```php
// Encrypt
$dek = random_bytes(32); // Unique per record
$ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $dek, 0, $iv, $tag);
$encryptedDek = Crypt::encryptString($dek); // Wrap with master key
// Store ciphertext, iv, tag, encryptedDek together

// Decrypt: retrieve encryptedDek from composite storage, unwrap, decrypt
```

### Refactoring Strategy
1. Generate a new per-record DEK for each existing record
2. Re-encrypt each record with its new DEK
3. Store the encrypted DEK in the composite field alongside the ciphertext
4. Implement lazy migration: on read, if record uses old single DEK, re-encrypt on write
5. Delete the shared DEK from config after full migration

### Detection Checklist
- [ ] Check storage format: do all encrypted records share the same encrypted DEK value?
- [ ] Search config files for a `DEK` or `DATA_ENCRYPTION_KEY` environment variable
- [ ] Can decrypting one record's DEK decrypt all records?
- [ ] Review key rotation script — does it rotate one key for all data?

### Related Rules/Skills/Trees
- Generate a New DEK for Each Encryption Operation (05-rules.md)
- Store DEK, IV, and Ciphertext Together as a Composite Object (05-rules.md)
- DEK Rotation Strategy decision tree (07-decision-trees.md)

---

## 3. KEK Stored Alongside Application Code

### Category
Security · Critical

### Description
Storing the Key Encryption Key (KEK) or the KEK's access credentials in the application repository, configuration files, or `.env`, rather than in the KMS provider.

### Why It Happens
During development, the KEK is often referenced by key ID in a config file, and the KMS credentials (AWS access key, Vault token) are stored in `.env` alongside other config. Developers do not distinguish between the KEK (the root encryption key) and other configuration values. The convenience of "everything in `.env`" overrides security architecture.

### Warning Signs
- KMS key ID or alias stored in a config file or `.env`
- KMS access credentials (AWS_ACCESS_KEY_ID, VAULT_TOKEN) in `.env` that can call KMS decrypt
- No IAM policy separation — the application's credentials have KMS decrypt permission
- Checking Vault for the KEK returns "not found" — it is in the application codebase

### Why Harmful
The KEK is the root of trust for all encrypted data. If an attacker gains access to the KEK or the credentials that can unwrap DEKs, they can decrypt the entire dataset. Storing KEK credentials in `.env` means that any server breach, any CI/CD compromise, or any developer laptop theft exposes the master key. The entire security model of KMS — centralized, audited, access-controlled key management — is bypassed.

### Real-World Consequences
- Server compromise: attacker reads `.env`, finds KMS credentials, decrypts all DEKs, exfiltrates all data
- CI/CD pipeline compromised: attacker accesses KMS credentials from build environment, decrypts production data
- Developer laptop stolen: `.env` with KMS credentials gives attacker access to production encrypted data
- Compliance audit: "KEK credentials stored in plaintext config file — critical finding"

### Preferred Alternative
The KEK exists only in the KMS. The application has a limited IAM role that can call `kms:Decrypt` only with specific key ARNs, and the credentials for that role are provisioned via instance profile or Kubernetes service account (not stored in `.env`):
```php
// Correct: Application has IAM role, calls KMS by key ID
// KEK credentials are NOT in .env — provided by instance profile
$result = $kmsClient->decrypt([
    'CiphertextBlob' => $encryptedDek,
    'KeyId' => env('KMS_KEY_ID'), // Key ID only (identifier, not credential)
]);
```

### Refactoring Strategy
1. Remove KMS credentials from `.env` and application config
2. Configure IAM instance profile or Kubernetes service account for KMS access
3. Restrict the IAM policy to only the specific KMS key ARN needed
4. Enable KMS key deletion recovery (prevent accidental permanent data loss)
5. Audit KMS usage to verify no unauthorized decrypt calls

### Detection Checklist
- [ ] Search `.env` and config files for `AWS_ACCESS_KEY_ID`, `VAULT_TOKEN`, or any credential with KMS access
- [ ] Check IAM policy for the application's service role — can it call `kms:Decrypt`?
- [ ] Verify the KEK is stored in KMS, not in application code
- [ ] Can a developer decrypt production data with their local credentials?

### Related Rules/Skills/Trees
- Protect the Master Key (APP_KEY) Separately (05-rules.md)
- Use Authenticated Encryption (AES-GCM or AES-CBC + HMAC) (05-rules.md)
- KMS Provider Selection decision tree (07-decision-trees.md)

---

## 4. Unauthenticated Encryption (AES-CBC Without MAC)

### Category
Security · Critical

### Description
Using AES-CBC encryption mode without a Message Authentication Code (MAC), leaving encrypted data vulnerable to padding oracle attacks.

### Why It Happens
AES-CBC is the default mode in many PHP encryption functions (`openssl_encrypt` defaults). Developers copy example code from blog posts or documentation that use AES-CBC without mentioning the need for authentication. The padding oracle vulnerability is not widely understood among application developers. If the application exposes any behavior that differs between valid and invalid padding (error message, response time), the entire ciphertext is decryptable.

### Warning Signs
- Encryption code uses `'aes-256-cbc'` as the cipher method without a separate HMAC
- No authentication tag stored alongside ciphertext and IV
- Application returns different errors for "decryption failed" vs "invalid padding"
- Custom encryption implementation without a MAC verification step

### Why Harmful
Padding oracle attacks allow an attacker to decrypt any ciphertext by sending modified ciphertexts and observing error responses. The attack requires only network access to the application — no key compromise needed. AES-CBC without authentication is considered fundamentally broken for any security-sensitive context. Authenticated encryption (AES-GCM or AES-CBC + HMAC) prevents these attacks by verifying ciphertext integrity before decryption.

### Real-World Consequences
- Penetration test discovers padding oracle vulnerability — all encrypted data decryptable by attacker
- CVE filed against the application — mandatory patch required
- Compliance auditor flags AES-CBC without MAC as a critical finding
- Year-long effort to re-encrypt all data with authenticated mode

### Preferred Alternative
Use AES-256-GCM (authenticated encryption) which provides both confidentiality and integrity:
```php
// Encrypt
$ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $dek, 0, $iv, $tag);
// Store $ciphertext, $iv, $tag together

// Decrypt
$plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $dek, 0, $iv, $tag);
// GCM automatically verifies integrity — fails if ciphertext is modified
```

### Refactoring Strategy
1. Switch from AES-CBC to AES-256-GCM in all encryption code
2. Update composite storage to include the GCM authentication tag
3. Re-encrypt all existing data with the new authenticated mode
4. Verify decryption fails when ciphertext is tampered with (test)
5. Remove any AES-CBC fallback code after full migration

### Detection Checklist
- [ ] Search for `'aes-256-cbc'` in encryption-related code
- [ ] Check stored ciphertext format — is there an authentication tag?
- [ ] Test: modify a ciphertext byte, does decryption fail gracefully?
- [ ] Verify `openssl_decrypt` return value is strictly compared to `false`

### Related Rules/Skills/Trees
- Use Authenticated Encryption (AES-GCM or AES-CBC + HMAC) (05-rules.md)
- Store DEK, IV, and Ciphertext Together as a Composite Object (05-rules.md)
- Envelope vs Symmetric vs Asymmetric decision tree (07-decision-trees.md)

---

## 5. Envelope Encryption for Small Non-Sensitive Fields

### Category
Architecture · Maintainability

### Description
Using envelope encryption (DEK/KEK with KMS) for small, non-sensitive fields where a simple `encrypted` cast or no encryption at all is appropriate, adding unnecessary complexity, latency, and cost.

### Why It Happens
Envelope encryption sounds more sophisticated and secure. Teams adopt it as a blanket encryption strategy without evaluating the sensitivity or size of the data being encrypted. The availability of a KMS provider makes it easy to enable for all fields. The operational cost and complexity are underestimated until the application is in production under real traffic.

### Warning Signs
- Envelope encryption used for fields under 1 KB (single values, short strings)
- Non-sensitive fields (preferences, UI settings) encrypted with envelope encryption
- Simple CRUD endpoints have KMS dependencies for basic field reads
- Application cannot start without KMS connectivity, even for non-critical features

### Why Harmful
Envelope encryption introduces KMS dependency, DEK caching complexity, composite storage overhead, and 10-100ms latency per unique DEK decrypt. For small, non-sensitive fields, this is entirely unnecessary. A simple `encrypted` cast uses the local APP_KEY with sub-millisecond decrypt time and no external dependencies. The KMS cost scales with every encrypted field read, even for data that has no compliance requirement for encryption.

### Real-World Consequences
- Every user profile page requires a KMS call — application is fragile and slow
- KMS costs \$500+/month for encrypting fields that could use zero-cost AES locally
- Application unavailable during KMS outage, even for non-critical features
- New developer must understand envelope encryption to add a simple preference field

### Preferred Alternative
Use envelope encryption only for payloads > 1 KB or where frequent key rotation without data re-encryption is required. For small fields, use Laravel's `encrypted` cast:
```php
// Small fields: use simple encrypted cast
protected $casts = [
    'preferred_language' => 'encrypted', // Small field, simple encryption
];

// Large payloads: use envelope encryption
// $documentData = envelopeEncrypt($largeBlob, $kms);
```

### Refactoring Strategy
1. Audit all envelope-encrypted fields by size and sensitivity
2. Migrate small non-sensitive fields to `encrypted` cast or plaintext
3. Keep envelope encryption only for large payloads (documents, JSON blobs > 1 KB)
4. Remove KMS dependency from features that no longer need it
5. Update deployment to make KMS optional for non-critical paths

### Detection Checklist
- [ ] List all envelope-encrypted fields — note their data type and typical size
- [ ] Are any encrypted fields < 256 bytes (simple strings, IDs, flags)?
- [ ] Can the application function without KMS for basic features?
- [ ] Review monthly KMS costs — is it proportional to sensitive data volume?

### Related Rules/Skills/Trees
- Use Envelope Encryption for Payloads > 1 KB (05-rules.md)
- Store DEK, IV, and Ciphertext Together as a Composite Object (05-rules.md)
- Envelope vs Symmetric vs Asymmetric decision tree (07-decision-trees.md)
