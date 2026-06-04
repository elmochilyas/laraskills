# Mutator Patterns — Skills

---

## Skill 1: Define a Mutator with Attribute::make

### Purpose
Create a write-side attribute mutator using `Attribute::make(set: fn (...))` that transforms or normalizes values on assignment before they reach the database.

### When To Use
- You need to normalize input values on assignment (trimming, formatting, hashing)
- You want to enforce domain rules at the attribute boundary (email lowercase, phone formatting)
- The mutation is a pure transformation with no side effects

### When NOT To Use
- The mutation depends on other model attributes (use a model event like `saving`)
- The mutation has side effects (write to another table, call API)
- A cast already handles the transformation (use casting instead)

### Prerequisites
- Attribute identified for write transformation
- Understanding of `Attribute::make(set: ...)` syntax

### Inputs
- Attribute name
- Normalization/transformation logic
- Expected value type after mutation

### Workflow

1. **Define a protected method** returning `Attribute` with a `set` closure:
   ```php
   protected function email(): Attribute
   {
       return Attribute::make(
           set: fn (string $value) => strtolower(trim($value)),
       );
   }
   ```

2. **Access other attributes** via `$this->attributes` array in the closure

3. **Return the value** — the set closure primitive value or array of attribute key-value pairs

4. **Keep the set closure pure** — no DB queries, API calls, or side effects

5. **Type-hint the `$value` parameter** for clarity and static analysis

### Validation Checklist

- [ ] Uses `Attribute::make(set: fn ($value) => ...)` syntax
- [ ] No side effects in the set closure (DB, API, events)
- [ ] Value is type-hinted in the closure parameter
- [ ] Return type matches the expected attribute type
- [ ] If returning array, it uses column => value pairs for multi-attribute sets
- [ ] Model event (`saving`, `creating`) is used instead if cross-attribute logic is needed

### Related Rules

| Rule | Reference |
|---|---|
| Use Attribute::make with set closure | `05-rules.md` Rule 1 |
| Keep mutators pure with no side effects | `05-rules.md` Rule 2 |
| Type-hint mutator value parameters | `05-rules.md` Rule 3 |
| Use model events for cross-attribute logic | `05-rules.md` Rule 4 |
| Return only the transformed value, not array | `05-rules.md` Rule 5 |

### Success Criteria
- Mutator normalizes the value on assignment
- Side effects are absent (no DB, API, or event dispatch)
- Type-hinted parameter enables static analysis
- Accessor counterpart exists if read transformation is also needed
