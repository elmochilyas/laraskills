# Encrypted Casts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Encrypted Casts |
| Focus | Anti-patterns in encrypted cast configuration and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Encrypted Primary or Foreign Keys | Architecture | Critical |
| 2 | VARCHAR Column for Encrypted Data | Reliability | Critical |
| 3 | Searchable Field Encrypted Without Hash Column | Performance | High |
| 4 | Blind Encryption of All Columns | Design | Medium |
| 5 | Undocumented APP_KEY Dependency | Maintainability | Critical |
| 6 | Encrypted Data Used in Reporting or Aggregation | Architecture | High |

## Repository-Wide Cross-Cutting Patterns

- Encrypted casts are often applied as a blanket "security" measure without considering query implications — teams encrypt columns that need to be searched, joined, or aggregated
- The non-deterministic nature of AES-256 encryption (different ciphertext for the same plaintext each time) is frequently misunderstood, leading to broken lookups and indexes
- `TEXT` column migration is the most common operational failure — encrypted casts are added to existing `VARCHAR` columns without updating the schema

---

## 1. Encrypted Primary or Foreign Keys

### Category
Architecture

### Description
Applying encrypted casts to primary key (`id`), foreign key (`user_id`), or any column used in `JOIN`, `INDEX`, `UNIQUE`, or `WHERE` clauses. Encrypted values are non-deterministic — the same value encrypts differently each time, making comparisons impossible.

### Why It Happens
Developers apply encryption broadly "for security" without understanding which columns need it. Keys are obvious candidates for protection but encryption only seems to apply to sensitive data columns, not structural keys.

### Warning Signs
- `$casts` includes `'id' => 'encrypted'` or `'user_id' => 'encrypted'`
- Eloquent relationships returning empty or incorrect results
- `User::find($id)` returning null because the encrypted `id` doesn't match
- Unique constraint violations on columns that should be unique
- Broken joins when querying relationships

### Why Harmful
- Eloquent's `find()`, `findOrFail()`, `findMany()` all use the primary key in `WHERE` clauses — encryption makes these queries impossible
- All relationship loading (`belongsTo`, `hasMany`, etc.) uses foreign keys that become non-deterministic ciphertext
- Unique indexes reject every insert because the encrypted value differs each time
- The application becomes fundamentally broken — no data can be retrieved or related

### Consequences
- Complete failure of all Eloquent relationship loading
- `find()` and `findBy()` methods return no results
- Unique constraint violations on every insert/update
- Database joins return zero matches
- Full table scans required for even primary key lookups

### Preferred Alternative
```php
// Never encrypt keys — they must remain deterministic
protected $casts = [
    'ssn' => 'encrypted',     // Sensitive content — OK
    'api_key' => 'encrypted',  // Sensitive content — OK
];
// id, user_id remain unencrypted
```

### Refactoring Strategy
1. Remove encrypted casts from all primary keys, foreign keys, and indexed columns
2. Run a migration to decrypt the values back to plaintext
3. Verify all Eloquent relationships work correctly
4. Add tests that verify key lookups and relationship loading work

### Detection Checklist
- [ ] Search for `'id' => 'encrypted'` in all models
- [ ] Search for `'*_id' => 'encrypted'` (foreign key patterns)
- [ ] Check for unique constraints on encrypted columns
- [ ] Verify Eloquent relationship loading for models with encrypted casts
- [ ] Test `find()`, `findOrFail()`, `where()` on encrypted key columns

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Encrypt Primary Keys, Foreign Keys, or Indexed Columns |
| Knowledge | `04-standardized-knowledge.md` — Anti-Patterns: Encrypted Primary/Foreign Key |
| Skill | `06-skills.md` — Step 5: Never encrypt primary/foreign keys |

---

## 2. VARCHAR Column for Encrypted Data

### Category
Reliability

### Description
Using `VARCHAR` or `STRING` column type with a fixed length limit for attributes that have encrypted casts. Encrypted ciphertext is significantly longer than plaintext and is silently truncated when it exceeds the column length.

### Why It Happens
Developers add the encrypted cast to an existing `VARCHAR` column without updating the migration. The column type was correct for plaintext but insufficient for ciphertext. Testing with short values may succeed while real data causes truncation.

### Warning Signs
- Migration uses `$table->string('ssn', 255)` instead of `$table->text('ssn')`
- Encrypted data returning null or truncated values for longer inputs
- Decryption failures after data truncation
- Database column type is `VARCHAR`, `CHAR`, or `STRING` for encrypted attributes
- The `TEXT` requirement is documented but the migration wasn't updated

### Why Harmful
- Ciphertext is silently truncated to fit the column width — the stored value is garbage that cannot be decrypted
- Data loss is permanent: once truncated ciphertext is written, the original plaintext is unrecoverable
- The failure may appear much later when the truncated value is accessed and decryption fails
- Short strings may work while longer values truncate, creating intermittent bugs

### Consequences
- Permanent data loss: encrypted values truncated beyond recovery
- Runtime decryption failures: `Crypt::decrypt()` throws exceptions on malformed ciphertext
- Silent data corruption: application appears to save successfully but stores garbage
- Emergency data recovery requiring database rollback or backup restoration

### Preferred Alternative
```php
Schema::table('users', function (Blueprint $table) {
    $table->text('ssn')->nullable()->change(); // TEXT supports any ciphertext length
});
```

### Refactoring Strategy
1. Identify all encrypted casts with non-TEXT/BLOB column types
2. Create migrations to change column types to `TEXT`
3. For existing data on `VARCHAR` columns, check for truncation — truncated data may be unrecoverable
4. Add tests that verify encryption round-trips with the maximum expected input length

### Detection Checklist
- [ ] Cross-reference encrypted casts with their database column types
- [ ] Search for `string(` or `->string(` column definitions for encrypted attributes
- [ ] Test with the longest expected input value and verify round-trip
- [ ] Check for `VARCHAR` columns in production that have encrypted casts

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use TEXT or BLOB Column Type for Encrypted Attributes |
| Knowledge | `04-standardized-knowledge.md` — Encrypted columns must be TEXT or BLOB |
| Skill | `06-skills.md` — Step 1: Ensure migration uses text() |

---

## 3. Searchable Field Encrypted Without Hash Column

### Category
Performance

### Description
Encrypting a field that needs to be searched by value (email, username, SSN) without adding a deterministic hash column for lookup. Every search by the encrypted value requires a full table scan — decrypting each row in memory.

### Why It Happens
Developers encrypt a field and later discover they need to look up records by that field. The hash column is seen as optional rather than required for searchable encrypted fields. Teams may not realize the query impact until the table grows.

### Warning Signs
- `'email' => 'encrypted'` or `'username' => 'encrypted'` without a corresponding `email_hash` or `username_hash` column
- `User::where('email', $email)->first()` returning nothing for existing records
- Full table scans in slow query log from encrypted column lookups
- Manual decryption loops in PHP to find records by encrypted value
- Unique email validation broken because the encrypted column can't be searched

### Why Harmful
- Every lookup by the encrypted value requires loading and decrypting every row in PHP
- As the table grows, lookups become O(n) with each row adding decryption overhead
- Unique constraints cannot be enforced at the database level
- Request timeouts for large tables when multiple concurrent lookups occur
- API endpoints that search by encrypted fields become unusably slow

### Consequences
- Unusable search performance on encrypted fields as table grows
- Inability to implement unique email or username validation
- Manual, slow, resource-intensive PHP loops for every lookup
- Request timeouts on endpoints that search by encrypted values
- Eventual need for emergency data migration to add hash columns

### Preferred Alternative
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
```

### Refactoring Strategy
1. Identify encrypted fields that need to be searchable
2. Add a migration with an indexed hash column for each searchable field
3. Add model boot events to populate the hash on save
4. Backfill hash values for existing records
5. Update queries to search by the hash column instead of the encrypted column

### Detection Checklist
- [ ] Cross-reference encrypted fields with application search requirements
- [ ] Check for `where('encrypted_field',` patterns in queries
- [ ] Search for hash columns (`*_hash`) alongside encrypted fields
- [ ] Profile slow queries involving encrypted columns
- [ ] Review unique validation logic for encrypted fields

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Store Searchable Hash Alongside Encrypted Fields |
| Decision Tree | `07-decision-trees.md` — Decision 3: Hash Column vs Full Table Scan |
| Skill | `06-skills.md` — Step 3: Add hash column for searchable fields |

---

## 4. Blind Encryption of All Columns

### Category
Design

### Description
Applying encrypted casts to every or most columns "for security" without considering which columns genuinely need encryption. Non-sensitive data like usernames, display preferences, and public metadata are encrypted, adding performance overhead and query limitations without security benefit.

### Why It Happens
Security-first mindset: "more encryption is better." Teams adopt a policy of encrypting all columns to avoid classifying data sensitivity. Understanding encryption tradeoffs requires security expertise that may not be available.

### Warning Signs
- Most columns in a model have encrypted casts
- Non-sensitive columns like `nickname`, `theme`, `locale`, `timezone` are encrypted
- Queries that should be simple `WHERE` clauses require hash column workarounds
- Performance overhead from encrypting/decrypting dozens of columns per model access
- Inability to sort, filter, or report on non-sensitive data

### Why Harmful
- Every attribute read adds ~1-5ms encryption overhead for no security benefit
- Non-sensitive data becomes unqueryable: cannot `ORDER BY nickname`, `GROUP BY locale`
- Complicated query patterns: hash columns needed even for non-sensitive searches
- Operational complexity: key rotation becomes a massive data migration
- False sense of security: encrypting non-sensitive data diverts attention from real security gaps

### Consequences
- Unnecessary performance cost on every model read/write
- Lost queryability on non-sensitive data that should be easily searchable
- Bloated models with dozens of encrypted casts and corresponding hash columns
- Key rotation procedures made unnecessarily complex
- Application slower without proportional security improvement

### Preferred Alternative
```php
// Encrypt only genuinely sensitive columns
protected $casts = [
    'ssn' => 'encrypted',        // PII — sensitive
    'api_key' => 'encrypted',    // Credential — sensitive
    'medical_notes' => 'encrypted', // Health data — sensitive
    // Non-sensitive columns remain unencrypted
    // 'username', 'theme', 'locale' are plaintext
];
```

### Refactoring Strategy
1. Classify every column with an encrypted cast: is it truly sensitive?
2. For non-sensitive columns, remove the encrypted cast
3. Run a migration to decrypt non-sensitive data back to plaintext
4. Remove hash columns that were added for non-sensitive searchability
5. Document data sensitivity classification for future reference

### Detection Checklist
- [ ] List all columns with encrypted casts across all models
- [ ] Classify each column as sensitive or non-sensitive
- [ ] Assess whether the encryption provides any security benefit
- [ ] Check if the encrypted data is used in queries, sorting, or filtering
- [ ] Review compliance requirements to determine which columns genuinely need encryption

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Overuse Encryption — Encrypt Only Sensitive Columns |
| Decision Tree | `07-decision-trees.md` — Decision 1: Encrypt vs Don't Encrypt |
| Knowledge | `04-standardized-knowledge.md` — When NOT To Use |

---

## 5. Undocumented APP_KEY Dependency

### Category
Maintainability

### Description
Using encrypted casts without documenting that all encrypted data depends on the application key (`APP_KEY`). Rotating, regenerating, or losing the application key makes all encrypted data permanently unrecoverable.

### Why It Happens
The `APP_KEY` dependency is implicit in Laravel's encryption system. Developers may not think about key rotation during initial development. Documentation is seen as an operations concern, not a development concern.

### Warning Signs
- No documentation or runbook entries about APP_KEY dependency for encrypted data
- Development or staging environments sharing the same APP_KEY (or having different keys causing encrypted data issues)
- Operations team unaware that key rotation requires a data migration
- Encrypted data becoming unreadable after infrastructure changes that reset APP_KEY
- No recovery plan documented for encrypted data

### Why Harmful
- Rotating APP_KEY (a standard security practice) destroys all encrypted data
- Losing APP_KEY (hardware failure, personnel change) permanently loses all encrypted data
- CI/CD environments with different APP_KEYs cannot read production data
- Disaster recovery procedures that rebuild the environment lose encrypted data
- Compliance requirements for key rotation cannot be met without breaking encrypted data

### Consequences
- Permanent data loss on APP_KEY rotation
- Inability to meet key rotation compliance requirements
- Data unrecoverable after infrastructure incidents
- Emergency downtime to re-encrypt data after accidental key change
- Audit findings for missing key management procedures

### Preferred Alternative
```php
/**
 * Encrypted casts use APP_KEY as the encryption key.
 * IMPORTANT: Rotating APP_KEY makes existing encrypted data unrecoverable.
 * To rotate keys, run the RotateEncryptedData artisan command which
 * decrypts with the old key and re-encrypts with the new key.
 */
protected $casts = [
    'ssn' => 'encrypted',
];
```

### Refactoring Strategy
1. Document all models using encrypted casts
2. Add docblock annotations to model casts sections noting APP_KEY dependency
3. Create or update the project runbook with APP_KEY rotation procedures
4. Create an Artisan command for re-encrypting data with a new key
5. Review disaster recovery procedures for encrypted data handling

### Detection Checklist
- [ ] Search for encrypted casts and count models affected
- [ ] Check runbook or deployment documentation for APP_KEY procedures
- [ ] Verify operations team knows about the dependency
- [ ] Test key rotation on a staging environment (with backup)
- [ ] Check if any Artisan command exists for re-encrypting data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document APP_KEY Dependency and Rotation Procedures |
| Skill | `06-skills.md` — Step 4: Document APP_KEY dependency |
| Knowledge | `04-standardized-knowledge.md` — APP_KEY is a critical secret |

---

## 6. Encrypted Data Used in Reporting or Aggregation

### Category
Architecture

### Description
Using encrypted casts on columns that participate in aggregate queries (SUM, AVG, COUNT), `GROUP BY`, `ORDER BY`, or database-level analytics. Ciphertext is opaque to the database and produces garbage results when used in these operations.

### Why It Happens
Reporting requirements are discovered after encryption is implemented. Non-technical stakeholders request reports on data that happens to be encrypted. Developers may try to use the encrypted column in SQL rather than admitting the limitation.

### Warning Signs
- Aggregate queries (`AVG(salary)`, `SUM(revenue)`) on encrypted columns
- `ORDER BY encrypted_column` returning results sorted by ciphertext (not plaintext)
- Reports showing nonsensical values for encrypted fields
- Application code that decrypts entire tables in memory to produce simple aggregates
- "Cannot compute average" errors from reporting tools

### Why Harmful
- Aggregate queries on ciphertext produce meaningless results (averages of encrypted bytes)
- In-memory decryption for reporting doesn't scale — entire table must be loaded, decrypted, and processed in PHP
- Reporting tools (Metabase, Grafana, Tableau) cannot read encrypted data at all
- Business intelligence and analytics are blocked by encryption on fields that need reporting
- Workarounds (duplicate plaintext columns) defeat the purpose of encryption

### Consequences
- Broken reports and dashboards for encrypted data
- Scalability issues with in-memory PHP-based reporting
- Inability to use standard database analytics tooling
- Security vs analytics conflict: must choose between encryption or reporting
- Duplicate plaintext columns that create security gaps

### Preferred Alternative
```php
// Store sensitive data encrypted, aggregatable data separately
protected $casts = [
    'salary' => 'decimal:2',           // Aggregatable (if sensitivity allows)
    'salary_encrypted' => 'encrypted',  // Encrypted copy for individual access
];
```

### Refactoring Strategy
1. Identify encrypted columns used in reports, aggregates, or sorting
2. If the data is genuinely sensitive, create a separate non-encrypted aggregatable column (with access control)
3. Update reporting queries to use the non-encrypted column
4. If the data is not sensitive enough to block reporting, remove the encrypted cast

### Detection Checklist
- [ ] Search for aggregate functions on encrypted columns in queries
- [ ] Review reporting tools and dashboards for encrypted column usage
- [ ] Check for `ORDER BY`, `GROUP BY` on encrypted columns
- [ ] Audit in-memory decryption loops for reporting
- [ ] Assess whether the encrypted data genuinely needs participation in analytics

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Avoid Encrypted Casts for Data Needing Reporting or Aggregation |
| Decision Tree | `07-decision-trees.md` — Decision 1: Encrypt vs Don't Encrypt (analytics check) |
| Knowledge | `04-standardized-knowledge.md` — Cannot participate in aggregate queries |
