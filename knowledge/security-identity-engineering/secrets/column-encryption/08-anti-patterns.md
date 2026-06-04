# Anti-Patterns: Column-Level RSA Encryption (eloquent-encryption)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Column-Level RSA Encryption (eloquent-encryption) |
| Audience | Architects, Developers, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SC-01 | RSA Overkill for High-Throughput Fields | High | Medium | Medium |
| AP-SC-02 | Encrypted Primary/Foreign Key Columns | Critical | Low | High |
| AP-SC-03 | Private Key Stored in Database | Critical | Medium | Low |
| AP-SC-04 | No Key Backup or Rotation Plan | Critical | High | Medium |
| AP-SC-05 | Encrypting All Columns Without Discrimination | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Ciphertext Column Too Small**: Using `string(255)` for encrypted columns — ciphertext is 200-300+ chars, silently truncates
- **Encrypted Columns in WHERE/LIKE Clauses**: Non-deterministic encryption makes equality searches always miss
- **No Encrypted Field Logging Redaction**: Encrypted-then-decrypted values appear in plaintext in Laravel logs
- **Round-Trip Test Omission**: No feature test verifying ciphertext is stored (not plaintext)

---

## 1. RSA Overkill for High-Throughput Fields

### Category
Performance · Architecture

### Description
Using RSA column-level encryption (eloquent-encryption) for fields that are read frequently or in high-throughput contexts, where symmetric AES-256 (Crypt facade) would be faster and simpler.

### Why It Happens
Developers choose eloquent-encryption for all encrypted fields without evaluating the performance profile. RSA's asymmetric properties sound more secure, so teams default to it without benchmarking. The documentation highlights RSA key separation benefits but does not surface performance tradeoffs.

### Warning Signs
- Encrypted fields read on every page load (user profile, session data) using RSA
- Response times increased by 5-10ms per encrypted field after deployment
- Database reads show consistent latency proportional to number of encrypted columns
- Load testing reveals encryption overhead at scale

### Why Harmful
RSA decryption takes 1-5ms per field (2048-bit key). With 5 encrypted columns per record, each read adds 5-25ms of overhead. For read-heavy workloads (dashboards, APIs with list endpoints), this latency compounds and significantly degrades user experience. The application could use AES-256 (Crypt facade) with sub-millisecond decryption for the same security guarantees.

### Real-World Consequences
- API response times degrade from 50ms to 200ms+ under load due to per-field RSA decryption
- Horizontal scaling required to compensate for encryption overhead — increased infrastructure cost
- Users report slow page loads on profile/data views without understanding why
- Performance audits flag encryption as the primary bottleneck

### Preferred Alternative
Use Laravel's built-in `encrypted` cast (AES-256 symmetric via Crypt facade) for most column encryption:
```php
protected $casts = [
    'ssn' => 'encrypted',  // AES-256, ~0.1ms per field
];
```
Reserve RSA eloquent-encryption only when per-attribute key separation is explicitly required.

### Refactoring Strategy
1. Benchmark current encryption overhead per field
2. Replace `EloquentEncryption` trait and `$encryptable` array with Laravel's `encrypted` cast
3. Generate new APP_KEY per environment if not already unique
4. Re-encrypt all existing data with the new symmetric key
5. Verify decryption round-trip in feature tests

### Detection Checklist
- [ ] Check if eloquent-encryption package is installed when Crypt facade would suffice
- [ ] Benchmark encrypted field read latency (>1ms per field is suspicious)
- [ ] Count encrypted fields per model — more than 3 justifies performance review
- [ ] Review whether RSA key separation (different keys per attribute) is actually used

### Related Rules/Skills/Trees
- Mark Encrypted Columns in `$casts` as `'encrypted'` (05-rules.md)
- Encrypt Database Columns Transparently with eloquent-encryption (06-skills.md)
- RSA vs AES Key Type decision tree (07-decision-trees.md)

---

## 2. Encrypted Primary/Foreign Key Columns

### Category
Architecture · Performance

### Description
Applying column-level encryption to primary keys or foreign key columns, breaking database indexing, joins, and relationship resolution.

### Why It Happens
Developers apply encryption blanket-style to all columns deemed "sensitive" without distinguishing between data columns and structural columns. Primary keys and FKs look like regular columns in migrations, so they get the same encryption treatment. Teams do not realize that encrypted columns cannot participate in database-level operations.

### Warning Signs
- Eloquent relationships returning empty or incorrect results
- JOIN queries involving encrypted columns failing or returning no rows
- Primary key lookups (`User::find($id)`) timing out or failing
- Index scans on encrypted columns showing full table scans

### Why Harmful
Encrypted primary keys prevent indexing, equality matching, and sorting. Eloquent's `find()`, `where()`, and relationship methods all rely on database-level key matching. When PKs are encrypted, every lookup requires decrypting the entire column set before matching — effectively impossible at scale. Foreign key constraints also break because the encrypted value in the child table never matches the encrypted value in the parent table (non-deterministic encryption produces different ciphertext each time).

### Real-World Consequences
- `User::find(1)` returns null because the encrypted PK `1` stored as different ciphertext each time
- All Eloquent relationships return empty collections — app appears broken
- Database migration rollbacks become impossible (FK constraint failures)
- Emergency hotfix required to decrypt PKs and re-encrypt with deterministic scheme or remove encryption

### Preferred Alternative
Never encrypt primary keys or foreign keys. Encrypt only data columns (PII, secrets, credentials). Use separate encrypted columns for sensitive data:
```php
// Correct: PK is plaintext, sensitive data column is encrypted
Schema::table('users', function ($table) {
    $table->id();                   // Plaintext — supports indexing and joins
    $table->text('ssn')->nullable(); // Encrypted — sensitive data only
});
```

### Refactoring Strategy
1. Identify all encrypted PK/FK columns in the schema
2. Create a migration to drop encryption on PK/FK columns (store plaintext IDs)
3. Rebuild indexes on those columns
4. For sensitive data tied to PKs, move it to separate encrypted columns
5. Test all Eloquent relationships and find() queries

### Detection Checklist
- [ ] Review `$encryptable` or `$casts` arrays for `id` or `*_id` columns
- [ ] Check `php artisan db:show` for encrypted-looking binary/text PK columns
- [ ] Run `User::find(1)->first()` — verify it returns the expected record
- [ ] Test Eloquent relationship queries — do they return data?

### Related Rules/Skills/Trees
- Encrypt Only Truly Sensitive Columns (05-rules.md)
- Use Deterministic Encryption for Searchable Encrypted Columns (05-rules.md)
- RSA vs AES Key Type decision tree (07-decision-trees.md)

---

## 3. Private Key Stored in Database

### Category
Security · Critical

### Description
Storing the RSA private key in the same database that contains encrypted data, defeating the purpose of column-level encryption by placing the decryption key alongside the ciphertext.

### Why It Happens
Developers treat the private key as just another configuration value and store it in a `settings` table or environment config stored in the database. The convenience of having all configuration in one place overrides security considerations. Teams do not realize that database-level access (DBA, backup exposure, SQL injection) can read both the encrypted data and the key.

### Warning Signs
- RSA private key PEM file referenced from a database-stored configuration value
- Encryption config stored in `settings` table alongside encrypted data
- Database dump contains both encrypted columns and what appears to be a private key
- Backup restoration exposes the key in plaintext

### Why Harmful
The entire security model of column-level encryption assumes key-data separation. If an attacker gains database access (SQL injection, compromised backup, DBA account) and the private key is also in the database, all encrypted data is immediately decryptable. The encryption provides zero security benefit — it is security theater.

### Real-World Consequences
- DBA with read access to the database can decrypt all PII without application access
- SQL injection exploit returns both ciphertext and the private key in a single query
- Database backup stored in S3 exposes all encrypted data when the key is in the same backup
- Compliance audit fails: "Encryption key stored with encrypted data — no effective encryption"

### Preferred Alternative
Store the RSA private key outside the database — filesystem with 600 permissions, Vault, or environment variable:
```php
// config/eloquent-encryption.php
return [
    'private_key' => storage_path('encryption/private.pem'), // File outside web root
    'passphrase' => env('ENCRYPTION_KEY_PASSPHRASE'),       // Env var for extra protection
];
```

### Refactoring Strategy
1. Immediately generate a new RSA key pair
2. Move the new private key to secure external storage (filesystem, Vault)
3. Re-encrypt all data with the new key pair
4. Delete the old private key from the database
5. Verify no database-stored config references the key path

### Detection Checklist
- [ ] Search application code for `DB::table('settings')->where('key', 'private_key')` patterns
- [ ] Check database config tables for PEM-formatted values
- [ ] Verify `config/eloquent-encryption.php` private_key path points outside database
- [ ] Test: can a database-only query retrieve the private key and encrypted data together?

### Related Rules/Skills/Trees
- Mark Encrypted Columns in `$casts` as `'encrypted'` (05-rules.md)
- Ensure Encrypted Column Size Accommodates Ciphertext (05-rules.md)
- RSA vs AES Key Type decision tree (07-decision-trees.md)

---

## 4. No Key Backup or Rotation Plan

### Category
Security · Reliability

### Description
Deploying column-level encryption without a documented process for backing up the RSA private key or rotating keys, creating permanent data loss risk.

### Why It Happens
Encryption is implemented as a one-time setup. The private key is generated, stored somewhere, and forgotten. Teams assume the key will never be lost or compromised. Rotation is perceived as a distant future concern. The package documentation focuses on initial setup, not lifecycle management.

### Warning Signs
- RSA private key exists in only one location (development server or a single developer's machine)
- No documentation of where the private key is stored or how to recover it
- No Artisan command or script for key rotation
- `lost private key` panic when server is migrated or developer leaves

### Why Harmful
If the RSA private key is lost (server failure, accidental deletion, staff turnover), all encrypted data becomes permanently unrecoverable. There is no backdoor — asymmetric encryption means the private key is the sole means of decryption. Similarly, if the key is compromised (breach, exposed backup), there is no rotation process to re-encrypt data with a new key, forcing the organization to choose between data loss and accepting the breach.

### Real-World Consequences
- Production server dies without a separate key backup — years of PII permanently lost
- Compliance auditor asks for key rotation records — none exist, failing audit
- Private key leaked in email attachment — no rotation script exists, data remains exposed
- Team spends days manually writing a one-off rotation script under pressure

### Preferred Alternative
Document and automate key backup and rotation from day one:
```bash
# Backup: store encrypted copy of private key in secure external storage
# Rotation script:
php artisan key:rotate-encryption
```
```php
// Key backup stored in Vault or encrypted in secure object storage
// Rotation process documented and tested in staging
```

### Refactoring Strategy
1. Create an encrypted backup of the current private key (separate from database backups)
2. Document the restore procedure
3. Write an Artisan command for key rotation (decrypt all with old key, re-encrypt with new key)
4. Test rotation in staging with production data copy
5. Schedule regular key rotation (annual minimum)

### Detection Checklist
- [ ] Is there a documented key backup location separate from the database?
- [ ] Can the team recover the private key without the original developer?
- [ ] Does the project have a key rotation Artisan command?
- [ ] Has key rotation been tested in staging with production-like data?

### Related Rules/Skills/Trees
- Ensure Encrypted Column Size Accommodates Ciphertext (05-rules.md)
- Test Encryption Round-Trip in Feature Tests (05-rules.md)
- Encrypt Database Columns Transparently with eloquent-encryption (06-skills.md)

---

## 5. Encrypting All Columns Without Discrimination

### Category
Architecture · Performance

### Description
Applying column-level encryption to every column in a model instead of selectively encrypting only sensitive fields (PII, credentials, regulated data).

### Why It Happens
A security-first mindset without risk analysis leads developers to "encrypt everything" as a precaution. The model's `$encryptable` or `$casts` array grows to include display names, email addresses, status flags, and other non-sensitive data. Team culture discourages debating which fields need encryption — "encrypt all" feels safer.

### Warning Signs
- More than 50% of model columns are encrypted
- Non-sensitive columns (username, display_name, status, created_at) are encrypted
- Developers cannot articulate why specific columns are encrypted — "it's the policy"
- Queries on basic model attributes require decrypting every row

### Why Harmful
Encrypted columns cannot be searched, sorted, indexed, or used in WHERE clauses. Over-encrypting makes the application unqueryable — every basic operation requires full table scans with application-level decryption. Performance degrades proportionally to data volume. The application becomes progressively harder to maintain as new features require working around encryption on fields that were never sensitive.

### Real-World Consequences
- Admin panel cannot sort users by name because `display_name` is encrypted
- Search feature requires fetching all users, decrypting names in memory, then filtering — crashes browser at 10K users
- Reporting team cannot run SQL queries for analytics — every report needs a custom decryption job
- New developer accidentally encrypts the `email` field, breaking login (email used for authentication)

### Preferred Alternative
Encrypt only truly sensitive columns and document the rationale:
```php
protected $casts = [
    'ssn' => 'encrypted',        // PII — requires encryption by policy
    'tax_id' => 'encrypted',     // PII — requires encryption by policy
    // Non-encrypted:
    // 'display_name' => 'string',    // Not sensitive — searchable
    // 'email' => 'string',           // Needed for login — NOT encrypted
];
```

### Refactoring Strategy
1. Audit every encrypted column and classify: PII, credentials, or neither
2. Remove encryption from non-sensitive columns
3. For columns needed in WHERE clauses (email, username), determine search strategy
4. Re-encrypt remaining sensitive columns with the correct approach
5. Document the encryption policy: which columns are encrypted and why

### Detection Checklist
- [ ] Count encrypted vs plaintext columns per model — ratio should favor plaintext
- [ ] Verify `email` is NOT encrypted (needed for authentication)
- [ ] Check if `created_at`, `updated_at`, or status fields are encrypted
- [ ] Can the application search/sort by commonly displayed fields?

### Related Rules/Skills/Trees
- Encrypt Only Truly Sensitive Columns (05-rules.md)
- Never Log or Dump Encrypted Column Values (05-rules.md)
- Column-Level vs Crypt Facade vs Envelope Encryption decision tree (07-decision-trees.md)
