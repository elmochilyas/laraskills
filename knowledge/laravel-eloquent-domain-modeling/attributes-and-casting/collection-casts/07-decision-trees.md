# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Collection Casts
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: JSON Collection Cast vs Normalized Related Table
* Decision 2: AsCollection vs AsArrayObject vs Enum Variant
* Decision 3: Encrypted vs Non-Encrypted Collection Variant

---

# Architecture-Level Decision Trees

---

## Decision 1: JSON Collection Cast vs Normalized Related Table

---

## Decision Context

Choose between storing data as a JSON array with a collection cast or normalizing it into a related database table.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the data have a fixed schema?
↓
YES → Does the data need to be queried via `WHERE` clauses or joined?
    YES → Normalized Related Table
    NO → Does the data need foreign key constraints or indexing?
        YES → Normalized Related Table
        NO → JSON Collection (if structure varies per record)
NO → Is the schema genuinely dynamic per record (metadata, settings, feature flags)?
    YES → JSON Collection
    NO → Normalized Related Table

---

## Rationale

Normalized tables provide referential integrity, query performance, schema enforcement, and migration tooling support. JSON collections sacrifice these for schema flexibility. Use JSON only when the structure genuinely varies per record and querying is not required.

---

## Recommended Default

**Default:** Normalized related table. JSON collection only for genuinely dynamic or denormalized data that is never queried by individual fields.
**Reason:** JSON columns are not efficiently queryable, joinable, or indexable. Normalized tables are always the safer default.

---

## Risks Of Wrong Choice

* JSON for fixed schema data: poor query performance, no integrity constraints, complex migrations, scalability issues
* Normalized table for dynamic metadata: schema migrations for every new field, sparse columns, ORM overhead

---

## Related Rules

* Prefer normalized tables over JSON collections (`05-rules.md`)
* Be aware of dirty detection overhead for large collections (`05-rules.md`)

---

## Related Skills

* Cast a JSON Column to a Typed Collection (`06-skills.md` Skill 1)

---

## Decision 2: AsCollection vs AsArrayObject vs Enum Variant

---

## Decision Context

Choose the appropriate collection cast variant for a JSON array column.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the JSON array contain enum values that need type safety?
↓
YES → `AsEnumCollection` or `AsEnumArrayObject` with colon-separated enum class
NO → Do you need the Laravel Collection API (map, filter, reduce)?
    YES → `AsCollection`
    NO → Do you need mutable-by-reference behavior without reassignment?
        YES → `AsArrayObject`
        NO → `AsCollection` (most versatile)

---

## Rationale

Each variant serves a specific need: `AsCollection` provides the richest API for array manipulation. `AsArrayObject` is useful when changes should be tracked without reassignment. Enum variants provide type safety for enum arrays. Choosing the right variant prevents unnecessary overhead or missing features.

---

## Recommended Default

**Default:** `AsCollection` for most use cases. Enum variants for typed enum arrays. `AsArrayObject` when mutable-by-reference is explicitly needed.
**Reason:** `AsCollection` provides the most functionality with the least cognitive overhead. Only specialize when specific features (mutable refs, type safety) are needed.

---

## Risks Of Wrong Choice

* `AsArrayObject` when Collection API needed: missing map/filter/reduce, manual array conversion
* `AsCollection` when mutable refs needed: must reassign to model to persist changes
* Plain `array` cast when enum safety needed: invalid values silently stored, manual validation

---

## Related Rules

* Use `AsEnumCollection` for typed enum arrays (`05-rules.md`)
* Ensure database column type is JSON or TEXT (`05-rules.md`)

---

## Related Skills

* Cast a JSON Column to a Typed Collection (`06-skills.md` Skill 1)

---

## Decision 3: Encrypted vs Non-Encrypted Collection Variant

---

## Decision Context

Choose between standard collection casts and their encrypted variants (`AsEncryptedCollection`/`AsEncryptedArrayObject`) for JSON array data.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the JSON array contain PII, credentials, secrets, or sensitive data?
↓
YES → Encrypted Variant (`AsEncryptedCollection` or `AsEncryptedArrayObject`)
NO → Does compliance (GDPR, HIPAA, PCI) require encryption at rest?
    YES → Encrypted Variant
    NO → Is the data non-sensitive (UI preferences, layout settings, display options)?
        YES → Non-Encrypted Variant (avoids encryption overhead)
        NO → Evaluate sensitivity — encrypt if doubtful

---

## Rationale

Encrypted variants provide transparent AES-256 encryption for JSON arrays at rest. They protect sensitive data in database dumps and backups. Non-sensitive data should use standard variants to avoid unnecessary encryption/decryption overhead (~1-5ms per access).

---

## Recommended Default

**Default:** Non-encrypted variant for non-sensitive data. Encrypted variant for any data containing PII, secrets, or compliance-regulated information.
**Reason:** Encryption adds read/write latency and prevents querying. Only use it when there is a security or compliance requirement.

---

## Risks Of Wrong Choice

* Non-encrypted for sensitive data: compliance violations, data exposure in backups, breach risk amplification
* Encrypted for non-sensitive data: unnecessary overhead, query limitations, operational complexity

---

## Related Rules

* Use encrypted variants for sensitive collection data (`05-rules.md`)

---

## Related Skills

* Cast a JSON Column to a Typed Collection (`06-skills.md` Skill 1)
