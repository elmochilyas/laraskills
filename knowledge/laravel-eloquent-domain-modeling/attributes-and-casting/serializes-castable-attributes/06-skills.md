# SerializesCastableAttributes — Skills

---

## Skill 1: Implement SerializesCastableAttributes for Custom JSON Output

### Purpose
Implement the `SerializesCastableAttributes` interface on a custom cast to control how cast attributes appear in JSON/array serialization, separating the in-application representation from the API representation.

### When To Use
- The PHP representation differs from the API representation (Money as cents → formatted amount)
- You want to control how value objects appear in API responses without API Resources
- You need consistent serialization across all models using the value object

### When NOT To Use
- The PHP and API representations are identical (don't add the extra method)
- Serialization logic varies per model or context (use API Resources instead)
- You need access to the request context for serialization decisions

### Prerequisites
- Custom cast implementing `CastsAttributes`
- Understanding of the difference between `get()` and `serialize()`

### Inputs
- Value object instance from `get()`
- Desired API representation format

### Workflow

1. **Implement `SerializesCastableAttributes`** on the cast class:
   ```php
   class MoneyCast implements CastsAttributes, SerializesCastableAttributes
   {
       public function get(Model $model, string $key, mixed $value, array $attributes): Money
       {
           return Money::fromCents($value);
       }
   
       public function serialize(Model $model, string $key, mixed $value, array $attributes): array
       {
           return [
               'amount' => $value->format(),
               'currency' => $value->currency(),
           ];
       }
   
       public function set(Model $model, string $key, mixed $value, array $attributes): array
       {
           return [$key => $value->toCents()];
       }
   }
   ```

2. **Return plain arrays or scalars** — must be JSON-serializable

3. **Do not access model state** in `serialize()` for business logic or authorization

4. **Keep `serialize()` focused on format conversion** — no business rules or filtering

5. **Only implement when needed** — omit `serialize()` if `get()` value is already the desired representation

### Validation Checklist
- [ ] `serialize()` method returns JSON-serializable values
- [ ] `serialize()` does not access model state for business logic
- [ ] PHP representation and API representation intentionally differ
- [ ] No business rules or filtering inside `serialize()`

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| JSON serialization fails | Returning non-serializable objects | Return plain arrays/scalars |
| N+1 in serialization | Loading relationships in `serialize()` | Never access model state |
| Inconsistent API output | `serialize()` missing for some casts | Confirm implementation per cast |

### Decision Points
- **Same representation as PHP?** → Do not implement `serialize()`
- **Different per model?** → Use API Resources instead
- **Consistent across all uses?** → Implement `SerializesCastableAttributes`

### Related Rules
| Rule | Reference |
|---|---|
| Return plain arrays or scalars from serialize() | `05-rules.md` |
| Do not access model state in serialize() | `05-rules.md` |
| Keep serialize() focused on format conversion | `05-rules.md` |
| Only implement when representation differs | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Create a Money/Email/Address Value Object | Common use case for this interface |
| Design an Immutable Value Object | Value objects that need custom serialization |
| Implement Custom Casts with Castable Interface | Prerequisite for this interface |

### Success Criteria
- Cast attribute serializes to the desired format in JSON/array output
- No business logic or model state access in `serialize()`
- `serialize()` returns only JSON-serializable types
- Implementation exists only when PHP and API representations differ
