# Primitive Casting — Skills

---

## Skill 1: Configure Primitive Casts for Type Safety

### Purpose
Set up built-in primitive casts on an Eloquent model to automatically coerce database values to the correct PHP type (int, bool, float) on read and back to database types on write.

### When To Use
- Integer columns are stored as strings in the database but should be `int` in PHP
- Boolean columns use tinyint(1) and need `true`/`false` in PHP
- Float/real columns should be `float` in PHP
- You want type safety without custom cast classes

### When NOT To Use
- You need more than simple type coercion for the attribute
- The value should stay as a raw string for domain reasons
- The database driver already returns the correct PHP type

### Prerequisites
- Understanding of the database column type mapping to PHP

### Inputs
- Attribute names and their desired PHP types

### Workflow

1. **Add to `$casts`** with primitive type strings:
   ```php
   protected $casts = [
       'price' => 'integer',  // int column stored as string
       'is_active' => 'boolean',  // tinyint column
       'rating' => 'float',
       'metadata' => 'array',  // JSON column
       'config' => 'object',  // JSON column — stdClass
       'count' => 'real',  // same as float
   ];
   ```

2. **Use the full type string** (`'integer'` not `'int'`, `'boolean'` not `'bool'`)

3. **Do not use primitive casts for domain logic** they type-cast only — no validation or transformation

4. **JSON columns** use `'array'` or `'object'` — pick intentionally

5. **Combine with accessors** — use primitive casting for type safety and accessors for computed values

### Validation Checklist

- [ ] Cast type strings are from Laravel's supported list (integer, boolean, float, etc.)
- [ ] Database column type matches the cast (int column → integer cast)
- [ ] Null values are handled correctly (nullable columns cast to null, not 0 or false)
- [ ] No cast used as a substitute for validation or business logic
- [ ] Array vs object choice for JSON columns is deliberate

### Related Rules

| Rule | Reference |
|---|---|
| Use correct primitive type strings in $casts | `05-rules.md` Rule 1 |
| Use casts for type coercion, not business logic | `05-rules.md` Rule 2 |
| Handle nullable columns with optional cast | `05-rules.md` Rule 3 |
| Deliberately choose array vs object for JSON | `05-rules.md` Rule 4 |
| Combine primitive casts with accessors | `05-rules.md` Rule 5 |

### Success Criteria
- Model attributes return the correct PHP types from database reads
- Nullable columns return `null`, not coerced defaults
- JSON columns read as `array` or `stdClass` as configured
- Writes coerce back to database-appropriate types
