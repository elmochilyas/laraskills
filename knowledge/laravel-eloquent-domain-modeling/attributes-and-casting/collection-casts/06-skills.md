# Collection Casts — Skills

---

## Skill 1: Cast a JSON Column to a Typed Collection

### Purpose
Register a collection cast on a JSON database column to return a typed Laravel `Collection`, `ArrayObject`, or enum collection instead of a plain array.

### When To Use
- You store JSON arrays and want a rich Collection API (map, filter, reduce)
- You need encrypted JSON collections for sensitive array data
- You store arrays of enum values and want type safety

### When NOT To Use
- The data schema is fixed and better normalized into a related table
- You only need simple array access (use `array` cast)
- The collection will exceed thousands of elements (dirty detection overhead)

### Prerequisites
- JSON or TEXT database column type
- PHP enum class defined (for `AsEnumCollection`/`AsEnumArrayObject`)

### Inputs
- Collection cast class (`AsCollection`, `AsArrayObject`, `AsEnumCollection`, etc.)
- Enum class (for enum collection variants)
- Whether encryption at rest is needed

### Workflow

1. **Choose the correct variant** based on needs:
   - `AsCollection` — Laravel Collection API
   - `AsArrayObject` — mutable by reference, no reassignment needed
   - `AsEnumCollection` — typed enum array
   - `AsEncryptedCollection` — encrypted at rest

2. **Add to `$casts`** with the class reference:
   ```php
   protected $casts = [
       'metadata' => AsCollection::class,
       'roles' => AsEnumCollection::class . ':' . RoleEnum::class,
       'secrets' => AsEncryptedCollection::class,
   ];
   ```

3. **Ensure the migration uses `json()` or `text()`** column type

4. **Use the Collection API** — access methods on the returned instance

5. **Be aware of dirty detection** — mutable collections compare on every `save()`

### Validation Checklist
- [ ] Database column is `JSON` (preferred) or `TEXT`
- [ ] Encrypted variant used for sensitive data
- [ ] Enum variant used for typed enum arrays with colon-separated class
- [ ] Collection size is reasonable for dirty detection overhead

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Encrypted data not decrypting | APP_KEY changed after data was written | Document key rotation procedures |
| Enum collection returns null | Invalid enum value in DB | Migrate or handle null in code |
| Collection always dirty | Mutable collection comparison overhead on every save | Normalize large datasets to tables |

### Decision Points
- **Encryption needed?** → Use `AsEncryptedCollection` or `AsEncryptedArrayObject`
- **Collection API needed?** → Use `AsCollection`; otherwise `AsArrayObject`
- **Enum type safety?** → Use `AsEnumCollection` with colon-separated enum class

### Performance Considerations
- JSON decode on every read — O(n) for large collections
- Dirty detection compares full array on every `isDirty()` call
- Encrypted variants add encryption/decryption overhead per access

### Security Considerations
- Encrypted variants protect sensitive array data at rest
- Collection casts deserialize JSON — ensure JSON source is trusted

### Related Rules
| Rule | Reference |
|---|---|
| Prefer normalized tables over JSON collections | `05-rules.md` |
| Use encrypted variants for sensitive data | `05-rules.md` |
| Use AsEnumCollection for typed enum arrays | `05-rules.md` |
| Ensure database column is JSON or TEXT | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Cast an Attribute to a PHP Enum | Enum casts for single-value columns |
| Configure Encrypted Casts | Encrypted variants for collections |
| Configure Primitive Casts for Type Safety | Array cast as simpler alternative |

### Success Criteria
- JSON column returns typed Collection/ArrayObject on read
- Encrypted variants transparently decrypt on access
- Enum collections validate and return typed enum instances
- Dirty detection accurately tracks changes
