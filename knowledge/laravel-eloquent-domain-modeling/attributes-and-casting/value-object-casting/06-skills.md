# Value Object Casting — Skills

---

## Skill 1: Cast an Attribute to a Value Object

### Purpose
Build a custom cast that hydrates a value object from the database on read and serializes it back on write, ensuring type safety and domain semantics.

### When To Use
- An attribute has domain meaning (email, money, address, color)
- You want type safety and validation at the attribute level
- The same value object type is used across models or in business logic

### When NOT To Use
- The value is a simple scalar with no domain rules
- The value object is only used in one place (primitive + accessor may be simpler)
- Performance requirements demand zero-allocation reads

### Prerequisites
- Value object class with `readonly` properties and constructor validation
- Cast class implementing `CastsAttributes`

### Inputs
- Value object class name
- Cast class name
- Attribute name on the model

### Workflow

1. **Create a custom cast class** implementing `CastsAttributes`

2. **In `get()`** — instantiate the value object from stored data:
   ```php
   public function get(Model $model, string $key, mixed $value, array $attributes): ?Email
   {
       return $value === null ? null : new Email($value);
   }
   ```

3. **In `set()`** — extract the scalar from the value object for storage:
   ```php
   public function set(Model $model, string $key, mixed $value, array $attributes): array
   {
       if ($value === null) { return [$key => null]; }
       if ($value instanceof Email) { return [$key => $value->value]; }
       if (is_string($value)) { return [$key => $value]; }
       throw new InvalidArgumentException('Expected Email instance or string');
   }
   ```

4. **Handle null explicitly** in both methods

5. **Accept both value object and raw scalar** in `set()` for flexibility

6. **Register in `$casts`**: `'email' => EmailCast::class`

7. **Implement `Castable`** on the value object if it's used across multiple models

### Validation Checklist

- [ ] Both `get()` and `set()` are implemented in the cast class
- [ ] Null values are handled explicitly (return null from get, accept null in set)
- [ ] `set()` accepts both value objects and raw scalars
- [ ] Cast performs validation (value object constructor does it)
- [ ] Value object is immutable (readonly properties)
- [ ] No DB queries or external calls in cast methods
- [ ] Castable is used if value object appears on multiple models

### Related Rules

| Rule | Reference |
|---|---|
| Handle null explicitly in get and set | `05-rules.md` Rule 1 |
| Accept both VO and scalar in set | `05-rules.md` Rule 2 |
| Delegate validation to VO constructor | `05-rules.md` Rule 3 |
| Keep cast methods fast — no I/O | `05-rules.md` Rule 4 |
| Use Castable for multi-model VOs | `05-rules.md` Rule 5 |

### Success Criteria
- Model attribute returns a typed value object instance from DB read
- Writing a value object serializes its scalar value to the database
- Writing a raw scalar also works (is normalized to a VO internally)
- Null values are round-tripped correctly
- Invalid data in the database throws a meaningful cast error
