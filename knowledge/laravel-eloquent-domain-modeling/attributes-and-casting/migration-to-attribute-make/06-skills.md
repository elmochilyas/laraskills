# Migration to Attribute::make — Skills

---

## Skill 1: Bulk Migrate All Legacy Accessors in a Model

### Purpose
Systematically convert all legacy accessor and mutator methods in a single model to `Attribute::make()` syntax in one pass.

### When To Use
- A model has multiple legacy accessors/mutators to migrate
- You have test coverage for the model's attributes
- You're modernizing model code as part of a larger refactor

### When NOT To Use
- The model has no test coverage (migrate incrementally with manual verification)
- The model is too large or complex for a single migration session

### Prerequisites
- Laravel 9+ project
- List of all legacy accessors and mutators in the model
- Test suite that covers attribute behavior

### Inputs
- Model file path
- List of legacy methods to migrate

### Workflow

1. **Audit the model** — search for `get.*Attribute`, `set.*Attribute` methods

2. **Document the current signature and return type** of each accessor/mutator

3. **For each accessor** — replace `get{Name}Attribute($value)` with `Attribute::make(get: fn ($value) => ...)`

4. **For each mutator** — replace `set{Name}Attribute($value)` with `Attribute::make(set: fn ($value) => ...)`

5. **For bidirectional** — combine in a single `Attribute::make(get: fn, set: fn)`

6. **Verify return types** — the closure return may differ from the method signature

7. **Run tests** — assert attribute values are identical before and after migration

8. **Add `shouldCache: true`** selectively where profiling proves benefit

### Validation Checklist

- [ ] All legacy get methods converted to `Attribute::make(get: ...)`
- [ ] All legacy set methods converted to `Attribute::make(set: ...)`
- [ ] Bidirectional methods share a single `Attribute::make()`
- [ ] Return values match before/after migration
- [ ] `shouldCache` is not added indiscriminately
- [ ] No legacy accessor/mutator methods remain
- [ ] Test suite passes

### Related Rules

| Rule | Reference |
|---|---|
| Convert all accessors/mutators in one pass per model | `05-rules.md` Rule 1 |
| Combine get+set into a single Attribute::make | `05-rules.md` Rule 2 |
| Verify return types after migration | `05-rules.md` Rule 3 |
| Gate shouldCache on profiling results | `05-rules.md` Rule 4 |
| Do not keep legacy methods for "backward compatibility" | `05-rules.md` Rule 5 |

### Success Criteria
- All accessors and mutators in the model use `Attribute::make`
- Before/after attribute values are identical (tests pass)
- No legacy accessor/mutator methods remain
- `shouldCache` is set only where profiling supports it
