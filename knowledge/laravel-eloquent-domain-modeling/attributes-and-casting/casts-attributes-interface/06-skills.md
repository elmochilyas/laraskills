# CastsAttributes Interface — Skills

---

## Skill 1: Implement a Bidirectional Custom Cast

### Purpose
Create a custom cast class implementing `CastsAttributes` that transforms database values to PHP objects on read and back to database-safe values on write.

### When To Use
- You need to transform data between database and PHP in ways built-in casts don't support
- You need access to the model instance during casting
- You're implementing a value object that needs bidirectional conversion

### When NOT To Use
- A built-in cast covers your use case (int, bool, array)
- You only need read-only transformation (use an accessor)
- You only need write-only transformation (use `CastsInboundAttributes`)

### Prerequisites
- Understanding of the `CastsAttributes` interface
- Value object class (if casting to/from a value object)

### Inputs
- Attribute name and database column type
- PHP representation (value object or transformed type)
- Transformation logic for both directions

### Workflow

1. **Create the cast class** implementing `CastsAttributes` in `App\Casts\`

2. **Implement `get()`** — transform the stored value to the PHP representation:
   ```php
   public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
   {
       return $value === null ? null : new Money($value / 100, 'USD');
   }
   ```

3. **Implement `set()`** — transform the PHP value back to storage format:
   ```php
   public function set(Model $model, string $key, mixed $value, array $attributes): array
   {
       if ($value === null) {
           return [$key => null];
       }
       return [$key => $value instanceof Money ? $value->cents : (int) ($value * 100)];
   }
   ```

4. **Handle null explicitly** in both methods

5. **Accept both value object and scalar** in `set()`

6. **Register in the model**: `$casts = ['attribute' => CustomCast::class]`

7. **Keep cast methods fast** — no DB queries or external calls

### Validation Checklist

- [ ] Both `get()` and `set()` methods are implemented
- [ ] Null values are handled explicitly in both methods
- [ ] `set()` returns an associative array with `[$key => $value]`
- [ ] `set()` accepts both value objects and raw scalars
- [ ] Cast methods perform no database queries or external calls
- [ ] Cast is registered in the model's `$casts` array

### Related Rules

| Rule | Reference |
|---|---|
| Handle null explicitly in get and set | `05-rules.md` Rule 1 |
| Return full key-value array from set | `05-rules.md` Rule 2 |
| Keep cast methods fast — no DB queries | `05-rules.md` Rule 3 |
| Use model instance for context only | `05-rules.md` Rule 4 |
| Implement both get and set | `05-rules.md` Rule 5 |

### Success Criteria
- Bidirectional cast handles reads and writes correctly
- Null values are preserved (not auto-coerced)
- `set()` accepts both scalars and typed objects
- No I/O happens inside cast methods
