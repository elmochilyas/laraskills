# Collection Casts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Collection casts transform JSON database columns into strongly-typed PHP collection/value-object wrappers on read and back to JSON on write. Laravel provides six variants: `AsArrayObject` (mutable array-like object), `AsEncryptedArrayObject` (encrypted version), `AsCollection` (Laravel `Collection`), `AsEncryptedCollection` (encrypted version), `AsEnumArrayObject` (enum-typed array object), and `AsEnumCollection` (enum-typed collection). These casts extend the basic `array` cast with richer data structures, type safety (for enums), and encryption support.

## Core Concepts
- **`AsArrayObject` cast:** Returns the attribute as `\Illuminate\Database\Eloquent\Casts\ArrayObject` (extends PHP's `ArrayObject`). Mutable — changes to the object are reflected without re-assignment.
- **`AsCollection` cast:** Returns the attribute as a Laravel `\Illuminate\Support\Collection`. Provides the full Collection API (`map()`, `filter()`, `reduce()`, etc.).
- **`AsEncryptedArrayObject` and `AsEncryptedCollection`:** Same as above, but the JSON is encrypted at rest (AES-256) in the database. Combines encryption with mutable collection behavior.
- **`AsEnumArrayObject` and `AsEnumCollection`:** Wraps a JSON array of enum values into an `ArrayObject` or `Collection`, where each element is cast to a specified enum type.
- **JSON column requirement:** All collection casts require the database column to store JSON (typically `JSON` or `TEXT` with JSON content).
- **Dirty detection:** Mutable collections track changes internally. When the collection is modified and the model is saved, Laravel detects the change because the collection object identity remains the same but internal state changed.

## Mental Models
- **Rich JSON Wrapper:** Instead of a plain PHP array (`array` cast), collection casts wrap the JSON data in a feature-rich object (Collection, ArrayObject) with methods for data manipulation.
- **Mutable Document Store:** The cast treats the column as a mini-document store. You can push items, filter, transform, and save — all through the collection API.
- **Encrypted + Structured:** `AsEncryptedCollection` is the combination of JSON serialization (structured) + encryption (secure) + collection API (usable). A single cast handles all three concerns.

## Internal Mechanics
1. **Read path:** `Model::getAttribute()` → cast's `get()` method → `json_decode($value, true)` → wrap in the target type (`new Collection($array)`, `new ArrayObject($array)`, etc.).
2. **Write path:** `Model::setAttribute()` → cast's `set()` method → extract array from `Collection`/`ArrayObject` (via `$value->toArray()` or `iterator_to_array()`) → `json_encode()` → store in `$attributes`.
3. For encrypted variants, the JSON string is additionally encrypted with `Crypt::encrypt()` before storage and decrypted with `Crypt::decrypt()` after reading.
4. For enum variants, each element is cast to the specified enum type via `$enum::from($element)` on read and `$element->value` on write.
5. Dirty detection: `Model::isDirty()` calls `Collection::isEqual()` or `ArrayObject::getArrayCopy()` to compare current value with original. If the collection items changed, the model is marked dirty.
6. The cast class is specified as `$casts = ['attribute' => AsCollection::class . ':' . MyEnum::class]` for enum variants, with the enum class passed as a colon-separated parameter.

## Patterns
- **Tags/Categories Storage:** Use `AsCollection` for a `tags` JSON column — `$post->tags->push('laravel')` and save.
- **Encrypted Preferences:** Use `AsEncryptedArrayObject` for user preferences that should not be readable in the database (PII preferences, feature flags).
- **Enum-Based Roles:** Use `AsEnumCollection` with a `RoleEnum` for multiple roles per user stored in a JSON column.
- **Mutable Array with Change Tracking:** Use `AsArrayObject` for a `metadata` column that is frequently updated in-place. Avoids serialization/re-deserialization overhead.
- **Encrypted Audit Trail:** Use `AsEncryptedArrayObject` for storing encrypted event metadata in audit logs.
- **Setting default collection value:** Override `$attributes['tags'] = '[]'` in the model to default to an empty collection instead of null.

## Architectural Decisions
- **Decision:** Collection casts are mutable by default.
  - **Rationale:** `ArrayObject` and `Collection` are mutable. Modifications in-place are the primary use case. Immutability can be achieved via `->toArray()` and manual cloning.
- **Decision:** Encrypted variants use JSON-then-encrypt, not encrypt-then-JSON.
  - **Rationale:** JSON encoding first ensures the data structure is serializable. Encrypting after JSON means the database stores encrypted binary, not valid JSON — which is fine since encrypted data is opaque.
- **Decision:** Enum variants require the enum class as a cast parameter.
  - **Rationale:** The cast needs to know the target enum type for `from()` calls. Colon-syntax (`AsCollection::class . ':StatusEnum'`) is consistent with other parameterized casts.
- **Decision:** Dirty detection works by comparing serialized arrays.
  - **Rationale:** Two `Collection` instances with the same content should be treated as equal. Serialization to array and comparison avoids object reference issues.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Rich Collection API on JSON columns | Mutable collections can be modified without explicit assignment | Always re-save model after collection mutation |
| Transparent encryption for collection data | Encrypted collection queries not filterable | Load model and filter in memory |
| Enum type safety in JSON arrays | Enum class must be specified in cast definition | Refactoring enum class requires updating cast strings |
| Change tracking works automatically | Large collections (1000+ items) slow dirty detection | Keep JSON columns under 100 items for production |
| Encrypted + collection in one cast | Debugging encrypted collections is harder | Log collection contents before encryption in development |

## Performance Considerations
- `AsCollection` cast overhead: `json_decode` (~1-5µs for typical data) + `new Collection()` (~0.5µs). Comparable to `array` cast.
- `AsArrayObject` is slightly faster than `AsCollection` (~0.3µs less) because it wraps rather than transforms the array.
- Encrypted variants add encryption/decryption overhead (~1-3ms per operation). Cache decrypted values in memory if accessed frequently.
- Dirty detection for collections compares serialized sizes and contents. For large collections (500+ items), this adds ~1-10ms per `isDirty()` call.
- In Octane, collection objects from previous requests must not be retained. Ensure model instances are not cached across requests.

## Production Considerations
- Encrypted collection columns must be `TEXT` or `BLOB` type — ciphertext is ~40% larger than the JSON string.
- Large JSON collections slow down `SELECT *` queries. Consider selecting only needed columns: `Model::select('id', 'name')->get()`.
- Mutation tracking: after `$model->tags->push('new')`, call `$model->save()`. The model detects dirtiness via the cast's `set()` method on save.
- Concurrent updates to the same JSON column can cause lost updates. Use database transactions or optimistic locking for high-concurrency scenarios.
- For API responses, `AsCollection`-cast attributes serialize as arrays in `toArray()`.

## Common Mistakes
- **Using `AsCollection` instead of `AsArrayObject` for simple arrays:** `Collection` is heavier than `ArrayObject`. Use `AsArrayObject` when you only need array access.
- **Modifying a collection without saving:** `$model->items->push('x')` mutates the collection but the model is not automatically saved. Always call `$model->save()`.
- **Forgetting to re-assign after `Collection::filter()`:** `filter()`, `reject()`, and similar methods return a new collection. `$model->items = $model->items->filter(...)` replaces the attribute.
- **Expecting `AsCollection` to return persistent references:** Each read creates a new `Collection` instance from the decoded JSON. Modifying the collection and reading again returns a fresh collection.
- **Using `AsEnumCollection` without specifying the enum class:** `$casts = ['roles' => AsEnumCollection::class]` fails because the enum class is required. Use `AsEnumCollection::class . ':RoleEnum'`.
- **Null vs. empty collection:** If the JSON column is `NULL` in the database, the cast returns `null`. Set `$attributes['tags'] = '[]'` in the model to default to an empty collection.

## Failure Modes
- **JSON decode failure in collection cast:** If the stored value is not valid JSON, `json_decode()` returns `null` and the collection is initialized as empty. Data loss is silent — validate all writes.
- **Encrypted collection data loss on key rotation:** Changing `APP_KEY` without a migration makes encrypted collections undecryptable. Plan key rotation with data re-encryption.
- **Enum mismatch in `AsEnumCollection`:** If a JSON array contains a value that does not correspond to a valid enum case, `from()` throws. Catch this in global exception handler or validate data before storage.
- **Serialization error in queue:** Collection objects must be serializable for queue dispatch. `Collection` and `ArrayObject` are serializable by default, but custom objects inside them may not be.
- **Race condition on concurrent writes:** Two requests simultaneously push to the same JSON column. The second write overwrites the first. Use JSON column updates with `json_array_append()` or serialize in application with locking.

## Ecosystem Usage
- **Laravel Nova:** `AsCollection`-cast attributes display as JSON in Nova detail views. Use `JSON::make('tags')` for inline editing.
- **Laravel API Resources:** Collection-cast attributes serialize as arrays in `toArray()`. Override `toArray()` if you need custom serialization (e.g., formatted tags).
- **Laravel LiveWire:** LiveWire handles collection cast values natively. Mutations to collections in LiveWire components trigger re-renders and save correctly.
- **Laravel Spatie / Media-Library:** Custom collections for media attachments use `AsCollection` casts in some implementations.
- **MongoDB / Laravel MongoDB:** Collection casts are especially relevant for MongoDB document databases where JSON columns are the primary data model.

## Related Knowledge Units

### Prerequisites
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — the base `array` cast is the foundation for all collection casts.
- [Eloquent Collections](../../../laravel-core-application-engineering/collections/eloquent-collections/02-knowledge-unit.md) — Laravel Collection API that `AsCollection` wraps.

### Related Topics
- [Encrypted Casts](../encrypted-casts/02-knowledge-unit.md) — encryption mechanics shared by `AsEncryptedArrayObject` and `AsEncryptedCollection`.
- [Enum Casts](../enum-casts/02-knowledge-unit.md) — enum casting that `AsEnumArrayObject` and `AsEnumCollection` build upon.

### Advanced Follow-up Topics
- [Custom Collection Casts](../../domain-modeling-patterns/custom-casts/02-knowledge-unit.md) — creating custom collection-like casts for specialized data structures.
- [JSON Column Performance](../../../laravel-core-application-engineering/database/json-columns/02-knowledge-unit.md) — indexing and querying JSON columns efficiently.

## Research Notes
- Collection cast classes are defined in `Illuminate\Database\Eloquent\Casts\` namespace: `AsArrayObject`, `AsCollection`, `AsEnumArrayObject`, `AsEnumCollection`, and their encrypted counterparts.
- `AsArrayObject` extends PHP's `\ArrayObject` and implements Laravel's `Illuminate\Contracts\Support\Arrayable` interface, making it compatible with Blade and JSON serialization.
- `AsCollection` cast was introduced in Laravel 5.x alongside the `collection` cast alias. The prefixed variants (`AsCollection::class`) were added in Laravel 9+ for consistency with the modern cast class syntax.
- The encrypted variants (`AsEncryptedArrayObject`, `AsEncryptedCollection`) were added in Laravel 10 to address the common need for encrypted JSON storage with a usable PHP interface.
- The enum variants (`AsEnumArrayObject`, `AsEnumCollection`) were added in Laravel 11 alongside general enum cast improvements.
- Dirty detection for collections uses `serialize()` comparison rather than identity comparison, allowing two collections with the same content to be considered equal.
