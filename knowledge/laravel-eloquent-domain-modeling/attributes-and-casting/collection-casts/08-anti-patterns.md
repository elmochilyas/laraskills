# Collection Casts — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Collection Casts |
| Focus | Anti-patterns in JSON collection casting |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | JSON Column Used as a Queryable Table | Architecture | Critical |
| 2 | Unencrypted Sensitive Data in JSON Collections | Security | Critical |
| 3 | Plain Array Cast for Enum Collections | Design | Medium |
| 4 | VARCHAR Column for JSON Data | Reliability | High |
| 5 | Massively Overgrown JSON Collections | Performance | Medium |
| 6 | Wrong Cast Variant for the Use Case | Design | Low |

## Repository-Wide Cross-Cutting Patterns

- JSON collection casts are frequently used as a shortcut to avoid creating normalized table schemas, leading to long-term scalability and queryability issues
- The encrypted vs non-encrypted distinction is often ignored — teams use `AsCollection` for everything including sensitive data
- Collections with high element counts accumulate silently, causing progressive performance degradation of `save()` due to dirty detection overhead

---

## 1. JSON Column Used as a Queryable Table

### Category
Architecture

### Description
Using a JSON collection cast to store data that has a fixed schema and needs to be queried via `WHERE` clauses, joined with other tables, or indexed. The JSON column becomes a "data dump" that cannot be efficiently searched or validated.

### Why It Happens
JSON columns are easy to add — no migration for a new table, no relationship setup, no join logic. Teams choose JSON for speed of development without considering long-term query requirements. Fixed-schema data (addresses, contacts, order items) is stored as JSON because it seems simpler.

### Warning Signs
- Queries using `JSON_CONTAINS`, `JSON_EXTRACT`, or `->>` operators that would be simple `WHERE` clauses with normalized tables
- Application code filtering collection data in PHP because the database cannot filter it efficiently
- Reports, exports, or admin panels that cannot query against JSON field values
- Database queries against JSON columns causing full table scans
- Schema migrations that must parse and transform JSON data

### Why Harmful
- JSON columns cannot be indexed efficiently, causing full table scans on queries
- No foreign key constraints, referential integrity, or type enforcement at the database level
- Queries that would be simple `WHERE` clauses become complex JSON path expressions with poor performance
- Scaling requires extracting the JSON data to a real table — a complex migration
- Database-level tooling (migration validation, schema comparison) cannot validate JSON structure

### Consequences
- Slow queries that worsen as table size grows
- Inability to enforce data integrity at the database level
- Costly migrations when JSON data eventually needs normalization
- Data quality issues from invalid JSON structures
- Limited reporting and analytics capabilities

### Preferred Alternative
```php
// Normalized table instead of JSON collection
class User extends Model
{
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}
```

### Refactoring Strategy
1. Identify JSON columns used for queryable, fixed-schema data
2. Design a normalized table schema for the data
3. Create migration to extract JSON data to the new table
4. Update queries to use Eloquent relationships instead of JSON operators
5. Remove the JSON column and collection cast

### Detection Checklist
- [ ] Search for `JSON_CONTAINS`, `JSON_EXTRACT`, `->>` in raw queries
- [ ] Review code that reads the entire collection and filters in PHP
- [ ] Check for application logic that assumes a fixed schema within JSON
- [ ] Profile queries involving JSON columns for full table scans
- [ ] Assess whether the data structure is truly dynamic or has a fixed schema

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Prefer Normalized Tables Over JSON Collections |
| Decision Tree | `07-decision-trees.md` — Decision 1: JSON Collection vs Normalized Table |
| Knowledge | `04-standardized-knowledge.md` — Prefer normalized tables |

---

## 2. Unencrypted Sensitive Data in JSON Collections

### Category
Security

### Description
Using non-encrypted collection casts (`AsCollection`, `AsArrayObject`) for JSON arrays containing personally identifiable information, credentials, secrets, or compliance-regulated data. The data is stored as plaintext in the database.

### Why It Happens
Developers default to `AsCollection` because it's the most commonly used variant. The encrypted variants (`AsEncryptedCollection`, `AsEncryptedArrayObject`) are less known. Security considerations are an afterthought during initial implementation.

### Warning Signs
- `AsCollection` or `AsArrayObject` used for attributes named `secrets`, `credentials`, `payment_methods`, `pii_data`
- Plaintext JSON in database dumps or backups containing sensitive values
- Compliance audit flags JSON columns with sensitive data
- The model attribute contains data that should be encrypted by policy (SSN, DOB, financial data)

### Why Harmful
- Compliance violations: GDPR, PCI-DSS, HIPAA, and other regulations require encryption at rest
- Database backups expose sensitive data to anyone with file access
- Database compromises leak all JSON values in plaintext
- No defense in depth — the single App Key rotation failure exposes historical data

### Consequences
- Legal and regulatory penalties for non-compliance
- Data breach risk amplification — JSON collections are easy to dump in bulk
- Sensitive data exposed in database logs, replicas, and development dumps
- Trust erosion if customers discover their sensitive data was stored in plaintext

### Preferred Alternative
```php
protected $casts = [
    'payment_methods' => AsEncryptedCollection::class,
];
```

### Refactoring Strategy
1. Audit all collection casts for sensitive data handling
2. Identify which attributes contain PII, secrets, or compliance data
3. Switch the cast to `AsEncryptedCollection` or `AsEncryptedArrayObject`
4. Create a migration to encrypt existing plaintext data
5. Remove any code that accesses the raw unencrypted value directly

### Detection Checklist
- [ ] Audit all `AsCollection` and `AsArrayObject` usages for data sensitivity
- [ ] Check attribute names for indicators of sensitive data
- [ ] Review compliance requirements for the application's data types
- [ ] Examine database backups for plaintext sensitive JSON content
- [ ] Verify that encrypted variants are documented as the default for sensitive attributes

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Encrypted Variants for Sensitive Collection Data |
| Decision Tree | `07-decision-trees.md` — Decision 3: Encrypted vs Non-Encrypted |
| Knowledge | `04-standardized-knowledge.md` — Encrypted variants for sensitive data |

---

## 3. Plain Array Cast for Enum Collections

### Category
Design

### Description
Using the basic `array` cast to store a JSON array of enum backing values as plain strings, losing type safety and requiring manual validation and `from()` calls throughout the codebase.

### Why It Happens
Developers are familiar with the `array` cast and may not know about `AsEnumCollection`. If the enum collection is a secondary concern (not the main data), it's easy to default to the simpler cast. Legacy code may predate the enum collection feature.

### Warning Signs
- `$casts` entry uses `'array'` for a JSON column storing enum-like values
- Manual `from()` calls on array values retrieved from the model
- Code that filters or validates array values to ensure they are valid enum cases
- Runtime errors from invalid enum values that weren't caught during validation

### Why Harmful
- Invalid enum values are silently stored in the database — no validation at the cast level
- Every read requires manual `from()` calls, scattered across the codebase
- Type safety is lost — the array could contain any string, not just valid enum cases
- Refactoring: removing or renaming an enum case misses invalid values stored in JSON
- Testing must account for invalid values that should never exist

### Consequences
- Invalid enum data accumulating in the database over time
- Repetitive `from()` calls duplicated across controllers, services, and views
- Runtime errors from unhandled invalid enum values
- Inconsistent handling: some code validates, some doesn't

### Preferred Alternative
```php
protected $casts = [
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
];
```

### Refactoring Strategy
1. Identify `array` casts that store enum backing values
2. Determine the PHP enum class that the values represent
3. Switch to `AsEnumCollection` or `AsEnumArrayObject` with the enum class
4. Add a migration to validate existing data
5. Remove manual `from()` calls from the codebase

### Detection Checklist
- [ ] Search for `'array'` cast on JSON columns storing enum-like values
- [ ] Search for `from(` calls immediately after accessing cast attributes
- [ ] Look for validation logic that checks array values against enum cases
- [ ] Check for runtime errors related to invalid enum values in JSON arrays
- [ ] Review the data type of values stored in JSON arrays

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use AsEnumCollection for Typed Enum Arrays |
| Decision Tree | `07-decision-trees.md` — Decision 2: AsCollection vs Enum Variant |
| Skill | `06-skills.md` — Enum variant for typed enum arrays |

---

## 4. VARCHAR Column for JSON Data

### Category
Reliability

### Description
Using a `VARCHAR` or `STRING` column type with a length limit for attributes that use collection casts. Large JSON arrays are silently truncated when they exceed the column length, causing data loss.

### Why It Happens
Legacy schemas may use `VARCHAR` by default. Developers change the cast type without updating the column type. The collection works during development with small data but fails silently in production with real data.

### Warning Signs
- Migration uses `$table->string('metadata')` or `$table->string('items', 255)` instead of `->json()`
- Collection attribute returns null or truncated data for records with large JSON content
- Data loss when saving collections with many elements
- The column type is `VARCHAR` or `TEXT` without JSON enforcement

### Why Harmful
- Silent data truncation: JSON arrays longer than the column limit are cut off
- Data loss is invisible during normal application flow — no error is thrown
- Recovering truncated data requires manual intervention and data restoration
- The application appears to work until the collection exceeds the column length

### Consequences
- Permanent data loss for JSON arrays exceeding column length
- Corrupted collection data that returns null or partial arrays on read
- Debugging difficulty: the symptom (missing data) is far from the cause (column type)
- Emergency migrations to fix column types after data loss has occurred

### Preferred Alternative
```php
Schema::table('users', function (Blueprint $table) {
    $table->json('metadata')->nullable();
});
```

### Refactoring Strategy
1. Identify all collection casts whose columns are not `JSON` or `TEXT`
2. Create migrations to change column types to `JSON`
3. For existing data, verify no truncation has occurred
4. Update the column type in schema files and documentation

### Detection Checklist
- [ ] Cross-reference collection cast attributes with their database column types
- [ ] Search for `string(` or `->string(` column definitions for JSON attributes
- [ ] Check for `VARCHAR` column types on attributes with collection casts
- [ ] Test with large JSON arrays to verify no silent truncation

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Ensure Database Column Type Is JSON or TEXT |
| Knowledge | `04-standardized-knowledge.md` — JSON column requirement |
| Skill | `06-skills.md` — Step 3: Ensure migration uses json() or text() |

---

## 5. Massively Overgrown JSON Collections

### Category
Performance

### Description
JSON collection attributes that accumulate thousands of elements over time, causing progressive performance degradation of `save()` due to dirty detection comparing the full collection on every write, and JSON decode overhead on every read.

### Why It Happens
JSON collections are easy to append to — no new table, no new relationship. Event logging, activity tracking, and data accumulation patterns naturally cause unbounded collection growth. Teams don't monitor collection sizes or set limits.

### Warning Signs
- Collections named `event_log`, `activity`, `history`, `audit_trail` using `AsCollection`
- Growing `save()` latency on models with collection attributes
- Debug toolbar showing long `isDirty()` times
- Collections exceeding 1000 elements in production
- Manual collection trimming or archiving logic in application code

### Why Harmful
- Every `save()` compares the full original and current collection arrays (O(n)) — even if nothing changed
- JSON decode on every read parses the entire array — O(n) per attribute access
- Performance degrades linearly with collection size
- No database-level indexing or pagination for the collection contents

### Consequences
- Increasing `save()` latency as data grows
- Memory pressure from loading large collections on every model access
- Slow serialization and API responses for models with large collections
- Eventual breaking point where the model becomes unusably slow

### Preferred Alternative
```php
// Large datasets belong in a normalized table
public function eventLog(): HasMany
{
    return $this->hasMany(EventLog::class);
}
```

### Refactoring Strategy
1. Identify collection casts with unbounded growth patterns
2. Create a normalized table for the data
3. Write a migration to extract existing collection data to the new table
4. Update queries to use the relationship instead of the collection cast
5. Add application-level limits or pagination to prevent future unbounded growth

### Detection Checklist
- [ ] Profile `save()` latency on models with collection casts
- [ ] Check production data for collection element counts
- [ ] Review attribute names that suggest logging or accumulation
- [ ] Monitor memory usage during serialization of models with collection casts
- [ ] Assess whether the collection data is truly bounded or grows over time

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Be Aware of Dirty Detection Overhead for Large Collections |
| Decision Tree | `07-decision-trees.md` — Decision 1: JSON vs Normalized Table |
| Skill | `06-skills.md` — Be aware of dirty detection, normalize large datasets |

---

## 6. Wrong Cast Variant for the Use Case

### Category
Design

### Description
Using a collection cast variant that doesn't match the data access pattern — `AsArrayObject` when the Collection API is needed, `AsCollection` when mutable-by-reference behavior is required, or plain `array` cast when the rich API would be beneficial.

### Why It Happens
Developers may not understand the differences between `AsCollection`, `AsArrayObject`, and plain `array`. The first example found in existing code becomes the default, even if it's the wrong variant. Team conventions may lock in one variant for all cases.

### Warning Signs
- Code that converts `ArrayObject` to `Collection` after every read (`collect($model->metadata)`)
- Model mutations that don't persist because `AsArrayObject` was expected but `AsCollection` requires reassignment
- Missing `map()`, `filter()`, `reduce()` access on attributes that would benefit from the Collection API
- Manual property setting on `ArrayObject` when mutability was not the goal

### Why Harmful
- `AsArrayObject` without needing mutable references: developers must reassign or convert to Collection to use familiar methods
- `AsCollection` when mutable-by-reference needed: mutations without reassignment don't persist
- Plain `array` cast when Collection API would be useful: manual conversion, missing features
- Forces workarounds (conversion, reassignment) that add code complexity

### Consequences
- Extra boilerplate to convert between collection types
- Subtle bugs: mutations that look correct but don't persist
- Missed productivity from Collection API methods
- Inconsistent patterns across the codebase
- Developers learning the wrong variant first, then perpetuating the pattern

### Preferred Alternative
```php
// AsCollection for full Collection API
protected $casts = [
    'metadata' => AsCollection::class,
];

// AsEnumCollection for typed enum arrays
protected $casts = [
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
];
```

### Refactoring Strategy
1. Review each collection cast variant against its usage pattern
2. For attributes where developers convert to Collection after read, switch to `AsCollection`
3. For attributes where mutations must persist without reassignment, switch to `AsArrayObject`
4. For plain `array` casts that are manipulated with Collection methods, switch to `AsCollection`
5. Update any workaround conversion code

### Detection Checklist
- [ ] Search for `collect($model->` (converting ArrayObject or array to Collection)
- [ ] Search for `$model->attribute = $model->attribute->` (reassignment pattern common with AsCollection)
- [ ] Check for manual `push()`, `add()`, or array operations on cast attributes
- [ ] Review if plain `array` casts are being used with Collection-like methods
- [ ] Verify that the chosen variant matches the actual data access patterns

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Decision 2: AsCollection vs AsArrayObject vs Enum |
| Knowledge | `04-standardized-knowledge.md` — Six variants overview |
| Skill | `06-skills.md` — Choose the correct variant |
