# Primitive Casts — Skills

---

## Skill 1: Configure Primitive Casts for Type Consistency

### Purpose
Set up built-in primitive casts on an Eloquent model to coerce database values to the correct PHP type (int, bool, float, string, array, object, collection, decimal) on read and back on write.

### When To Use
- You need consistent PHP types from database values (always `int`, always `bool`)
- You store JSON in database columns and want automatic array/object/collection hydration
- You work with monetary values requiring exact decimal precision (`decimal:2`)

### When NOT To Use
- You need custom transformation logic (use custom casts or accessors/mutators)
- The JSON structure is complex and needs typed value objects (use collection casts)
- You need encryption at rest (use encrypted casts)

### Prerequisites
- Understanding of database column type mapping to PHP types
- JSON column type for `array`, `object`, or `collection` casts

### Inputs
- Attribute names and their desired PHP types
- Decimal precision for `decimal:N` cast

### Workflow

1. **Add to `$casts`** with primitive type strings:
   ```php
   protected $casts = [
       'is_admin' => 'boolean',
       'total_cents' => 'integer',
       'price' => 'decimal:2',
       'metadata' => 'array',
       'tags' => 'collection',
   ];
   ```

2. **Use `decimal:N` for monetary values** — never `float` for currency

3. **Ensure JSON columns use `json()` migration type**

4. **Use `bool` cast for boolean columns** — prevents truthiness bugs in Blade

5. **Prefer `array` cast over serialization** — JSON is queryable via database JSON functions

### Validation Checklist
- [ ] Monetary values use `decimal:N` cast
- [ ] Boolean columns use `bool` cast
- [ ] JSON columns use `array`, `object`, or `collection` casts
- [ ] Database column type matches the cast requirement
- [ ] Casts defined in `casts()` method (Laravel 11+) or `$casts` property

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Float precision errors | Using `float` for monetary values | Use `decimal:N` |
| Truthiness bugs | Integer 0/1 from boolean column | Use `bool` cast |
| JSON truncation | VARCHAR column for JSON data | Use `json()` in migrations |

### Decision Points
- **Monetary value?** → Use `decimal:N`
- **Boolean flag?** → Use `bool`
- **JSON data?** → Use `array` (queryable), `object` (stdClass), or `collection`
- **Integer column?** → Use `integer` (for PostgreSQL compatibility)

### Performance Considerations
- Primitive casts are extremely fast — simple PHP type coercions or JSON encode/decode
- JSON decode on every read for `array`/`object`/`collection` — consider caching for large blobs

### Security Considerations
- `array`, `object`, `collection` casts deserialize JSON — ensure JSON source is trusted
- Never use `array` cast for columns with potentially malicious serialized content

### Related Rules
| Rule | Reference |
|---|---|
| Use decimal:N for monetary values, never float | `05-rules.md` |
| Use bool cast for boolean database columns | `05-rules.md` |
| Prefer array cast over serialization for JSON | `05-rules.md` |
| Use JSON column type for array/object/collection casts | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Cast a JSON Column to a Typed Collection | Advanced collection casts |
| Configure Date/Time Casting | Date-specific primitive casts |
| Configure Immutable Date/Time Casting | Immutable variant of date casts |

### Success Criteria
- Model attributes return correct PHP types from database reads
- Monetary values have exact decimal precision with `decimal:N`
- Boolean columns return `true`/`false`
- JSON columns hydrate as configured (array, stdClass, or Collection)
