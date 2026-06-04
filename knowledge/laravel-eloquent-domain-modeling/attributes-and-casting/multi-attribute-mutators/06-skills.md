# Multi-Attribute Mutators — Skills

---

## Skill 1: Define a Multi-Attribute Mutator for Coupled Columns

### Purpose
Create a multi-attribute mutator that returns an associative array from the `set` closure, updating multiple model columns atomically from a single property assignment.

### When To Use
- A single conceptual value maps to multiple database columns
- Setting one value should automatically update a related timestamp or counter
- You need to maintain denormalized data consistently

### When NOT To Use
- The related attributes are in different models (use model events or actions)
- The multi-attribute update should be conditional on business logic (use explicit model methods)
- The attributes are unrelated — multi-attribute implies a logical relationship

### Prerequisites
- Understanding of `Attribute::make()` syntax
- All target columns are in the model's `$fillable` array

### Inputs
- Attribute name
- Set closure that returns associative array
- Columns to update with their corresponding values

### Workflow

1. **Define the attribute method** returning `Attribute::make()`:
   ```php
   protected function password(): Attribute
   {
       return Attribute::make(
           set: fn (string $value) => [
               'password' => bcrypt($value),
               'password_changed_at' => now(),
           ],
       );
   }
   ```

2. **Document the multi-attribute relationship** with a docblock:
   ```php
   /**
    * Multi-attribute mutator: sets 'password' (hashed) and
    * 'password_changed_at' (current timestamp) atomically.
    */
   ```

3. **Verify all returned keys are in `$fillable`** — unguarded or explicitly fillable

4. **Keep the closure free of side effects** — no `request()`, `auth()`, or API calls

5. **Use explicit model methods** for complex business logic beyond simple mapping

### Validation Checklist
- [ ] Multi-attribute mutator returns an associative array with valid column keys
- [ ] Mutator has no side effects beyond the model's own attributes
- [ ] Multi-attribute relationship is documented in code comments
- [ ] All returned keys are in `$fillable` or not guarded

### Common Failures
| Failure | Cause | Prevention |
|---|---|---|
| Some columns not updated | Keys not in `$fillable` | Ensure fillable includes all returned keys |
| Runtime exception in console | `request()` called in set closure | Keep mutators free of global state |
| Expensive operation blocks request | API call or DB query in mutator | Defer to queued jobs or explicit methods |

### Decision Points
- **Simple mapping?** → Multi-attribute mutator is appropriate
- **Involves business validation?** → Use explicit model method
- **Needs external API?**

### Performance Considerations
- Multi-attribute mutators add no extra queries — changes are in-memory before `save()`
- Avoid expensive operations inside the set closure (runs synchronously on assignment)

### Related Rules
| Rule | Reference |
|---|---|
| Document multi-attribute relationships in code comments | `05-rules.md` |
| Return explicit key-value arrays from set closures | `05-rules.md` |
| Ensure array keys correspond to fillable attributes | `05-rules.md` |
| Do not use multi-attribute mutators as business logic substitutes | `05-rules.md` |

### Related Skills
| Skill | Relationship |
|---|---|
| Define a Cached Accessor | Read-side counterpart |
| Define a Mutator | Single-attribute mutator basics |
| Configure Hashed Casting | Alternative for password hashing |

### Success Criteria
- Single assignment updates multiple columns atomically
- Multi-attribute behavior is documented in code
- No side effects or global state access in the closure
- All returned keys are properly guarded or fillable
