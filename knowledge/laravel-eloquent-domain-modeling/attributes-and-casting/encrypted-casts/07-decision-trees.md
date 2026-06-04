# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Encrypted Casts
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Encrypt vs Don't Encrypt a Column
* Decision 2: Encrypted Scalar (`encrypted`) vs Encrypted Array (`encrypted:array`) vs Encrypted Collection (`encrypted:collection`)
* Decision 3: Searchable Hash Column vs Full Table Scan

---

# Architecture-Level Decision Trees

---

## Decision 1: Encrypt vs Don't Encrypt a Column

---

## Decision Context

Determine whether a database column needs encryption at rest using Laravel's encrypted casts.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the column contain PII, credentials, secrets, or financial data?
↓
YES → Encrypt
NO → Does compliance (GDPR, HIPAA, PCI) require encryption of this data?
    YES → Encrypt
    NO → Does the column need to be searchable, joinable, or used in ORDER BY/GROUP BY?
        YES → Do not encrypt (encryption prevents these operations)
        NO → Is the data non-sensitive (preferences, settings, public info)?
            YES → Do not encrypt (encryption adds overhead without benefit)
            NO → Evaluate — if doubtful, encrypt

---

## Rationale

Encryption protects data at rest but prevents database-level querying, indexing, and joining. Use it for genuinely sensitive data that does not need to be searched. Non-sensitive data should not be encrypted to avoid unnecessary overhead and query limitations.

---

## Recommended Default

**Default:** Encrypt only columns containing genuinely sensitive data (PII, credentials, secrets). Do not encrypt non-sensitive data.
**Reason:** Encryption adds ~1-5ms per access and prevents querying. Encrypting non-sensitive data creates cost without benefit.

---

## Risks Of Wrong Choice

* Encrypting non-sensitive data: unnecessary performance cost, prevents querying, complicates key management
* Not encrypting sensitive data: compliance violations, data exposure in backups, breach risk

---

## Related Rules

* Do not overuse encryption — encrypt only sensitive columns (`05-rules.md`)
* Never encrypt primary keys, foreign keys, or indexed columns (`05-rules.md`)

---

## Related Skills

* Configure Encrypted Casting for Sensitive Attributes (`06-skills.md` Skill 1)

---

## Decision 2: Encrypted Scalar vs Encrypted Array vs Encrypted Collection

---

## Decision Context

Choose the appropriate encrypted cast variant based on the type of data being stored.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the data a single scalar value (string, number)?
↓
YES → `encrypted`
NO → Is the data a JSON array that needs Collection API (map, filter, reduce)?
    YES → `encrypted:collection`
    NO → Is the data a JSON array that needs simple array access?
        YES → `encrypted:array`
        NO → Is the data a JSON object that should return stdClass?
            YES → `encrypted:object`
            NO → Evaluate data type

---

## Rationale

Each variant maps to a specific data type. `encrypted` handles scalar values. `encrypted:array` handles JSON arrays decoded to native arrays. `encrypted:collection` wraps the array in Laravel's Collection for richer manipulation. Choosing the right variant ensures the decrypted value has the expected type.

---

## Recommended Default

**Default:** `encrypted` for scalar values. `encrypted:array` for JSON arrays. `encrypted:collection` when Collection API is needed.
**Reason:** The variant determines the return type. Using the wrong variant returns unexpected types and requires manual conversion.

---

## Risks Of Wrong Choice

* `encrypted` for JSON data: returns encrypted string, not decoded array
* `encrypted:array` when Collection needed: no map/filter/reduce, manual conversion
* `encrypted:collection` for scalars: type error or unexpected wrapper

---

## Related Rules

* Use TEXT or BLOB column type for encrypted attributes (`05-rules.md`)
* Avoid encrypted casts for data needing reporting or aggregation (`05-rules.md`)

---

## Related Skills

* Configure Encrypted Casting for Sensitive Attributes (`06-skills.md` Skill 1)

---

## Decision 3: Searchable Hash Column vs Full Table Scan

---

## Decision Context

Choose whether to add a deterministic hash column alongside an encrypted field to enable `WHERE` lookups, or accept full table scans for searches.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the encrypted field need to be looked up by value (email, SSN, username)?
↓
YES → Is the table expected to grow beyond 1000 rows?
    YES → Add searchable hash column (indexed)
    NO → Is the lookup frequency more than a few times per day?
        YES → Add searchable hash column
        NO → Full table scan acceptable (small table, rare lookups)
NO → No hash column needed (field is display/verification only)

---

## Rationale

Encrypted columns are non-deterministic ciphertext — they cannot be used in `WHERE` clauses. A deterministic SHA-256 hash in a separate indexed column enables efficient lookups. For small tables queried infrequently, the performance cost of a full table scan may be acceptable.

---

## Recommended Default

**Default:** Add a searchable hash column for any encrypted field that needs `WHERE` lookups. Omit only when the table is tiny and queried rarely.
**Reason:** Without a hash column, every lookup requires a full table scan. As the table grows, this becomes a performance and reliability issue.

---

## Risks Of Wrong Choice

* No hash column: O(n) full table scans, inability to implement unique validation, performance degradation as table grows
* Hash column for non-searchable fields: unnecessary storage, maintenance overhead, no benefit

---

## Related Rules

* Store searchable hash alongside encrypted fields (`05-rules.md`)
* Document APP_KEY dependency and rotation procedures (`05-rules.md`)

---

## Related Skills

* Configure Encrypted Casting for Sensitive Attributes (`06-skills.md` Skill 1)
