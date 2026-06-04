# Enum Casts — Skills

---

## Skill 1: Cast an Attribute to a PHP Backed Enum

### Purpose
Register an Eloquent attribute to cast to a PHP backed enum, providing type-safe comparisons and automatic serialization between the database scalar value and enum instance.

### When To Use
- A column stores a finite set of valid values (status, type, category)
- You want type-safe comparisons instead of string/integer constants
- You want PHP-level validation rejecting invalid values

### When NOT To Use
- The set of values changes frequently (add/remove = schema change)
- The column stores free-form text
- You need runtime-extensible sets of values

### Prerequisites
- PHP 8.1+ backed enum class defined with explicit backing values
- Database column stores the enum's scalar value

### Inputs
- Enum class name (backed by string or int)
- Enum case to value mapping
- Database column type matching the backing type

### Workflow

1. **Define the backed enum** with explicit backing values:
   ```php
   enum InvoiceStatus: string
   {
       case Draft = 'draft';
       case Sent = 'sent';
       case Paid = 'paid';
       case Cancelled = 'cancelled';
   }
   ```

2. **Add to `$casts`** using the enum class name:
   ```php
   protected $casts = [
       'status' => InvoiceStatus::class,
   ];
   ```

3. **Ensure the database column type** matches the backing type (string or int)

4. **Use type-safe comparisons**:
   ```php
   $invoice->status === InvoiceStatus::Paid;
   ```

5. **Handle null from invalid database values** — `from()` throws `\ValueError` for invalid values

### Validation Checklist
- [ ] Enum is backed by string or int (not unit enum for DB columns)
- [ ] Enum cases have explicit backing values
- [ ] Null handling is in place for potentially invalid database values
- [ ] Enum is used in model casts, not manual conversion

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| TypeError comparing null | Invalid enum value in database | Handle null before comparison |
| Data corruption on rename | Unit enum case renamed | Use backed enums only |
| Cast not working | Missing enum class in $casts | Register with `Enum::class` syntax |

### Decision Points
- **Single value?** → Use `Enum::class` in `$casts`
- **JSON array of enums?** → Use `AsEnumCollection` with colon-separated class
- **State machine with transitions?** → Add `canTransitionTo()` methods

### Performance Considerations
- Enum casts are fast — `from()` is a simple lookup
- `\ValueError` on invalid values is caught internally; no performance impact for valid data

### Security Considerations
- Enum validation ensures only defined values are accepted — protects against invalid data injection
- Invalid enum values from the database return `null` — handle null checks

### Related Rules
| Rule | Reference |
|---|---|
| Always use backed enums for database storage | `05-rules.md` |
| Define enum cases with explicit backing values | `05-rules.md` |
| Handle null from invalid database values | `05-rules.md` |
| Use enums for state machines with transition methods | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Cast a JSON Column to a Typed Collection | AsEnumCollection for arrays of enums |
| Configure a Custom State Machine | Enums as state machine foundation |
| Implement a Transition Guard | Guard conditions on enum transitions |

### Success Criteria
- Model attribute returns typed enum instance from DB read
- Invalid database values return null (not runtime errors)
- Enum instance serializes to its backing value in JSON/array output
- Type-safe comparisons used instead of string constants
