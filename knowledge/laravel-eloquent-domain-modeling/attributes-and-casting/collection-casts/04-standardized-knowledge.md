# Collection Casts

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Collection Casts |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Collection casts transform JSON database columns into strongly-typed PHP collection/value-object wrappers. Laravel provides six variants: `AsArrayObject`, `AsEncryptedArrayObject`, `AsCollection`, `AsEncryptedCollection`, `AsEnumArrayObject`, and `AsEnumCollection`. These extend the basic `array` cast with richer data structures, type safety (for enums), and encryption support.

## Core Concepts

- **AsArrayObject**: Returns `ArrayObject` — mutable, changes reflected without reassignment
- **AsCollection**: Returns Laravel `Collection` — full API: `map()`, `filter()`, `reduce()`
- **AsEncryptedArrayObject / AsEncryptedCollection**: Combines JSON collection with encryption at rest
- **AsEnumArrayObject / AsEnumCollection**: Wraps JSON array of enum values with typed elements
- **JSON column requirement**: All collection casts need JSON or TEXT column type
- **Dirty detection**: Mutable collections track internal changes; model is marked dirty when collection content changes

## When To Use

- You store JSON arrays and want a rich API to manipulate them
- You need encrypted JSON collections for sensitive array data
- You store arrays of enum values and want type safety

## When NOT To Use

- The data is better normalized into a related table (JSON columns sacrifice queryability)
- You only need simple array access (use `array` cast)
- The data has a fixed schema (use a related table with typed columns)

## Best Practices

- **Prefer normalized tables over JSON collections**: JSON columns are not joinable and harder to validate. Use collection casts only for genuinely dynamic or denormalized data.
- **Use encrypted variants for sensitive array data**: `AsEncryptedCollection` provides transparent encryption for JSON arrays containing PII or secrets.
- **Be aware of dirty detection overhead**: Mutable collections track changes via array comparison. For very large collections, this adds measurable overhead on `save()`.

## Architecture Guidelines

- Use `AsCollection` for dynamic metadata, tags, or settings arrays
- Use `AsEnumCollection` for typed enum arrays (roles, permissions, categories)
- Use `AsEncryptedCollection` for sensitive configuration or PII arrays
- Database column must be `JSON` or `TEXT` with JSON content

## Performance Considerations

- JSON decode on every read — for large datasets, consider caching or normalization
- Dirty detection compares the full collection on `isDirty()` — O(n) for array comparison
- Encrypted variants add encryption/decryption overhead per read/write

## Security Considerations

- Encrypted variants (`AsEncryptedCollection`, `AsEncryptedArrayObject`) protect sensitive array data at rest
- Collection casts deserialize JSON — ensure the JSON source is trusted

## Examples

```php
protected $casts = [
    'metadata' => AsCollection::class,
    'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
    'secrets' => AsEncryptedCollection::class,
];
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Closely Related | Encrypted Casts |
| Closely Related | Enum Casts |
| Advanced | Custom Casts |

## AI Agent Notes

- Prefer normalized tables over JSON collections for queryable data
- Use `AsEnumCollection` with colon-separated enum class for typed arrays
- Encrypted variants protect sensitive array data at rest

## Verification

- [ ] JSON column type is `JSON` or `TEXT`
- [ ] Collection cast class matches data usage (Collection vs ArrayObject)
- [ ] Encrypted variants used for sensitive array data
- [ ] Dirty detection behavior is understood for mutable collections
