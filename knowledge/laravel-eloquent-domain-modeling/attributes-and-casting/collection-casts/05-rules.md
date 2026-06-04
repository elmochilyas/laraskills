## Prefer Normalized Tables Over JSON Collections
---
## Category
Architecture
---
## Rule
Use normalized database tables instead of JSON collection casts when the data has a fixed schema, needs to be queried via `WHERE` clauses, joined with other tables, or indexed.
---
## Reason
JSON columns sacrifice queryability, cannot be indexed efficiently, do not support foreign key constraints, and are invisible to database migration tooling for schema changes. Normalized tables provide referential integrity, query performance, and schema enforcement.
---
## Bad Example
```php
protected $casts = [
    'tags' => AsCollection::class,
];
// Query: cannot efficiently find all users with a specific tag
```
---
## Good Example
```php
// Normalized many-to-many relationship
class User extends Model
{
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
}
```
---
## Exceptions
Use JSON collections for truly dynamic metadata (user preferences, feature flags, flexible settings schemas) where the structure varies per record and is never queried directly.
---
## Consequences Of Violation
Poor query performance on JSON column filters, inability to use database-level integrity constraints, complex migration paths when schema evolves, scalability issues under load.

---
## Use Encrypted Variants for Sensitive Collection Data
---
## Category
Security
---
## Rule
Use `AsEncryptedCollection` or `AsEncryptedArrayObject` when the JSON array contains personally identifiable information, credentials, secrets, or any data requiring encryption at rest.
---
## Reason
JSON columns store data as plaintext in the database. Unencrypted JSON collections expose sensitive array data through database dumps, backups, and direct database access. Encrypted variants provide transparent AES-256 encryption.
---
## Bad Example
```php
protected $casts = [
    'payment_methods' => AsCollection::class, // Plaintext credit card metadata
];
```
---
## Good Example
```php
protected $casts = [
    'payment_methods' => AsEncryptedCollection::class,
];
```
---
## Exceptions
When the array data is non-sensitive (UI preferences, layout settings, display options), the non-encrypted variant is acceptable and avoids unnecessary overhead.
---
## Consequences Of Violation
Compliance violations (GDPR, PCI, HIPAA), exposure of sensitive data in database backups, data breach risk amplification.

---
## Use AsEnumCollection for Typed Enum Arrays
---
## Category
Design
---
## Rule
Use `AsEnumCollection` or `AsEnumArrayObject` with a colon-separated enum class for JSON arrays of enum values. Do not store enum backing values as plain strings in JSON arrays.
---
## Reason
Enum collection casts provide type safety, validation on access, and eliminate manual `from()` calls. Plain string arrays allow invalid values, require manual validation, and lose the type-safety benefits of PHP enums.
---
## Bad Example
```php
protected $casts = [
    'roles' => 'array', // Stores ['admin', 'editor'] as plain strings
];
```
---
## Good Example
```php
protected $casts = [
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
];
```
---
## Exceptions
When the JSON array must be readable by non-PHP systems that cannot deserialize enum format, use plain array cast and validate manually at the application boundary.
---
## Consequences Of Violation
Invalid enum values silently stored in the database, manual `from()` calls scattered across the codebase, type safety gaps, runtime errors from unhandled invalid values.

---
## Ensure Database Column Type Is JSON or TEXT
---
## Category
Reliability
---
## Rule
Always use `JSON` (preferred) or `TEXT` database column type for attributes using collection casts. Never use `VARCHAR` with insufficient length.
---
## Reason
Collection casts store JSON-encoded strings. `JSON` columns validate the format at the database level, support JSON path queries, and have no length limit. `VARCHAR` columns truncate long JSON strings silently, causing data loss.
---
## Bad Example
```php
// Migration uses VARCHAR(255) — truncates JSON arrays longer than 255 chars
Schema::table('users', function (Blueprint $table) {
    $table->string('metadata', 255)->nullable();
});
```
---
## Good Example
```php
Schema::table('users', function (Blueprint $table) {
    $table->json('metadata')->nullable();
});
```
---
## Exceptions
When the database does not support JSON columns (e.g., SQLite), use `TEXT` as the alternative.
---
## Consequences Of Violation
Silent data truncation for large JSON arrays, data loss during save, `null` returned for truncated or malformed JSON on read, debugging nightmares.

---
## Be Aware of Dirty Detection Overhead for Large Collections
---
## Category
Performance
---
## Rule
Monitor the size of collection-cast attributes. For collections exceeding 1000 elements, evaluate whether dirty detection comparison overhead impacts `save()` performance.
---
## Reason
Eloquent compares the current and original collection values to detect dirtiness. For large collections, this array comparison is O(n) and adds measurable overhead every time the model is saved, even when the collection hasn't changed.
---
## Bad Example
```php
// Logging 10k+ events per user in a JSON collection
protected $casts = [
    'event_log' => AsCollection::class, // Full comparison on every save
];
```
---
## Good Example
```php
// Large datasets belong in a normalized table
public function eventLog(): HasMany
{
    return $this->hasMany(EventLog::class);
}
```
---
## Exceptions
When the collection is small (under 100 elements) or saved infrequently, dirty detection overhead is negligible.
---
## Consequences Of Violation
Slow `save()` operations as collection size grows, unnecessary CPU cycles comparing unchanged data, degraded write throughput under load.
