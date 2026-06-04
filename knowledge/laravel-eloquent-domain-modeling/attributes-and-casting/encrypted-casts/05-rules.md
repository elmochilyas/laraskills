## Use TEXT or BLOB Column Type for Encrypted Attributes
---
## Category
Reliability
---
## Rule
Always use `TEXT` (preferred) or `BLOB` database column type for attributes with encrypted casts. Never use `VARCHAR` with a fixed length.
---
## Reason
Encrypted values are significantly longer than plaintext. AES-256 encrypted ciphertext grows with input size. `VARCHAR` truncates values exceeding the defined length, causing silent data loss. `TEXT` has sufficient capacity and no practical length limit.
---
## Bad Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->string('api_key', 255)->nullable(); // Truncates encrypted value
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->text('api_key')->nullable();
});
```
---
## Exceptions
No common exceptions. Always use `TEXT` for encrypted columns.
---
## Consequences Of Violation
Silent data truncation, unrecoverable encrypted data stored as truncated garbage, runtime decryption failures, data loss requiring manual database restoration.

---
## Store Searchable Hash Alongside Encrypted Fields
---
## Category
Architecture
---
## Rule
When an encrypted field (email, SSN, username) needs to be searchable via `WHERE` clauses, store a SHA-256 hash in a separate indexed column for lookup purposes.
---
## Reason
Encrypted columns cannot be used in `WHERE` queries, `ORDER BY`, `GROUP BY`, or `JOIN` conditions because each value is randomized ciphertext. A deterministic hash column enables lookups without decrypting every row.
---
## Bad Example
```php
protected $casts = [
    'email' => 'encrypted', // Cannot query: User::where('email', $email)->first()
];
```
---
## Good Example
```php
// Migration adds indexed hash column
Schema::table('users', function (Blueprint $table) {
    $table->text('email')->nullable();
    $table->string('email_hash', 64)->nullable()->index();
});

// Model sets hash on save
protected static function booted(): void
{
    static::saving(function (User $user) {
        if ($user->isDirty('email')) {
            $user->email_hash = hash('sha256', $user->email);
        }
    });
}

// Query
User::where('email_hash', hash('sha256', $input))->first();
```
---
## Exceptions
When the encrypted field never needs to be searched or looked up by value, the hash column is unnecessary.
---
## Consequences Of Violation
Full table scans for every lookup by encrypted value, inability to implement unique email validation, O(n) search performance degrading with table size.

---
## Never Encrypt Primary Keys, Foreign Keys, or Indexed Columns
---
## Category
Security
---
## Rule
Do not apply encrypted casts to primary keys, foreign keys, or columns used in `JOIN`, `INDEX`, `UNIQUE`, or `WHERE` clauses.
---
## Reason
Encrypted values are non-deterministic (different ciphertext each time), making joins and lookups impossible. Encrypting keys breaks Eloquent relationships, query performance, and database integrity constraints.
---
## Bad Example
```php
protected $casts = [
    'id' => 'encrypted',       // Breaks all joins
    'user_id' => 'encrypted',  // Breaks all relationships
];
```
---
## Good Example
```php
protected $casts = [
    'ssn' => 'encrypted',   // Sensitive data — appropriate
    'api_key' => 'encrypted', // Sensitive data — appropriate
];
// Keys and IDs remain unencrypted
```
---
## Exceptions
No common exceptions. Primary keys, foreign keys, and indexed columns must never be encrypted.
---
## Consequences Of Violation
Broken Eloquent relationship loading, impossible joins, unique constraint violations from non-deterministic ciphertext, complete loss of query performance on encrypted indexed columns.

---
## Document APP_KEY Dependency and Rotation Procedures
---
## Category
Maintainability
---
## Rule
Document in the project runbook that encrypted casts depend on `APP_KEY` and that rotating the key requires a data migration to re-encrypt all values with the new key.
---
## Reason
Laravel's encrypted casts use `APP_KEY` as the encryption key. If the key is rotated (or lost), all encrypted data becomes permanently unrecoverable. This dependency must be documented in operational procedures.
---
## Bad Example
```php
// No documentation about APP_KEY dependency
protected $casts = [
    'ssn' => 'encrypted',
];
```
---
## Good Example
```php
/**
 * Encrypted casts use APP_KEY as the encryption key.
 * 
 * IMPORTANT: Rotating APP_KEY makes existing encrypted data unrecoverable.
 * To rotate keys, run the RotateEncryptedData artisan command which
 * decrypts with the old key and re-encrypts with the new key.
 */
protected $casts = [
    'ssn' => 'encrypted',
];
```
---
## Exceptions
No common exceptions. Always document encryption key dependencies.
---
## Consequences Of Violation
Permanent data loss when APP_KEY is rotated or regenerated, inability to recover encrypted data after infrastructure changes, critical security incident during key rotation.

---
## Avoid Encrypted Casts for Data Needing Reporting or Aggregation
---
## Category
Architecture
---
## Rule
Do not use encrypted casts for columns that participate in aggregate queries, `GROUP BY`, `ORDER BY`, statistical reports, or database-level analytics.
---
## Reason
Encrypted data is opaque to the database. Aggregation, sorting, grouping, and statistical functions produce garbage results on ciphertext. Encrypted columns must be excluded from all database-level analytics.
---
## Bad Example
```php
protected $casts = [
    'salary' => 'encrypted', // Cannot compute average salary in SQL
];
```
---
## Good Example
```php
protected $casts = [
    'salary' => 'decimal:2', // Aggregatable when sensitivity allows
];
```
---
## Exceptions
When reporting can be performed in application memory by decrypting rows one at a time (acceptable only for small datasets).
---
## Consequences Of Violation
Incorrect aggregate query results, broken reports, application errors from unexpected ciphertext values in calculations, inability to use database analytics tooling.

---
## Do Not Overuse Encryption — Encrypt Only Sensitive Columns
---
## Category
Security
---
## Rule
Apply encrypted casts only to columns containing genuinely sensitive data (PII, credentials, secrets, financial data). Do not encrypt non-sensitive columns.
---
## Reason
Encryption adds read/write latency (~1-5ms per access), prevents querying, prevents indexing, and complicates key management. Encrypting non-sensitive data creates unnecessary performance cost and operational complexity without security benefit.
---
## Bad Example
```php
protected $casts = [
    'username' => 'encrypted',   // Not sensitive — unnecessary overhead
    'theme' => 'encrypted',      // Not sensitive — prevents querying
    'nickname' => 'encrypted',   // Not sensitive — no security benefit
];
```
---
## Good Example
```php
protected $casts = [
    'ssn' => 'encrypted',        // Sensitive PII
    'api_key' => 'encrypted',    // Credential
    'medical_notes' => 'encrypted', // Sensitive health data
];
```
---
## Exceptions
When compliance requirements mandate encryption of specific data categories, apply encryption to meet the requirement and document the performance trade-off.
---
## Consequences Of Violation
Unnecessary performance overhead on every read/write, query limitations on non-sensitive data, operational complexity without proportional security benefit, slower application response times.
